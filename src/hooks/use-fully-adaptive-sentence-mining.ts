
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DifficultyLevel } from '@/types/sentence-mining';
import { useSentenceMining } from './use-sentence-mining';
import { EnhancedAdaptiveDifficultyEngine, SmartSessionConfig } from '@/services/enhancedAdaptiveDifficultyEngine';
import { SmartContentGenerator, VocabularyProfile } from '@/services/smartContentGenerator';
import { PersonalizedLearningPath } from '@/services/personalizedLearningPath';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_SESSION_CONFIG: SmartSessionConfig = {
  suggestedDifficulty: 'intermediate',
  confidence: 0.5,
  reasoning: ['Using default difficulty level'],
  fallbackDifficulty: 'intermediate'
};

export const useFullyAdaptiveSentenceMining = () => {
  const { settings } = useUserSettingsContext();
  const baseMining = useSentenceMining();
  
  const [vocabularyProfile, setVocabularyProfile] = useState<VocabularyProfile | null>(null);
  const [sessionConfig, setSessionConfig] = useState<SmartSessionConfig>(DEFAULT_SESSION_CONFIG);
  const [loadingOptimalDifficulty, setLoadingOptimalDifficulty] = useState(false);
  const [isInitializingSession, setIsInitializingSession] = useState(false);
  const [exerciseCount, setExerciseCount] = useState(0);

  useEffect(() => {
    if (settings.selectedLanguage) {
      loadVocabularyProfile();
      loadOptimalDifficulty();
    }
  }, [settings.selectedLanguage]);

  // Monitor for mid-session adjustments
  useEffect(() => {
    if (baseMining.currentSession && exerciseCount > 0 && exerciseCount % 3 === 0) {
      checkForMidSessionAdjustment();
    }
  }, [exerciseCount, baseMining.currentSession]);

  const loadVocabularyProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const profile = await SmartContentGenerator.generateVocabularyProfile(
        user.id,
        settings.selectedLanguage
      );
      setVocabularyProfile(profile);
    } catch (error) {
      console.error('Error loading vocabulary profile:', error);
      // Set a basic profile if loading fails
      setVocabularyProfile({
        knownWords: [],
        strugglingWords: [],
        masteredWords: [],
        wordFrequency: {}
      });
    }
  };

  const loadOptimalDifficulty = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSessionConfig(DEFAULT_SESSION_CONFIG);
      return;
    }

    setLoadingOptimalDifficulty(true);
    try {
      const config = await EnhancedAdaptiveDifficultyEngine.determineOptimalStartingDifficulty(
        user.id,
        settings.selectedLanguage
      );
      setSessionConfig(config);
      
      console.log('Adaptive difficulty analysis:', config);
    } catch (error) {
      console.error('Error determining optimal difficulty:', error);
      // Always ensure we have a valid configuration
      setSessionConfig({
        suggestedDifficulty: 'intermediate',
        confidence: 0.3,
        reasoning: ['Using fallback difficulty due to analysis error'],
        fallbackDifficulty: 'intermediate'
      });
    } finally {
      setLoadingOptimalDifficulty(false);
    }
  };

  const startAdaptiveSession = async () => {
    setIsInitializingSession(true);
    try {
      const difficulty = sessionConfig.confidence >= 0.6 
        ? sessionConfig.suggestedDifficulty 
        : sessionConfig.fallbackDifficulty;

      // Show reasoning to user only if it's not a fallback
      if (sessionConfig.reasoning.length > 0 && !sessionConfig.reasoning[0].includes('fallback')) {
        toast.info(`Starting with ${difficulty} difficulty: ${sessionConfig.reasoning[0]}`);
      }

      setExerciseCount(0);
      return await baseMining.startSession(difficulty);
    } catch (error) {
      console.error('Error starting adaptive session:', error);
      // Even if adaptive session fails, try to start a basic session
      try {
        return await baseMining.startSession('intermediate');
      } catch (fallbackError) {
        console.error('Fallback session also failed:', fallbackError);
        toast.error('Failed to start session. Please try again.');
        throw fallbackError;
      }
    } finally {
      setIsInitializingSession(false);
    }
  };

  const checkForMidSessionAdjustment = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !baseMining.currentSession) return;

    try {
      const analysis = await EnhancedAdaptiveDifficultyEngine.evaluateMidSessionAdjustment(
        baseMining.currentSession.id,
        user.id,
        settings.selectedLanguage,
        baseMining.currentSession.difficulty_level as DifficultyLevel
      );

      if (analysis && analysis.shouldAdjust) {
        toast.info(`AI suggests switching to ${analysis.suggestedLevel} difficulty - ${analysis.reasons[0]}`, {
          action: {
            label: 'Apply',
            onClick: () => {
              // In a real implementation, you might want to adjust the session difficulty
              console.log('Mid-session difficulty adjustment:', analysis);
            }
          },
        });
      }
    } catch (error) {
      console.error('Error checking for mid-session adjustment:', error);
      // Silently fail for mid-session adjustments as they're not critical
    }
  };

  const generateSmartExercise = async (sessionId: string, difficulty: DifficultyLevel) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !vocabularyProfile) return;

    try {
      const failurePatterns = await SmartContentGenerator.detectFailurePatterns(
        user.id,
        settings.selectedLanguage
      );

      const wordSelection = PersonalizedLearningPath.optimizeWordSelection(
        vocabularyProfile,
        difficulty
      );

      console.log('Smart exercise generation:', {
        priorityWords: wordSelection.priorityWords.slice(0, 3),
        failurePatterns: failurePatterns.slice(0, 3),
        difficulty
      });
    } catch (error) {
      console.error('Error in smart exercise generation:', error);
      // Don't throw error as this is enhancement, not core functionality
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
      await SmartContentGenerator.trackWordPerformance(
        user.id,
        word,
        settings.selectedLanguage,
        isCorrect
      );

      setExerciseCount(prev => prev + 1);
      await loadVocabularyProfile();
    } catch (error) {
      console.error('Error tracking adaptive performance:', error);
      // Still increment exercise count even if tracking fails
      setExerciseCount(prev => prev + 1);
    }
  };

  const submitAnswerWithAdaptiveTracking = async (
    response: string, 
    selectedWords: string[] = [], 
    isSkipped: boolean = false
  ) => {
    await baseMining.submitAnswer(response, selectedWords, isSkipped);

    if (baseMining.currentExercise && !isSkipped) {
      await trackAdaptivePerformance(
        baseMining.currentExercise.id,
        baseMining.currentExercise.targetWord,
        baseMining.isCorrect
      );
    }
  };

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
    submitAnswer: submitAnswerWithAdaptiveTracking,
    nextExercise: nextExerciseWithAdaptation,
    
    // Adaptive session management
    startAdaptiveSession,
    sessionConfig,
    loadingOptimalDifficulty,
    isInitializingSession,
    
    // Additional adaptive features
    vocabularyProfile,
    exerciseCount,
    loadVocabularyProfile
  };
};
