
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DifficultyLevel, SentenceMiningSession, SentenceMiningExercise, SentenceMiningProgress } from '@/types/sentence-mining';
import { useSentenceMining } from './use-sentence-mining';
import { AdaptiveDifficultyEngine } from '@/services/adaptiveDifficultyEngine';
import { SmartContentGenerator, VocabularyProfile } from '@/services/smartContentGenerator';
import { PersonalizedLearningPath } from '@/services/personalizedLearningPath';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';

export const useAdaptiveSentenceMining = () => {
  const { settings } = useUserSettingsContext();
  const baseMining = useSentenceMining();
  
  const [vocabularyProfile, setVocabularyProfile] = useState<VocabularyProfile | null>(null);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<DifficultyLevel | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (settings.selectedLanguage) {
      loadVocabularyProfile();
    }
  }, [settings.selectedLanguage]);

  const loadVocabularyProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoadingProfile(true);
    try {
      const profile = await SmartContentGenerator.generateVocabularyProfile(
        user.id,
        settings.selectedLanguage
      );
      setVocabularyProfile(profile);
    } catch (error) {
      console.error('Error loading vocabulary profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const startAdaptiveSession = async (initialDifficulty: DifficultyLevel) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Analyze user performance for difficulty adjustment
      const analysis = await AdaptiveDifficultyEngine.analyzeUserPerformance(
        user.id,
        settings.selectedLanguage,
        initialDifficulty
      );

      // Use suggested difficulty if confidence is high
      const finalDifficulty = analysis.shouldAdjust ? analysis.suggestedLevel : initialDifficulty;
      
      if (analysis.shouldAdjust) {
        toast.info(`AI suggests ${finalDifficulty} difficulty based on your performance`);
        setAdaptiveDifficulty(finalDifficulty);
      }

      // Start session with the determined difficulty
      return await baseMining.startSession(finalDifficulty);
    } catch (error) {
      console.error('Error starting adaptive session:', error);
      // Fallback to base implementation
      return await baseMining.startSession(initialDifficulty);
    }
  };

  const generateSmartExercise = async (sessionId: string, difficulty: DifficultyLevel) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !vocabularyProfile) {
      // Fallback to basic generation
      return;
    }

    try {
      // Get failure patterns
      const failurePatterns = await SmartContentGenerator.detectFailurePatterns(
        user.id,
        settings.selectedLanguage
      );

      // Optimize word selection
      const wordSelection = PersonalizedLearningPath.optimizeWordSelection(
        vocabularyProfile,
        difficulty
      );

      // Get previous exercises to avoid repetition
      const { data: previousExercises } = await supabase
        .from('sentence_mining_exercises')
        .select('sentence')
        .eq('session_id', sessionId);

      // Generate enhanced content parameters
      const enhancedParams = await SmartContentGenerator.enhanceGenerationPrompt({
        difficulty,
        language: settings.selectedLanguage,
        userId: user.id,
        sessionId,
        vocabularyProfile,
        failurePatterns,
        previousSentences: previousExercises?.map(e => e.sentence) || []
      });

      console.log('Using adaptive content generation with:', {
        priorityWords: wordSelection.priorityWords.slice(0, 3),
        newWordRatio: wordSelection.newWordRatio,
        strugglingWords: vocabularyProfile.strugglingWords.length
      });

      // Note: The actual generation still uses the existing edge function
      // but we've prepared enhanced parameters that could be used
    } catch (error) {
      console.error('Error in smart exercise generation:', error);
    }
  };

  const trackAdaptivePerformance = async (
    exerciseId: string,
    word: string,
    isCorrect: boolean
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Track word performance for adaptive learning
      await SmartContentGenerator.trackWordPerformance(
        user.id,
        word,
        settings.selectedLanguage,
        isCorrect
      );

      // Reload vocabulary profile after tracking
      await loadVocabularyProfile();
    } catch (error) {
      console.error('Error tracking adaptive performance:', error);
    }
  };

  const submitAnswerWithAdaptiveTracking = async (response: string, selectedWords: string[] = [], isSkipped: boolean = false) => {
    // Call the base submit method
    await baseMining.submitAnswer(response, selectedWords, isSkipped);

    // Add adaptive tracking
    if (baseMining.currentExercise && !isSkipped) {
      await trackAdaptivePerformance(
        baseMining.currentExercise.id,
        baseMining.currentExercise.targetWord,
        baseMining.isCorrect
      );
    }
  };

  // Override the generateNextExercise to include smart generation
  const nextExerciseWithAdaptation = useCallback(async () => {
    if (baseMining.currentSession) {
      await generateSmartExercise(
        baseMining.currentSession.id,
        baseMining.currentSession.difficulty_level as DifficultyLevel
      );
    }
    baseMining.nextExercise();
  }, [baseMining.currentSession, vocabularyProfile]);

  return {
    // Base mining functionality
    ...baseMining,
    
    // Override specific methods with adaptive versions
    startSession: startAdaptiveSession,
    submitAnswer: submitAnswerWithAdaptiveTracking,
    nextExercise: nextExerciseWithAdaptation,
    
    // Additional adaptive features
    vocabularyProfile,
    adaptiveDifficulty,
    loadingProfile,
    loadVocabularyProfile
  };
};
