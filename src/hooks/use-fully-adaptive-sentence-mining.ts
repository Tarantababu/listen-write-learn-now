
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

// Helper function to validate and sanitize difficulty levels
const validateDifficultyLevel = (difficulty: any, context: string): DifficultyLevel => {
  const validLevels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
  
  console.log(`[validateDifficultyLevel] Validating difficulty in ${context}:`, difficulty);
  
  if (!difficulty) {
    console.warn(`[validateDifficultyLevel] Null/undefined difficulty in ${context}, defaulting to intermediate`);
    return 'intermediate';
  }
  
  // Handle object or complex types - extract string value
  if (typeof difficulty === 'object' && difficulty !== null) {
    if (difficulty.difficulty) return validateDifficultyLevel(difficulty.difficulty, `${context} (nested)`);
    if (difficulty.value) return validateDifficultyLevel(difficulty.value, `${context} (value prop)`);
    if (difficulty.level) return validateDifficultyLevel(difficulty.level, `${context} (level prop)`);
    difficulty = String(difficulty);
  }

  // Ensure it's a string and lowercase
  const cleanLevel = String(difficulty).toLowerCase().trim();
  
  // Validate against allowed values
  if (validLevels.includes(cleanLevel as DifficultyLevel)) {
    console.log(`[validateDifficultyLevel] Valid difficulty in ${context}:`, cleanLevel);
    return cleanLevel as DifficultyLevel;
  }
  
  console.warn(`[validateDifficultyLevel] Invalid difficulty level in ${context}:`, difficulty, 'falling back to intermediate');
  return 'intermediate';
};

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
      console.log(`[useFullyAdaptiveSentenceMining] Language changed from ${currentLanguage} to ${settings.selectedLanguage}`);
      setCurrentLanguage(settings.selectedLanguage);
      setSessionConfig(null);
      setExerciseCount(0);
      
      // End current session if active to prevent cross-language contamination
      if (adaptiveMining.currentSession) {
        console.log('[useFullyAdaptiveSentenceMining] Ending current session due to language change');
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
      console.log(`[loadOptimalDifficulty] Loading optimal difficulty for ${settings.selectedLanguage}`);
      
      const analysis = await EnhancedAdaptiveDifficultyEngine.determineOptimalStartingDifficulty(
        user.id,
        settings.selectedLanguage
      );

      console.log(`[loadOptimalDifficulty] Raw analysis result:`, analysis);

      // Validate the suggested difficulty
      const validatedDifficulty = validateDifficultyLevel(
        analysis.suggestedDifficulty, 
        'loadOptimalDifficulty analysis'
      );

      const validatedFallback = validateDifficultyLevel(
        analysis.fallbackDifficulty, 
        'loadOptimalDifficulty fallback'
      );

      const validatedConfig: SmartSessionConfig = {
        suggestedDifficulty: validatedDifficulty,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        fallbackDifficulty: validatedFallback
      };

      console.log(`[loadOptimalDifficulty] Validated session config:`, validatedConfig);
      setSessionConfig(validatedConfig);

      console.log(`[loadOptimalDifficulty] Optimal difficulty determined for ${settings.selectedLanguage}:`, validatedConfig);
    } catch (error) {
      console.error(`[loadOptimalDifficulty] Error determining optimal difficulty for ${settings.selectedLanguage}:`, error);
      // Fallback to intermediate difficulty with validation
      const fallbackConfig: SmartSessionConfig = {
        suggestedDifficulty: 'intermediate',
        confidence: 0.5,
        reasoning: ['Fallback to intermediate due to analysis error'],
        fallbackDifficulty: 'intermediate'
      };
      console.log(`[loadOptimalDifficulty] Using fallback config:`, fallbackConfig);
      setSessionConfig(fallbackConfig);
    } finally {
      setLoadingOptimalDifficulty(false);
    }
  };

  const startAdaptiveSession = async (manualDifficulty?: DifficultyLevel) => {
    console.log(`[startAdaptiveSession] Starting session with manual difficulty:`, manualDifficulty, 'sessionConfig:', sessionConfig);
    
    if (!sessionConfig) {
      console.error('[startAdaptiveSession] No session config available');
      toast.error('Session configuration not ready. Please try again.');
      return;
    }

    setIsInitializingSession(true);
    setExerciseCount(0);
    
    try {
      // Use manual difficulty if provided, otherwise use the AI-determined optimal difficulty
      const rawDifficulty = manualDifficulty || sessionConfig.suggestedDifficulty;
      
      // Validate the difficulty before using it
      const difficulty = validateDifficultyLevel(rawDifficulty, 'startAdaptiveSession');
      
      console.log(`[startAdaptiveSession] Final validated difficulty: ${difficulty} for language: ${settings.selectedLanguage}`);
      console.log(`[startAdaptiveSession] Original values - manual: ${manualDifficulty}, suggested: ${sessionConfig.suggestedDifficulty}`);
      
      if (difficulty !== sessionConfig.suggestedDifficulty && !manualDifficulty) {
        console.warn(`[startAdaptiveSession] Difficulty was corrected from ${sessionConfig.suggestedDifficulty} to ${difficulty}`);
        toast.warning(`Difficulty was corrected to ${difficulty} for safety`);
      } else if (manualDifficulty && difficulty !== sessionConfig.suggestedDifficulty) {
        toast.info(`Starting ${difficulty} session (AI suggested ${sessionConfig.suggestedDifficulty})`);
      } else {
        toast.success(`Starting AI-optimized ${difficulty} session for ${settings.selectedLanguage}`);
      }

      console.log(`[startAdaptiveSession] About to call adaptiveMining.startSession with difficulty:`, difficulty);
      return await adaptiveMining.startSession(difficulty);
    } catch (error) {
      console.error('[startAdaptiveSession] Error in startAdaptiveSession:', error);
      toast.error('Failed to start adaptive session');
      throw error;
    } finally {
      setIsInitializingSession(false);
    }
  };

  const enhancedSubmitAnswer = useCallback(async (response: string, selectedWords: string[] = [], isSkipped: boolean = false) => {
    console.log(`[enhancedSubmitAnswer] Submitting answer - response: ${response}, isSkipped: ${isSkipped}`);
    // Call the adaptive submit method which includes performance tracking
    await adaptiveMining.submitAnswer(response, selectedWords, isSkipped);
  }, [adaptiveMining.submitAnswer]);

  const enhancedNextExercise = useCallback(async () => {
    console.log(`[enhancedNextExercise] Moving to next exercise`);
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
