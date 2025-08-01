
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DifficultyLevel, SentenceMiningSession, SentenceMiningExercise, SentenceMiningProgress } from '@/types/sentence-mining';
import { useSentenceMining } from './use-sentence-mining';
import { useAdaptiveSentenceMining } from './use-adaptive-sentence-mining';
import { AdaptiveDifficultyEngine } from '@/services/adaptiveDifficultyEngine';
import { SmartContentGenerator, VocabularyProfile } from '@/services/smartContentGenerator';
import { EnhancedAdaptiveDifficultyEngine, SmartSessionConfig } from '@/services/enhancedAdaptiveDifficultyEngine';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';

export const useFullyAdaptiveSentenceMining = () => {
  const { settings } = useUserSettingsContext();
  const adaptiveMining = useAdaptiveSentenceMining();
  
  // Enhanced state for fully adaptive features
  const [sessionConfig, setSessionConfig] = useState<SmartSessionConfig | null>(null);
  const [loadingOptimalDifficulty, setLoadingOptimalDifficulty] = useState(false);
  const [isInitializingSession, setIsInitializingSession] = useState(false);
  const [exerciseCount, setExerciseCount] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState(settings.selectedLanguage);

  // Reset state when language changes
  useEffect(() => {
    if (currentLanguage !== settings.selectedLanguage) {
      console.log(`Language changed from ${currentLanguage} to ${settings.selectedLanguage}`);
      setCurrentLanguage(settings.selectedLanguage);
      setSessionConfig(null);
      setExerciseCount(0);
      
      // End current session if active to prevent cross-language contamination
      if (adaptiveMining.currentSession) {
        console.log('Ending current session due to language change');
        adaptiveMining.endSession();
      }
    }
  }, [settings.selectedLanguage, currentLanguage, adaptiveMining.currentSession]);

  // Load optimal difficulty when component mounts or language changes
  useEffect(() => {
    loadOptimalDifficulty();
  }, [settings.selectedLanguage]);

  // Track exercise count
  useEffect(() => {
    if (adaptiveMining.currentExercise) {
      setExerciseCount(prev => prev + 1);
    }
  }, [adaptiveMining.currentExercise]);

  const loadOptimalDifficulty = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoadingOptimalDifficulty(true);
    try {
      console.log(`Loading optimal difficulty for ${settings.selectedLanguage}`);
      
      // Use the correct method name from enhanced adaptive engine
      const analysis = await EnhancedAdaptiveDifficultyEngine.determineOptimalStartingDifficulty(
        user.id,
        settings.selectedLanguage
      );

      setSessionConfig({
        suggestedDifficulty: analysis.suggestedDifficulty,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        fallbackDifficulty: analysis.fallbackDifficulty
      });

      console.log(`Optimal difficulty determined for ${settings.selectedLanguage}:`, analysis);
    } catch (error) {
      console.error(`Error determining optimal difficulty for ${settings.selectedLanguage}:`, error);
      // Fallback to intermediate difficulty
      setSessionConfig({
        suggestedDifficulty: 'intermediate',
        confidence: 0.5,
        reasoning: ['Fallback to intermediate due to analysis error'],
        fallbackDifficulty: 'intermediate'
      });
    } finally {
      setLoadingOptimalDifficulty(false);
    }
  };

  const startAdaptiveSession = async (manualDifficulty?: DifficultyLevel) => {
    if (!sessionConfig) return;

    setIsInitializingSession(true);
    setExerciseCount(0);
    
    try {
      // Use manual difficulty if provided, otherwise use the AI-determined optimal difficulty
      const difficulty = manualDifficulty || sessionConfig.suggestedDifficulty;
      
      console.log(`Starting adaptive session in ${settings.selectedLanguage} with difficulty: ${difficulty}`);
      
      if (difficulty !== sessionConfig.suggestedDifficulty) {
        toast.info(`Starting ${difficulty} session (AI suggested ${sessionConfig.suggestedDifficulty})`);
      } else {
        toast.success(`Starting AI-optimized ${difficulty} session for ${settings.selectedLanguage}`);
      }

      return await adaptiveMining.startSession(difficulty);
    } finally {
      setIsInitializingSession(false);
    }
  };

  const enhancedSubmitAnswer = useCallback(async (response: string, selectedWords: string[] = [], isSkipped: boolean = false) => {
    // Call the adaptive submit method which includes performance tracking
    await adaptiveMining.submitAnswer(response, selectedWords, isSkipped);
  }, [adaptiveMining.submitAnswer]);

  const enhancedNextExercise = useCallback(async () => {
    // Use the adaptive next exercise method
    await adaptiveMining.nextExercise();
  }, [adaptiveMining.nextExercise]);

  return {
    // Base functionality from adaptive mining
    ...adaptiveMining,
    
    // Override methods with enhanced versions
    submitAnswer: enhancedSubmitAnswer,
    nextExercise: enhancedNextExercise,
    
    // Enhanced adaptive features
    sessionConfig,
    loadingOptimalDifficulty,
    isInitializingSession,
    startAdaptiveSession,
    exerciseCount,
    
    // Language-aware helpers
    currentLanguage: settings.selectedLanguage,
    languageChanged: currentLanguage !== settings.selectedLanguage
  };
};
