import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DifficultyLevel, SentenceMiningSession, SentenceMiningExercise, SentenceMiningProgress } from '@/types/sentence-mining';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { AutomaticWordSelection } from '@/services/automaticWordSelection';

export const useSentenceMining = () => {
  const { settings } = useUserSettingsContext();
  const [state, setState] = useState({
    currentSession: null as SentenceMiningSession | null,
    currentExercise: null as SentenceMiningExercise | null,
    userResponse: '',
    showResult: false,
    isCorrect: false,
    loading: false,
    error: null as string | null,
    progress: null as SentenceMiningProgress | null,
    showHint: false,
    showTranslation: false,
    isGeneratingNext: false,
  });

  // Track used words in current session
  const [sessionWords, setSessionWords] = useState<string[]>([]);

  // Load progress data
  useEffect(() => {
    loadProgress();
  }, [settings.selectedLanguage]);

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
        },
        correct: totalCorrect,
        total: totalExercises
      };

      setState(prev => ({ ...prev, progress }));
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const nextExercise = useCallback(async () => {
    if (!state.currentSession) return;

    setState(prev => ({ ...prev, loading: true, isGeneratingNext: true }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get automatic word selection
      const wordSelection = await AutomaticWordSelection.selectAutomaticWord({
        language: settings.selectedLanguage,
        difficulty: state.currentSession.difficulty_level as DifficultyLevel,
        userId: user.id,
        sessionId: state.currentSession.id,
        previousWords: sessionWords,
        wordCount: 1
      });

      console.log(`[SentenceMining] Using auto-selected word: ${wordSelection.selectedWord} - ${wordSelection.selectionReason}`);

      // Generate exercise with the selected word
      const exerciseResponse = await supabase.functions.invoke('generate-sentence-mining', {
        body: {
          difficulty_level: state.currentSession.difficulty_level,
          language: settings.selectedLanguage,
          session_id: state.currentSession.id,
          user_id: user.id,
          preferred_words: [wordSelection.selectedWord],
          novelty_words: wordSelection.alternativeWords,
          avoid_patterns: [],
          diversity_score_target: 75,
          selection_quality: 80,
          enhanced_mode: true,
          previous_sentences: [],
          known_words: [],
          n_plus_one: false
        }
      });

      if (exerciseResponse.error) {
        throw new Error(`Exercise generation failed: ${exerciseResponse.error.message}`);
      }

      const exercise = exerciseResponse.data;

      // Track word usage
      if (exercise.targetWord) {
        await AutomaticWordSelection.trackWordUsage(
          user.id,
          exercise.targetWord,
          settings.selectedLanguage,
          state.currentSession.id
        );

        // Add to session words to avoid repetition
        setSessionWords(prev => [...prev, exercise.targetWord].slice(-10)); // Keep last 10 words
      }

      setState(prev => ({
        ...prev,
        currentExercise: exercise,
        userResponse: '',
        showResult: false,
        showTranslation: false,
        showHint: false,
        loading: false,
        isGeneratingNext: false
      }));

      // Show word selection info
      if (wordSelection.selectionReason) {
        toast.info(`Word selected: ${wordSelection.selectedWord} (${wordSelection.selectionReason})`);
      }

    } catch (error) {
      console.error('Error generating exercise:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to generate exercise', 
        loading: false,
        isGeneratingNext: false 
      }));
    }
  }, [settings.selectedLanguage, state.currentSession, sessionWords]);

  const startSession = useCallback(async (difficulty: DifficultyLevel) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    setSessionWords([]); // Reset session words

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create session
      const { data: session, error } = await supabase
        .from('sentence_mining_sessions')
        .insert([{
          user_id: user.id,
          language: settings.selectedLanguage,
          difficulty_level: difficulty,
          exercise_types: ['cloze']
        }])
        .select()
        .single();

      if (error) throw error;

      const newSession: SentenceMiningSession = {
        id: session.id,
        language: session.language,
        difficulty: session.difficulty_level as DifficultyLevel,
        exercises: [],
        currentExerciseIndex: 0,
        startTime: new Date(),
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

      // Generate first exercise
      await nextExercise();
    } catch (error) {
      console.error('Error starting session:', error);
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to start session' }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [settings.selectedLanguage, nextExercise]);

  const submitAnswer = useCallback(async (response: string, selectedWords: string[] = [], isSkipped: boolean = false) => {
    const currentSession = state.currentSession;
    const currentExercise = state.currentExercise;
    if (!currentSession || !currentExercise) return;

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
          completed_at: new Date().toISOString()
        }]);

      if (exerciseError) {
        console.error('Error storing exercise:', exerciseError);
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
        isCorrect,
        loading: false
      }));

      // Update progress
      await loadProgress();
    } catch (error) {
      console.error('Error submitting answer:', error);
      setState(prev => ({ ...prev, loading: false, error: 'Failed to submit answer' }));
    }
  }, [loadProgress, settings.selectedLanguage]);

  const endSession = useCallback(async () => {
    const { currentSession } = state;
    if (!currentSession) return;

    try {
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
        showResult: false
      }));

      setSessionWords([]); // Reset session words
      await loadProgress();
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, [loadProgress]);

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
    startSession,
    submitAnswer,
    nextExercise,
    endSession,
    updateUserResponse,
    toggleTranslation,
    toggleHint,
    loadProgress,
    sessionWords
  };
};
