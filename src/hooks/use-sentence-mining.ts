
import { useState, useCallback, useEffect } from 'react';
import { SentenceMiningState, SentenceMiningSession, SentenceMiningExercise, DifficultyLevel, SentenceMiningProgress } from '@/types/sentence-mining';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STORAGE_KEY_PREFIX = 'sentence-mining';

export const useSentenceMining = () => {
  const { settings } = useUserSettingsContext();
  
  const [state, setState] = useState<SentenceMiningState>({
    currentSession: null,
    currentExercise: null,
    userResponse: '',
    showResult: false,
    isCorrect: false,
    loading: false,
    error: null,
    progress: null,
  });

  // Load progress from localStorage
  useEffect(() => {
    const loadProgress = () => {
      try {
        const progressKey = `${STORAGE_KEY_PREFIX}-progress-${settings.selectedLanguage}`;
        const stored = localStorage.getItem(progressKey);
        if (stored) {
          const progress = JSON.parse(stored);
          setState(prev => ({ ...prev, progress }));
        } else {
          // Initialize default progress
          const defaultProgress: SentenceMiningProgress = {
            language: settings.selectedLanguage,
            totalSessions: 0,
            totalExercises: 0,
            totalCorrect: 0,
            averageAccuracy: 0,
            streak: 0,
            difficultyProgress: {
              beginner: { attempted: 0, correct: 0, accuracy: 0 },
              intermediate: { attempted: 0, correct: 0, accuracy: 0 },
              advanced: { attempted: 0, correct: 0, accuracy: 0 },
            },
          };
          setState(prev => ({ ...prev, progress: defaultProgress }));
        }
      } catch (error) {
        console.error('Error loading sentence mining progress:', error);
      }
    };

    loadProgress();
  }, [settings.selectedLanguage]);

  const saveProgress = useCallback((progress: SentenceMiningProgress) => {
    try {
      const progressKey = `${STORAGE_KEY_PREFIX}-progress-${settings.selectedLanguage}`;
      localStorage.setItem(progressKey, JSON.stringify(progress));
      setState(prev => ({ ...prev, progress }));
    } catch (error) {
      console.error('Error saving sentence mining progress:', error);
    }
  }, [settings.selectedLanguage]);

  const generateSentence = useCallback(async (difficulty: DifficultyLevel): Promise<SentenceMiningExercise | null> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.functions.invoke('generate-sentence-mining', {
        body: {
          language: settings.selectedLanguage,
          difficulty,
          knownWords: [], // Could be expanded to include user's known words
        },
      });

      if (error) throw error;

      const exercise: SentenceMiningExercise = {
        id: crypto.randomUUID(),
        sentence: data.sentence,
        targetWord: data.targetWord,
        clozeSentence: data.clozeSentence,
        difficulty,
        context: data.context || '',
        createdAt: new Date(),
        attempts: 0,
        correctAttempts: 0,
      };

      return exercise;
    } catch (error) {
      console.error('Error generating sentence:', error);
      setState(prev => ({ ...prev, error: 'Failed to generate sentence. Please try again.' }));
      toast.error('Failed to generate sentence');
      return null;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [settings.selectedLanguage]);

  const startSession = useCallback(async (difficulty: DifficultyLevel) => {
    const exercise = await generateSentence(difficulty);
    if (!exercise) return;

    const session: SentenceMiningSession = {
      id: crypto.randomUUID(),
      language: settings.selectedLanguage,
      difficulty,
      exercises: [exercise],
      currentExerciseIndex: 0,
      startTime: new Date(),
      totalCorrect: 0,
      totalAttempts: 0,
    };

    setState(prev => ({
      ...prev,
      currentSession: session,
      currentExercise: exercise,
      userResponse: '',
      showResult: false,
      isCorrect: false,
    }));
  }, [generateSentence, settings.selectedLanguage]);

  const submitAnswer = useCallback(async (answer: string) => {
    if (!state.currentExercise || !state.currentSession) return;

    const isCorrect = answer.toLowerCase().trim() === state.currentExercise.targetWord.toLowerCase().trim();
    
    // Update exercise attempts
    const updatedExercise = {
      ...state.currentExercise,
      attempts: state.currentExercise.attempts + 1,
      correctAttempts: state.currentExercise.correctAttempts + (isCorrect ? 1 : 0),
    };

    // Update session
    const updatedSession = {
      ...state.currentSession,
      exercises: state.currentSession.exercises.map(ex => 
        ex.id === updatedExercise.id ? updatedExercise : ex
      ),
      totalAttempts: state.currentSession.totalAttempts + 1,
      totalCorrect: state.currentSession.totalCorrect + (isCorrect ? 1 : 0),
    };

    setState(prev => ({
      ...prev,
      currentExercise: updatedExercise,
      currentSession: updatedSession,
      showResult: true,
      isCorrect,
    }));

    // Update progress
    if (state.progress) {
      const newProgress = {
        ...state.progress,
        totalExercises: state.progress.totalExercises + 1,
        totalCorrect: state.progress.totalCorrect + (isCorrect ? 1 : 0),
        averageAccuracy: ((state.progress.totalCorrect + (isCorrect ? 1 : 0)) / (state.progress.totalExercises + 1)) * 100,
        streak: isCorrect ? state.progress.streak + 1 : 0,
        lastSessionDate: new Date(),
        difficultyProgress: {
          ...state.progress.difficultyProgress,
          [state.currentSession.difficulty]: {
            attempted: state.progress.difficultyProgress[state.currentSession.difficulty].attempted + 1,
            correct: state.progress.difficultyProgress[state.currentSession.difficulty].correct + (isCorrect ? 1 : 0),
            accuracy: ((state.progress.difficultyProgress[state.currentSession.difficulty].correct + (isCorrect ? 1 : 0)) / (state.progress.difficultyProgress[state.currentSession.difficulty].attempted + 1)) * 100,
          },
        },
      };
      saveProgress(newProgress);
    }
  }, [state.currentExercise, state.currentSession, state.progress, saveProgress]);

  const nextExercise = useCallback(async () => {
    if (!state.currentSession) return;

    const newExercise = await generateSentence(state.currentSession.difficulty);
    if (!newExercise) return;

    const updatedSession = {
      ...state.currentSession,
      exercises: [...state.currentSession.exercises, newExercise],
      currentExerciseIndex: state.currentSession.currentExerciseIndex + 1,
    };

    setState(prev => ({
      ...prev,
      currentSession: updatedSession,
      currentExercise: newExercise,
      userResponse: '',
      showResult: false,
      isCorrect: false,
    }));
  }, [state.currentSession, generateSentence]);

  const endSession = useCallback(() => {
    if (!state.currentSession) return;

    const updatedSession = {
      ...state.currentSession,
      endTime: new Date(),
    };

    // Update progress with session data
    if (state.progress) {
      const newProgress = {
        ...state.progress,
        totalSessions: state.progress.totalSessions + 1,
      };
      saveProgress(newProgress);
    }

    setState(prev => ({
      ...prev,
      currentSession: null,
      currentExercise: null,
      userResponse: '',
      showResult: false,
      isCorrect: false,
    }));

    toast.success(`Session completed! You got ${updatedSession.totalCorrect}/${updatedSession.totalAttempts} correct.`);
  }, [state.currentSession, state.progress, saveProgress]);

  const updateUserResponse = useCallback((response: string) => {
    setState(prev => ({ ...prev, userResponse: response }));
  }, []);

  return {
    ...state,
    startSession,
    submitAnswer,
    nextExercise,
    endSession,
    updateUserResponse,
  };
};
