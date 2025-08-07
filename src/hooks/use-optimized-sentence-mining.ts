
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { DifficultyLevel, SentenceMiningSession, SentenceMiningExercise, SentenceMiningProgress } from '@/types/sentence-mining';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedSentenceMiningService, GenerationResult } from '@/services/enhancedSentenceMiningService';
import { EnhancedCooldownSystem } from '@/services/enhancedCooldownSystem';
import { WordDiversityEngine, WordDiversityMetrics } from '@/services/wordDiversityEngine';
import { IntelligentWordPoolManager, WordPoolStats } from '@/services/intelligentWordPoolManager';

interface OptimizedSentenceMiningState {
  currentSession: SentenceMiningSession | null;
  currentExercise: SentenceMiningExercise | null;
  nextExerciseReady: SentenceMiningExercise | null;
  userResponse: string;
  showResult: boolean;
  isCorrect: boolean;
  loading: boolean;
  error: string | null;
  progress: SentenceMiningProgress | null;
  showHint: boolean;
  showTranslation: boolean;
  isGeneratingNext: boolean;
  
  // Enhanced performance features
  exerciseCount: number;
  averageResponseTime: number;
  sessionQuality: number;
  preloadStatus: 'idle' | 'loading' | 'ready' | 'error';
  
  // New diversity features
  diversityMetrics: WordDiversityMetrics | null;
  wordPoolStats: WordPoolStats | null;
  diversityInsights: string[];
}

