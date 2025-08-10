
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DifficultyLevel, SentenceMiningSession, SentenceMiningExercise, SentenceMiningProgress } from '@/types/sentence-mining';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { VocabularyTrackingService } from '@/services/vocabularyTrackingService';
import { EnhancedWordSelection } from '@/services/enhancedWordSelection';

export const useEnhancedSentenceMining = () => {
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
    vocabularyStats: null as any,
  });

  // Load progress and vocabulary data
  useEffect(() => {
    loadProgressAndVocabulary();
  }, [settings.selectedLanguage]);

  const loadProgressAndVocabulary = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Load session progress
      const { data: sessions } = await supabase
        .from('sentence_mining_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('language', settings.selectedLanguage)
        .order('created_at', { ascending: false });

      // Load vocabulary stats
      const vocabularyStats = await VocabularyTrackingService.getVocabularyStats(
        user.id,
        settings.selectedLanguage
      );

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
          passiveVocabulary: vocabularyStats.passiveVocabulary,
          activeVocabulary: vocabularyStats.activeVocabulary,
          totalWordsEncountered: vocabularyStats.totalWordsEncountered,
          language: settings.selectedLanguage
        },
        correct: totalCorrect,
        total: totalExercises
      };

      setState(prev => ({ 
        ...prev, 
        progress,
        vocabularyStats
      }));
    } catch (error) {
      console.error('Error loading progress and vocabulary:', error);
    }
  };

  const startSession = useCallback(async (difficulty: DifficultyLevel) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

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

      // Generate first exercise with enhanced word selection
      await generateNextExercise();
    } catch (error) {
      console.error('Error starting session:', error);
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to start session' }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [settings.selectedLanguage]);

  const generateNextExercise = useCallback(async () => {
    if (!state.currentSession) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get enhanced word selection
      const wordSelection = await EnhancedWordSelection.selectVocabularyAwareWords(
        user.id,
        settings.selectedLanguage,
        state.currentSession.difficulty,
        1 // For now, one word per exercise
      );

      console.log('Enhanced word selection:', wordSelection);

      // Generate exercise with selected words
      const exerciseResponse = await supabase.functions.invoke('generate-sentence-mining', {
        body: {
          difficulty_level: state.currentSession.difficulty,
          language: settings.selectedLanguage,
          session_id: state.currentSession.id,
          user_id: user.id,
          preferred_words: wordSelection.selectedWords,
          novelty_words: [],
          avoid_patterns: [],
          diversity_score_target: 75,
          selection_quality: 50,
          enhanced_mode: true,
          previous_sentences: [],
          known_words: wordSelection.wordTypes,
          n_plus_one: true,
          vocabulary_distribution: wordSelection.vocabularyDistribution
        }
      });

      if (exerciseResponse.error) {
        throw new Error(`Exercise generation failed: ${exerciseResponse.error.message}`);
      }

      const exercise = exerciseResponse.data;

      setState(prev => ({
        ...prev,
        currentExercise: exercise,
        userResponse: '',
        showResult: false,
        showTranslation: false,
        showHint: false,
        loading: false
      }));

      // Show selection reasoning to user
      if (wordSelection.selectionReason) {
        toast.info(`Word selection: ${wordSelection.selectionReason}`, {
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error generating exercise:', error);
      setState(prev => ({ ...prev, error: 'Failed to generate exercise', loading: false }));
    }
  }, [settings.selectedLanguage, state.currentSession]);

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

      // Update word mastery
      if (currentExercise.targetWord) {
        await supabase.rpc('update_word_mastery', {
          user_id_param: user.id,
          word_param: currentExercise.targetWord,
          language_param: settings.selectedLanguage,
          is_correct_param: isCorrect
        });
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

      // Reload progress and vocabulary after each exercise
      await loadProgressAndVocabulary();
    } catch (error) {
      console.error('Error submitting answer:', error);
      setState(prev => ({ ...prev, loading: false, error: 'Failed to submit answer' }));
    }
  }, [loadProgressAndVocabulary, settings.selectedLanguage]);

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

      await loadProgressAndVocabulary();
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, [loadProgressAndVocabulary]);

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
    nextExercise: generateNextExercise,
    endSession,
    updateUserResponse,
    toggleTranslation,
    toggleHint,
    loadProgress: loadProgressAndVocabulary
  };
};
