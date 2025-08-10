
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DifficultyLevel, SentenceMiningSession, SentenceMiningExercise, SentenceMiningProgress, VocabularyStats } from '@/types/sentence-mining';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedSentenceMiningState {
  currentSession: SentenceMiningSession | null;
  currentExercise: SentenceMiningExercise | null;
  userResponse: string;
  showResult: boolean;
  isCorrect: boolean;
  loading: boolean;
  error: string | null;
  progress: SentenceMiningProgress | null;
  showTranslation: boolean;
  vocabularyStats: VocabularyStats | null;
}

export const useEnhancedSentenceMining = () => {
  const { settings } = useUserSettingsContext();
  const [state, setState] = useState<EnhancedSentenceMiningState>({
    currentSession: null,
    currentExercise: null,
    userResponse: '',
    showResult: false,
    isCorrect: false,
    loading: false,
    error: null,
    progress: null,
    showTranslation: false,
    vocabularyStats: null,
  });

  // Load progress when language changes
  useEffect(() => {
    loadProgress();
    loadVocabularyStats();
  }, [settings.selectedLanguage]);

  const loadVocabularyStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Mock vocabulary stats for now - in real implementation, this would come from the database
      const vocabularyStats: VocabularyStats = {
        passiveVocabulary: 0,
        activeVocabulary: 0,
        totalWordsEncountered: 0,
        language: settings.selectedLanguage
      };

      setState(prev => ({ ...prev, vocabularyStats }));
    } catch (error) {
      console.error('[useEnhancedSentenceMining] Error loading vocabulary stats:', error);
    }
  };

  const loadProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      console.log('[useEnhancedSentenceMining] Loading progress for language:', settings.selectedLanguage);
      
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
        },
        correct: totalCorrect,
        total: totalExercises
      };

      setState(prev => ({ ...prev, progress }));
    } catch (error) {
      console.error('[useEnhancedSentenceMining] Error loading progress:', error);
    }
  };

  useEffect(() => {
    loadProgress();
    loadVocabularyStats();
  }, [settings.selectedLanguage]);

  const startSession = async (difficulty: DifficultyLevel): Promise<SentenceMiningSession> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Please log in to start a session');
    }

    console.log('[useEnhancedSentenceMining] Starting session for user:', user.id, 'language:', settings.selectedLanguage, 'difficulty:', difficulty);
    
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      currentExercise: null,
      userResponse: '',
      showResult: false,
      isCorrect: false
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

      console.log('[useEnhancedSentenceMining] Creating session with data:', sessionData);

      const { data: session, error } = await supabase
        .from('sentence_mining_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) {
        console.error('[useEnhancedSentenceMining] Session creation error:', error);
        throw error;
      }

      console.log('[useEnhancedSentenceMining] Session created successfully:', session.id);

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

      setState(prev => ({ 
        ...prev, 
        currentSession: newSession,
        loading: false 
      }));

      return newSession;
    } catch (error) {
      console.error('[useEnhancedSentenceMining] Error starting session:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to start session' 
      }));
      throw error;
    }
  };

  const generateNextExercise = async (session?: SentenceMiningSession) => {
    const currentSession = session || state.currentSession;
    if (!currentSession) {
      console.error('[useEnhancedSentenceMining] No current session for generateNextExercise');
      throw new Error('No active session');
    }

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      currentExercise: null,
      userResponse: '',
      showResult: false,
      isCorrect: false
    }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('[useEnhancedSentenceMining] Generating exercise for session:', currentSession.id);

      // Call the Supabase function to generate sentence mining exercise
      const { data: result, error } = await supabase.functions.invoke('generate-sentence-mining', {
        body: {
          language: currentSession.language,
          difficulty: currentSession.difficulty_level,
          userId: user.id,
          sessionId: currentSession.id,
          enhancedMode: true
        }
      });

      if (error) {
        console.error('[useEnhancedSentenceMining] Function call error:', error);
        throw new Error(`Failed to generate exercise: ${error.message}`);
      }

      console.log('[useEnhancedSentenceMining] Raw API response:', result);

      // The API returns the exercise data directly, not wrapped in an 'exercise' property
      if (!result || !result.id) {
        console.error('[useEnhancedSentenceMining] No valid exercise in result:', result);
        throw new Error('No exercise generated');
      }

      console.log('[useEnhancedSentenceMining] Exercise generated successfully:', result.id);

      const exercise: SentenceMiningExercise = {
        id: result.id,
        sessionId: currentSession.id,
        sentence: result.sentence,
        targetWord: result.targetWord,
        clozeSentence: result.clozeSentence || result.sentence,
        difficulty: currentSession.difficulty_level,
        context: result.context || '',
        correctAnswer: result.targetWord, // Use targetWord as correctAnswer
        translation: result.translation,
        difficultyScore: result.difficultyScore,
        createdAt: new Date(),
        attempts: 0,
        isCorrect: null,
        userAnswer: null,
        hints: result.hints || [],
        targetWordTranslation: result.targetWordTranslation
      };

      setState(prev => ({
        ...prev,
        currentExercise: exercise,
        loading: false
      }));

      console.log('[useEnhancedSentenceMining] Exercise state updated successfully');

    } catch (error) {
      console.error('[useEnhancedSentenceMining] Error generating exercise:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to generate exercise',
        loading: false
      }));
      throw error;
    }
  };

  const nextExercise = useCallback(async () => {
    await generateNextExercise();
  }, [state.currentSession]);

  const updateUserResponse = useCallback((response: string) => {
    setState(prev => ({ ...prev, userResponse: response }));
  }, []);

  const toggleTranslation = useCallback(() => {
    setState(prev => ({ ...prev, showTranslation: !prev.showTranslation }));
  }, []);

  const submitAnswer = async (answer: string, hints: string[] = [], isSkipped: boolean = false) => {
    const currentSession = state.currentSession;
    const currentExercise = state.currentExercise;
    
    if (!currentSession || !currentExercise) {
      throw new Error('No active session or exercise');
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const correctAnswer = currentExercise.correctAnswer;
      const isCorrect = !isSkipped && answer.toLowerCase().trim() === correctAnswer?.toLowerCase().trim();

      console.log('[useEnhancedSentenceMining] Submitting answer:', { answer, correctAnswer, isCorrect, isSkipped });

      // Store exercise result
      const { error: exerciseError } = await supabase
        .from('sentence_mining_exercises')
        .insert([{
          session_id: currentSession.id,
          sentence: currentExercise.sentence,
          target_words: [currentExercise.targetWord],
          user_response: answer,
          is_correct: isSkipped ? null : isCorrect,
          difficulty_score: currentExercise.difficultyScore || 1,
          exercise_type: 'cloze',
          translation: currentExercise.translation,
          unknown_words: [],
          hints_used: hints.length,
          completion_time: 5000, // Default completion time
          completed_at: new Date().toISOString()
        }]);

      if (exerciseError) {
        console.error('[useEnhancedSentenceMining] Error storing exercise:', exerciseError);
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

      setState(prev => ({
        ...prev,
        currentSession: updatedSession,
        showResult: true,
        isCorrect: isCorrect,
        loading: false
      }));

      console.log('[useEnhancedSentenceMining] Answer submitted successfully');

    } catch (error) {
      console.error('[useEnhancedSentenceMining] Error submitting answer:', error);
      setState(prev => ({ ...prev, loading: false, error: 'Failed to submit answer' }));
      throw error;
    }
  };

  const endSession = async () => {
    const { currentSession } = state;
    if (!currentSession) return;

    try {
      console.log('[useEnhancedSentenceMining] Ending session:', currentSession.id);

      // Mark session as completed
      await supabase
        .from('sentence_mining_sessions')
        .update({
          completed_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      setState(prev => ({
        ...prev,
        currentSession: null,
        currentExercise: null,
        userResponse: '',
        showResult: false,
        isCorrect: false
      }));

      await loadProgress();

      console.log('[useEnhancedSentenceMining] Session ended successfully');
    } catch (error) {
      console.error('[useEnhancedSentenceMining] Error ending session:', error);
      throw error;
    }
  };

  return {
    ...state,
    startSession,
    submitAnswer,
    nextExercise,
    endSession,
    loadProgress,
    updateUserResponse,
    toggleTranslation
  };
};
