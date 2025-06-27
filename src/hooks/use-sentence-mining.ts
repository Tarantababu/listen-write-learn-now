
import { useState, useCallback, useEffect } from 'react';
import { SentenceMiningState, SentenceMiningSession, SentenceMiningExercise, DifficultyLevel, SentenceMiningProgress, ExerciseType } from '@/types/sentence-mining';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STORAGE_KEY_PREFIX = 'sentence-mining';

// Available exercise types (excluding multiple_choice)
const AVAILABLE_EXERCISE_TYPES: ExerciseType[] = ['translation', 'vocabulary_marking', 'cloze'];

export const useSentenceMining = () => {
  const { settings } = useUserSettingsContext();
  
  const [state, setState] = useState<SentenceMiningState>({
    currentSession: null,
    currentExercise: null,
    userResponse: '',
    selectedWords: [],
    showResult: false,
    isCorrect: false,
    loading: false,
    error: null,
    progress: null,
    showHint: false,
    showTranslation: false,
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
            exerciseTypeProgress: {
              cloze: { attempted: 0, correct: 0, accuracy: 0 },
              translation: { attempted: 0, correct: 0, accuracy: 0 },
              multiple_choice: { attempted: 0, correct: 0, accuracy: 0 },
              vocabulary_marking: { attempted: 0, correct: 0, accuracy: 0 },
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

  // Get random exercise type
  const getRandomExerciseType = useCallback((): ExerciseType => {
    const randomIndex = Math.floor(Math.random() * AVAILABLE_EXERCISE_TYPES.length);
    return AVAILABLE_EXERCISE_TYPES[randomIndex];
  }, []);

  const generateSentence = useCallback(async (difficulty: DifficultyLevel, exerciseType: ExerciseType): Promise<SentenceMiningExercise | null> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      console.log(`Generating ${exerciseType} exercise for ${settings.selectedLanguage} at ${difficulty} level`);

      const { data, error } = await supabase.functions.invoke('generate-sentence-mining', {
        body: {
          language: settings.selectedLanguage,
          difficulty,
          exerciseType,
          knownWords: [], // Could be expanded to include user's known words
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data received from sentence generation');
      }

      console.log('Generated sentence data:', data);

      const exercise: SentenceMiningExercise = {
        id: crypto.randomUUID(),
        sentence: data.sentence,
        targetWord: data.targetWord,
        clozeSentence: data.clozeSentence || data.sentence,
        difficulty,
        context: data.context || '',
        createdAt: new Date(),
        attempts: 0,
        correctAttempts: 0,
        exerciseType,
        translation: data.translation,
        multipleChoiceOptions: data.multipleChoiceOptions,
        correctAnswer: data.correctAnswer || data.targetWord,
        explanation: data.explanation,
        clickableWords: data.clickableWords || [],
      };

      console.log('Created exercise:', exercise);
      return exercise;
    } catch (error) {
      console.error('Error generating sentence:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate sentence. Please try again.';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error('Failed to generate sentence. Please try again.');
      return null;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [settings.selectedLanguage]);

  const startSession = useCallback(async (difficulty: DifficultyLevel) => {
    try {
      console.log('Starting new session with difficulty:', difficulty);
      
      const exerciseType = getRandomExerciseType();
      console.log('Selected exercise type:', exerciseType);
      
      const exercise = await generateSentence(difficulty, exerciseType);
      if (!exercise) {
        console.error('Failed to generate exercise for session');
        return;
      }

      const session: SentenceMiningSession = {
        id: crypto.randomUUID(),
        language: settings.selectedLanguage,
        difficulty,
        exercises: [exercise],
        currentExerciseIndex: 0,
        startTime: new Date(),
        totalCorrect: 0,
        totalAttempts: 0,
        exerciseTypes: [exerciseType],
      };

      console.log('Created session:', session);

      setState(prev => ({
        ...prev,
        currentSession: session,
        currentExercise: exercise,
        userResponse: '',
        selectedWords: [],
        showResult: false,
        isCorrect: false,
        showHint: false,
        showTranslation: false,
        error: null,
      }));
    } catch (error) {
      console.error('Error starting session:', error);
      setState(prev => ({ ...prev, error: 'Failed to start session. Please try again.' }));
      toast.error('Failed to start session. Please try again.');
    }
  }, [generateSentence, getRandomExerciseType, settings.selectedLanguage]);

  const submitAnswer = useCallback(async (answer: string, selectedWords?: string[]) => {
    if (!state.currentExercise || !state.currentSession) {
      console.error('No current exercise or session');
      return;
    }

    try {
      console.log('Submitting answer:', { answer, selectedWords, exerciseType: state.currentExercise.exerciseType });

      let isCorrect = false;
      
      // Different validation logic based on exercise type
      switch (state.currentExercise.exerciseType) {
        case 'translation':
          // For translation, we'll be more lenient with scoring
          const expectedTranslation = state.currentExercise.translation?.toLowerCase() || '';
          const userTranslation = answer.toLowerCase().trim();
          isCorrect = userTranslation.length > 0 && (
            expectedTranslation.includes(userTranslation) ||
            userTranslation.includes(expectedTranslation.split(' ')[0]) ||
            userTranslation.split(' ').some(word => expectedTranslation.includes(word) && word.length > 3)
          );
          break;
          
        case 'vocabulary_marking':
          // For vocabulary marking, we always consider it correct (it's about learning)
          isCorrect = true;
          break;
          
        default: // cloze
          isCorrect = answer.toLowerCase().trim() === state.currentExercise.targetWord.toLowerCase().trim();
      }
      
      console.log('Answer validation result:', { isCorrect, answer, targetWord: state.currentExercise.targetWord });
      
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
        selectedWords: selectedWords || prev.selectedWords,
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
          exerciseTypeProgress: {
            ...state.progress.exerciseTypeProgress,
            [state.currentExercise.exerciseType]: {
              attempted: (state.progress.exerciseTypeProgress[state.currentExercise.exerciseType]?.attempted || 0) + 1,
              correct: (state.progress.exerciseTypeProgress[state.currentExercise.exerciseType]?.correct || 0) + (isCorrect ? 1 : 0),
              accuracy: (((state.progress.exerciseTypeProgress[state.currentExercise.exerciseType]?.correct || 0) + (isCorrect ? 1 : 0)) / ((state.progress.exerciseTypeProgress[state.currentExercise.exerciseType]?.attempted || 0) + 1)) * 100,
            },
          },
        };
        saveProgress(newProgress);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Error submitting answer. Please try again.');
    }
  }, [state.currentExercise, state.currentSession, state.progress, saveProgress]);

  const nextExercise = useCallback(async () => {
    if (!state.currentSession) {
      console.error('No current session for next exercise');
      return;
    }

    try {
      console.log('Generating next exercise');
      
      const exerciseType = getRandomExerciseType(); // Get random exercise type for next exercise
      const newExercise = await generateSentence(state.currentSession.difficulty, exerciseType);
      if (!newExercise) {
        console.error('Failed to generate next exercise');
        return;
      }

      const updatedSession = {
        ...state.currentSession,
        exercises: [...state.currentSession.exercises, newExercise],
        currentExerciseIndex: state.currentSession.currentExerciseIndex + 1,
        exerciseTypes: [...state.currentSession.exerciseTypes, exerciseType],
      };

      console.log('Updated session with new exercise:', updatedSession);

      setState(prev => ({
        ...prev,
        currentSession: updatedSession,
        currentExercise: newExercise,
        userResponse: '',
        selectedWords: [],
        showResult: false,
        isCorrect: false,
        showHint: false,
        showTranslation: false,
        error: null,
      }));
    } catch (error) {
      console.error('Error generating next exercise:', error);
      toast.error('Error generating next exercise. Please try again.');
    }
  }, [state.currentSession, generateSentence, getRandomExerciseType]);

  const endSession = useCallback(() => {
    if (!state.currentSession) return;

    try {
      console.log('Ending session:', state.currentSession);

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
        selectedWords: [],
        showResult: false,
        isCorrect: false,
        showHint: false,
        showTranslation: false,
        error: null,
      }));

      toast.success(`Session completed! You got ${updatedSession.totalCorrect}/${updatedSession.totalAttempts} correct.`);
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Error ending session.');
    }
  }, [state.currentSession, state.progress, saveProgress]);

  const updateUserResponse = useCallback((response: string) => {
    setState(prev => ({ ...prev, userResponse: response }));
  }, []);

  const toggleWord = useCallback((word: string) => {
    setState(prev => ({
      ...prev,
      selectedWords: prev.selectedWords.includes(word)
        ? prev.selectedWords.filter(w => w !== word)
        : [...prev.selectedWords, word]
    }));
  }, []);

  const toggleHint = useCallback(() => {
    setState(prev => ({ ...prev, showHint: !prev.showHint }));
  }, []);

  const toggleTranslation = useCallback(() => {
    setState(prev => ({ ...prev, showTranslation: !prev.showTranslation }));
  }, []);

  return {
    ...state,
    startSession,
    submitAnswer,
    nextExercise,
    endSession,
    updateUserResponse,
    toggleWord,
    toggleHint,
    toggleTranslation,
  };
};