export const useOptimizedSentenceMining = () => {
  const { settings } = useUserSettingsContext();
  const [state, setState] = useState<OptimizedSentenceMiningState>({
    currentSession: null,
    currentExercise: null,
    nextExerciseReady: null,
    userResponse: '',
    showResult: false,
    isCorrect: false,
    loading: false,
    error: null,
    progress: null,
    showHint: false,
    showTranslation: false,
    isGeneratingNext: false,
    exerciseCount: 0,
    averageResponseTime: 0,
    sessionQuality: 0,
    preloadStatus: 'idle',
    diversityMetrics: null,
    wordPoolStats: null,
    diversityInsights: []
  });

  const exerciseHistory = useRef<GenerationResult[]>([]);
  const responseTimeHistory = useRef<number[]>([]);
  const exerciseStartTime = useRef<number>(0);

  // Load progress and performance data
  useEffect(() => {
    loadProgress();
  }, [settings.selectedLanguage]);

  // Enhanced diversity tracking
  useEffect(() => {
    if (state.currentSession) {
      updateDiversityMetrics();
    }
  }, [state.currentSession, state.exerciseCount]);

  // Preload next exercise when current exercise is shown
  useEffect(() => {
    if (state.currentExercise && state.currentSession && !state.nextExerciseReady && !state.isGeneratingNext) {
      preloadNextExercise();
    }
  }, [state.currentExercise, state.currentSession]);

  const updateDiversityMetrics = async () => {
    if (!state.currentSession) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get diversity metrics
      const diversityMetrics = await WordDiversityEngine.analyzeSessionDiversity(
        user.id,
        settings.selectedLanguage,
        state.currentSession.id,
        24
      );

      // Get word pool statistics
      const wordPoolStats = await IntelligentWordPoolManager.getWordPoolStats(
        user.id,
        settings.selectedLanguage,
        state.currentSession.difficulty_level
      );

      // Generate insights
      const diversityInsights = WordDiversityEngine.generateDiversityReport(diversityMetrics);

      setState(prev => ({
        ...prev,
        diversityMetrics,
        wordPoolStats,
        diversityInsights
      }));

      console.log(`[OptimizedSentenceMining] Diversity updated: Overall ${diversityMetrics.overallScore}%, Pool: ${wordPoolStats.availableWords}/${wordPoolStats.totalWords}`);
    } catch (error) {
      console.error('[OptimizedSentenceMining] Error updating diversity metrics:', error);
    }
  };

  const loadProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Get sessions for the selected language
      const { data: sessions } = await supabase
        .from('sentence_mining_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('language', settings.selectedLanguage)
        .order('created_at', { ascending: false });

      const totalSessions = sessions?.length || 0;
      const totalExercises = sessions?.reduce((sum, s) => sum + s.total_exercises, 0) || 0;
      const totalCorrect = sessions?.reduce((sum, s) => sum + s.correct_exercises, 0) || 0;
      const averageAccuracy = totalExercises > 0 ? Math.round((totalCorrect / totalExercises) * 100) : 0;

      const progress: SentenceMiningProgress = {
        language: settings.selectedLanguage,
        totalSessions,
        totalExercises,
        totalCorrect,
        averageAccuracy,
        streak: 0,
        vocabularyStats: {
          passiveVocabulary: 0,
          activeVocabulary: 0,
          totalWordsEncountered: 0,
          language: settings.selectedLanguage
        }
      };

      setState(prev => ({ ...prev, progress }));
    } catch (error) {
      console.error('[OptimizedSentenceMining] Error loading progress:', error);
    }
  };

  const startOptimizedSession = async (difficulty: DifficultyLevel) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in to start a session');
      return;
    }

    console.log(`[OptimizedSentenceMining] Starting enhanced diversity-aware session: ${difficulty}`);
    
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      exerciseCount: 0,
      averageResponseTime: 0,
      sessionQuality: 0,
      preloadStatus: 'idle',
      diversityMetrics: null,
      wordPoolStats: null,
      diversityInsights: []
    }));

    try {
      // Create session with enhanced metadata
      const sessionData = {
        user_id: user.id,
        language: settings.selectedLanguage,
        difficulty_level: difficulty,
        exercise_types: ['cloze'],
        total_exercises: 0,
        correct_exercises: 0,
        new_words_encountered: 0,
        words_mastered: 0,
        started_at: new Date().toISOString(),
        session_data: {
          startTime: new Date().toISOString(),
          difficulty: difficulty,
          language: settings.selectedLanguage,
          enhancedFeatures: {
            diversityTracking: true,
            intelligentWordSelection: true,
            smartPreloading: true,
            performanceTracking: true,
            adaptiveCooldown: true,
            contextAwareness: true
          },
          targetDiversityScore: 75
        }
      };

      const { data: session, error } = await supabase
        .from('sentence_mining_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) throw error;

      const newSession: SentenceMiningSession = {
        id: session.id,
        language: session.language,
        difficulty: session.difficulty_level as DifficultyLevel,
        exercises: [],
        currentExerciseIndex: 0,
        startTime: new Date(session.started_at),
        totalCorrect: 0,
        totalAttempts: 0,
        user_id: session.user_id,
        difficulty_level: session.difficulty_level as DifficultyLevel,
        total_exercises: session.total_exercises,
        correct_exercises: session.correct_exercises,
        new_words_encountered: session.new_words_encountered,
        words_mastered: session.words_mastered,
        started_at: session.started_at,
        created_at: session.created_at,
        session_data: session.session_data
      };

      setState(prev => ({ ...prev, currentSession: newSession }));

      // Start enhanced preloading with diversity optimization
      EnhancedSentenceMiningService.preloadExercises(
        user.id,
        settings.selectedLanguage,
        difficulty,
        session.id,
        3
      );

      // Generate first exercise with diversity tracking
      await generateFirstExercise(newSession);
      
      // Initial diversity metrics update
      await updateDiversityMetrics();
      
      toast.success(`Started enhanced ${difficulty} session with smart diversity features`);
      return newSession;
    } catch (error) {
      console.error('[OptimizedSentenceMining] Error starting enhanced session:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to start session' 
      }));
      toast.error('Failed to start enhanced session');
    }
  };

  const generateFirstExercise = async (session: SentenceMiningSession) => {
    setState(prev => ({ ...prev, isGeneratingNext: true, preloadStatus: 'loading' }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      exerciseStartTime.current = Date.now();

      const result = await EnhancedSentenceMiningService.generateExerciseWithEnhancements({
        language: session.language,
        difficulty: session.difficulty_level,
        userId: user.id,
        sessionId: session.id,
        previousExercises: [],
        enhancedMode: true
      });

      exerciseHistory.current.push(result);

      setState(prev => ({
        ...prev,
        currentExercise: result.exercise,
        isGeneratingNext: false,
        preloadStatus: 'ready',
        sessionQuality: result.metadata.selectionQuality
      }));

      console.log(`[OptimizedSentenceMining] First exercise generated with diversity score: ${result.metadata.diversityScore}, quality: ${result.metadata.selectionQuality}`);
    } catch (error) {
      console.error('[OptimizedSentenceMining] Error generating first exercise:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate exercise',
        isGeneratingNext: false,
        preloadStatus: 'error'
      }));
    }
  };

  const preloadNextExercise = async () => {
    if (!state.currentSession) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to get preloaded exercise first
      const preloaded = EnhancedSentenceMiningService.getPreloadedExercise(
        user.id,
        settings.selectedLanguage,
        state.currentSession.difficulty_level,
        state.currentSession.id
      );

      if (preloaded) {
        setState(prev => ({ ...prev, nextExerciseReady: preloaded.exercise }));
        console.log(`[OptimizedSentenceMining] Next exercise preloaded with diversity: ${preloaded.metadata.diversityScore}`);
        return;
      }

      // Generate new exercise with enhanced diversity
      setState(prev => ({ ...prev, preloadStatus: 'loading' }));

      const result = await EnhancedSentenceMiningService.generateExerciseWithEnhancements({
        language: state.currentSession.language,
        difficulty: state.currentSession.difficulty_level,
        userId: user.id,
        sessionId: state.currentSession.id,
        previousExercises: exerciseHistory.current.map(r => r.exercise),
        enhancedMode: true
      });

      setState(prev => ({ 
        ...prev, 
        nextExerciseReady: result.exercise,
        preloadStatus: 'ready'
      }));

      console.log(`[OptimizedSentenceMining] Next exercise preloaded with enhanced diversity: ${result.metadata.diversityScore}`);
    } catch (error) {
      console.error('[OptimizedSentenceMining] Error preloading enhanced exercise:', error);
      setState(prev => ({ ...prev, preloadStatus: 'error' }));
    }
  };

  const submitOptimizedAnswer = async (response: string, selectedWords: string[] = [], isSkipped: boolean = false) => {
    const currentSession = state.currentSession;
    const currentExercise = state.currentExercise;
    
    if (!currentSession || !currentExercise) return;

    const responseTime = Date.now() - exerciseStartTime.current;
    responseTimeHistory.current.push(responseTime);

    setState(prev => ({ ...prev, loading: true }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const correctAnswer = currentExercise.correctAnswer;
      const isCorrect = !isSkipped && response.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

      // Store exercise result
      const { error: exerciseError } = await supabase
        .from('sentence_mining_exercises')
        .insert([{
          session_id: currentSession.id,
          sentence: currentExercise.sentence,
          target_words: [currentExercise.targetWord],
          user_response: response,
          is_correct: isCorrect,
          difficulty_score: currentExercise.difficultyScore || 1,
          exercise_type: 'cloze',
          translation: currentExercise.translation,
          unknown_words: isSkipped ? [currentExercise.targetWord] : [],
          hints_used: 0,
          completion_time: responseTime,
          completed_at: new Date().toISOString()
        }]);

      if (exerciseError) {
        console.error('[OptimizedSentenceMining] Error storing exercise:', exerciseError);
      }

      const updatedSession = {
        ...currentSession,
        totalAttempts: currentSession.totalAttempts + 1,
        totalCorrect: currentSession.totalCorrect + (isCorrect ? 1 : 0)
      };

      // Update session stats
      await supabase
        .from('sentence_mining_sessions')
        .update({
          total_exercises: updatedSession.totalAttempts,
          correct_exercises: updatedSession.totalCorrect
        })
        .eq('id', currentSession.id);

      // Calculate performance metrics
      const avgResponseTime = responseTimeHistory.current.length > 0 
        ? responseTimeHistory.current.reduce((a, b) => a + b, 0) / responseTimeHistory.current.length
        : 0;

      setState(prev => ({
        ...prev,
        currentSession: updatedSession,
        showResult: true,
        isCorrect,
        loading: false,
        exerciseCount: prev.exerciseCount + 1,
        averageResponseTime: Math.round(avgResponseTime)
      }));

      // Update diversity metrics after each exercise
      setTimeout(() => updateDiversityMetrics(), 500);

    } catch (error) {
      console.error('[OptimizedSentenceMining] Error submitting answer:', error);
      setState(prev => ({ ...prev, loading: false, error: 'Failed to submit answer' }));
    }
  };

  const nextOptimizedExercise = useCallback(async () => {
    if (!state.currentSession) return;

    exerciseStartTime.current = Date.now();

    // Use preloaded exercise if available
    if (state.nextExerciseReady) {
      setState(prev => ({
        ...prev,
        currentExercise: prev.nextExerciseReady,
        nextExerciseReady: null,
        userResponse: '',
        showResult: false,
        showTranslation: false,
        showHint: false
      }));

      // Trigger preloading of next exercise
      setTimeout(() => preloadNextExercise(), 100);
      return;
    }

    // Fallback to generate new exercise with enhanced diversity
    setState(prev => ({ ...prev, isGeneratingNext: true }));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const result = await EnhancedSentenceMiningService.generateExerciseWithEnhancements({
        language: state.currentSession.language,
        difficulty: state.currentSession.difficulty_level,
        userId: user.id,
        sessionId: state.currentSession.id,
        previousExercises: exerciseHistory.current.map(r => r.exercise),
        enhancedMode: true
      });

      exerciseHistory.current.push(result);

      setState(prev => ({
        ...prev,
        currentExercise: result.exercise,
        userResponse: '',
        showResult: false,
        showTranslation: false,
        showHint: false,
        isGeneratingNext: false,
        sessionQuality: (prev.sessionQuality + result.metadata.selectionQuality) / 2
      }));

      console.log(`[OptimizedSentenceMining] Next exercise generated with enhanced diversity: ${result.metadata.diversityScore}`);
    } catch (error) {
      console.error('[OptimizedSentenceMining] Error generating next enhanced exercise:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to generate next exercise',
        isGeneratingNext: false
      }));
    }
  }, [state.currentSession, state.nextExerciseReady]);

  const endOptimizedSession = async () => {
    const { currentSession } = state;
    if (!currentSession) return;

    try {
      // Clear caches
      EnhancedSentenceMiningService.clearCache(currentSession.id);
      EnhancedCooldownSystem.clearSessionCache(currentSession.id);

      // Mark session as completed
      await supabase
        .from('sentence_mining_sessions')
        .update({
          completed_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      // Get final diversity metrics for summary
      const finalDiversityScore = state.diversityMetrics?.overallScore || 0;
      const poolUtilization = state.wordPoolStats ? 
        Math.round((state.wordPoolStats.totalWords - state.wordPoolStats.coolingDownWords) / state.wordPoolStats.totalWords * 100) : 0;

      setState(prev => ({
        ...prev,
        currentSession: null,
        currentExercise: null,
        nextExerciseReady: null,
        userResponse: '',
        showResult: false,
        exerciseCount: 0,
        averageResponseTime: 0,
        sessionQuality: 0,
        preloadStatus: 'idle',
        diversityMetrics: null,
        wordPoolStats: null,
        diversityInsights: []
      }));

      // Reset histories
      exerciseHistory.current = [];
      responseTimeHistory.current = [];

      await loadProgress();

      toast.success(
        `Enhanced session completed! ${currentSession.totalCorrect}/${currentSession.totalAttempts} correct • Diversity: ${finalDiversityScore}% • Pool utilization: ${poolUtilization}%`,
        { duration: 6000 }
      );
    } catch (error) {
      console.error('[OptimizedSentenceMining] Error ending enhanced session:', error);
    }
  };

  const updateUserResponse = (response: string) => {
    setState(prev => ({ ...prev, userResponse: response }));
  };

  const toggleTranslation = () => {
    setState(prev => ({ ...prev, showTranslation: !prev.showTranslation }));
  };

  const toggleHint = () => {
    setState(prev => ({ ...prev, showHint: !prev.showHint }));
  };

  return {
    ...state,
    startSession: startOptimizedSession,
    submitAnswer: submitOptimizedAnswer,
    nextExercise: nextOptimizedExercise,
    endSession: endOptimizedSession,
    updateUserResponse,
    toggleTranslation,
    toggleHint,
    loadProgress,
    updateDiversityMetrics,
    
    // Enhanced performance insights
    getPerformanceMetrics: () => ({
      exerciseCount: state.exerciseCount,
      averageResponseTime: state.averageResponseTime,
      sessionQuality: state.sessionQuality,
      preloadStatus: state.preloadStatus,
      cacheHitRate: exerciseHistory.current.length > 0 ? 
        exerciseHistory.current.filter(r => !r.metadata.fallbackUsed).length / exerciseHistory.current.length : 0,
      diversityScore: state.diversityMetrics?.overallScore || 0,
      wordPoolUtilization: state.wordPoolStats ? 
        (state.wordPoolStats.availableWords / state.wordPoolStats.totalWords) * 100 : 0
    }),

    // Diversity insights
    getDiversityInsights: () => state.diversityInsights,
    
    // Word pool information
    getWordPoolInfo: () => state.wordPoolStats
  };
};
