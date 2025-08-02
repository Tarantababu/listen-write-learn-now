import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { Language } from '@/types';
import { WordMasteryService } from '@/services/wordMasteryService';
import { useWordMastery } from './useWordMastery';

interface SentenceMiningExercise {
  id: string;
  sentence: string;
  targetWord: string;
  startTime: number;
  userResponse: string | null;
  isCorrect: boolean | null;
  completionTime: number | null;
}

interface SentenceMiningSession {
  id: string;
  language: Language;
  total_exercises: number;
  correct_exercises: number;
  words_mastered: number;
  created_at: string;
  completed_at: string | null;
}

interface SentenceMiningState {
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  currentSession: SentenceMiningSession | null;
  currentExercise: SentenceMiningExercise | null;
  showFeedback: boolean;
}

const initialState: SentenceMiningState = {
  isLoading: false,
  isSubmitting: false,
  error: null,
  currentSession: null,
  currentExercise: null,
  showFeedback: false,
};

export const useSentenceMining = () => {
  const [state, setState] = useState<SentenceMiningState>(initialState);
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();

  const { refreshStats } = useWordMastery();

  const startSession = useCallback(async (language: Language): Promise<void> => {
    if (!user) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Create a new session
      const { data, error } = await supabase
        .from('sentence_mining_sessions')
        .insert([{
          user_id: user.id,
          language: language,
          total_exercises: 0,
          correct_exercises: 0,
          words_mastered: 0,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setState(prev => ({
        ...prev,
        currentSession: data as SentenceMiningSession,
        isLoading: false
      }));

    } catch (error) {
      console.error('Error starting session:', error);
      setState(prev => ({ ...prev, error: 'Failed to start session', isLoading: false }));
    }
  }, [user]);

  const startExercise = useCallback(async (sentence: string, targetWord: string): Promise<void> => {
    const { currentSession } = state;
    if (!currentSession || !user) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Create a new exercise
      const { data, error } = await supabase
        .from('sentence_mining_exercises')
        .insert([{
          session_id: currentSession.id,
          sentence: sentence,
          target_word: targetWord,
          user_id: user.id,
          language: currentSession.language,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Update session total exercises
      const { error: sessionError } = await supabase
        .from('sentence_mining_sessions')
        .update({
          total_exercises: currentSession.total_exercises + 1
        })
        .eq('id', currentSession.id);

      if (sessionError) throw sessionError;

      setState(prev => ({
        ...prev,
        currentExercise: {
          id: data.id,
          sentence: data.sentence,
          targetWord: data.target_word,
          startTime: Date.now(),
          userResponse: null,
          isCorrect: null,
          completionTime: null
        },
        currentSession: {
          ...currentSession,
          total_exercises: currentSession.total_exercises + 1
        },
        isLoading: false,
        showFeedback: false
      }));

    } catch (error) {
      console.error('Error starting exercise:', error);
      setState(prev => ({ ...prev, error: 'Failed to start exercise', isLoading: false }));
    }
  }, [state, user]);

  const evaluateAnswer = useCallback((answer: string, currentExercise: SentenceMiningExercise): boolean => {
    if (!currentExercise) return false;
    return answer.toLowerCase().includes(currentExercise.targetWord.toLowerCase());
  }, []);

  const submitAnswer = useCallback(async (answer: string): Promise<void> => {
    const { currentExercise, currentSession } = state;
    if (!currentExercise || !currentSession || !user) return;

    try {
      setState(prev => ({ ...prev, isSubmitting: true }));

      const isCorrect = evaluateAnswer(answer, currentExercise);
      const completionTime = Date.now() - currentExercise.startTime;

      // Update the exercise
      const { error: updateError } = await supabase
        .from('sentence_mining_exercises')
        .update({
          user_response: answer,
          is_correct: isCorrect,
          completed_at: new Date().toISOString(),
          completion_time: completionTime
        })
        .eq('id', currentExercise.id);

      if (updateError) throw updateError;

      // Update word mastery for sentence mining
      try {
        await WordMasteryService.updateWordMasteryFromSentenceMining(
          user.id,
          currentExercise.targetWord,
          currentSession.language as Language,
          isCorrect
        );
        console.log(`[submitAnswer] Updated word mastery for: ${currentExercise.targetWord} (correct: ${isCorrect})`);
      } catch (masteryError) {
        console.error('Error updating word mastery:', masteryError);
      }

      // Update session stats
      const correctCount = isCorrect ? currentSession.correct_exercises + 1 : currentSession.correct_exercises;
      
      const { error: sessionError } = await supabase
        .from('sentence_mining_sessions')
        .update({
          correct_exercises: correctCount,
          words_mastered: isCorrect ? currentSession.words_mastered + 1 : currentSession.words_mastered
        })
        .eq('id', currentSession.id);

      if (sessionError) throw sessionError;

      // Update state
      setState(prev => ({
        ...prev,
        currentExercise: { ...currentExercise, userResponse: answer, isCorrect, completionTime },
        currentSession: {
          ...currentSession,
          correct_exercises: correctCount,
          words_mastered: isCorrect ? currentSession.words_mastered + 1 : currentSession.words_mastered
        },
        showFeedback: true
      }));

      // Refresh word mastery stats if correct
      if (isCorrect) {
        try {
          await refreshStats();
          console.log('[submitAnswer] Refreshed word mastery stats');
        } catch (refreshError) {
          console.error('Error refreshing word mastery stats:', refreshError);
        }
      }

    } catch (error) {
      console.error('Error submitting answer:', error);
      setState(prev => ({ ...prev, error: 'Failed to submit answer' }));
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [state, user, evaluateAnswer, refreshStats]);

  const nextExercise = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentExercise: null,
      showFeedback: false
    }));
  }, []);

  const endSession = useCallback(async (): Promise<void> => {
    const { currentSession } = state;
    if (!currentSession) return;

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // End the session
      const { error: sessionError } = await supabase
        .from('sentence_mining_sessions')
        .update({
          completed_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      if (sessionError) throw sessionError;

      // Refresh stats after session completion
      try {
        await WordMasteryService.refreshStatsAfterSession(currentSession.id);
        await refreshStats();
        console.log('[endSession] Refreshed stats after session completion');
      } catch (refreshError) {
        console.error('Error refreshing stats after session:', refreshError);
      }

      // Reset state
      setState(initialState);

    } catch (error) {
      console.error('Error ending session:', error);
      setState(prev => ({ ...prev, error: 'Failed to end session' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state, refreshStats]);

  return {
    state,
    startSession,
    startExercise,
    submitAnswer,
    evaluateAnswer,
    nextExercise,
    endSession
  };
};
