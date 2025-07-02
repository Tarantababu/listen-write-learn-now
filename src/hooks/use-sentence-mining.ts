
import { useState, useCallback, useEffect } from 'react';
import { SentenceMiningState, SentenceMiningSession, SentenceMiningExercise, DifficultyLevel, SentenceMiningProgress, ExerciseType } from '@/types/sentence-mining';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { compareTexts } from '@/utils/textComparison';

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
          knownWords: [],
          reverseDirection: exerciseType === 'translation', // Only for translation exercises
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
        sentence: data.sentence, // Target language sentence
        targetWord: data.targetWord, // Target word for cloze exercises
        clozeSentence: data.clozeSentence || data.sentence,
        difficulty,
        context: data.context || '',
        createdAt: new Date(),
        attempts: 0,
        correctAttempts: 0,
        exerciseType,
        translation: data.translation, // English translation
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

  const getExplanationFromOpenAI = async (userAnswer: string, correctAnswer: string, sentence: string, language: string, exerciseType: ExerciseType): Promise<string> => {
    try {
      let explanationPrompt = '';
      
      if (exerciseType === 'translation') {
        explanationPrompt = `The user was asked to translate an English sentence into ${language}. Their answer was "${userAnswer}" but the correct translation is "${correctAnswer}". Please provide a detailed explanation in English of what was wrong with the user's translation, including specific grammar mistakes, vocabulary errors, spelling issues, or incorrect word usage. Be constructive and educational.`;
      } else {
        explanationPrompt = `User answered "${userAnswer}" but correct answer is "${correctAnswer}" in the sentence: "${sentence}". Explain in English why "${correctAnswer}" is correct in ${language}, focusing on grammar rules, word usage, or context.`;
      }

      console.log('Requesting explanation from OpenAI:', explanationPrompt);

      const { data, error } = await supabase.functions.invoke('generate-vocabulary-info', {
        body: {
          text: explanationPrompt,
          language: language,
          requestExplanation: true
        }
      });

      if (error) throw error;

      return data?.explanation || data?.definition || `The correct answer is "${correctAnswer}". Please review the grammar and vocabulary for this translation.`;
    } catch (error) {
      console.error('Error getting explanation:', error);
      if (exerciseType === 'translation') {
        return `The expected translation "${correctAnswer}" is more accurate. Your answer contained errors in grammar, vocabulary, or spelling. Please review the correct translation and try to understand the differences.`;
      } else {
        return `The correct answer is "${correctAnswer}". Please review the context and try to understand why this word fits better in the sentence.`;
      }
    }
  };

  const submitAnswer = useCallback(async (answer: string, selectedWords?: string[]) => {
    if (!state.currentExercise || !state.currentSession) {
      console.error('No current exercise or session');
      return;
    }

    try {
      console.log('Submitting answer:', { answer, selectedWords, exerciseType: state.currentExercise.exerciseType });

      let isCorrect = false;
      let explanation = '';
      
      switch (state.currentExercise.exerciseType) {
        case 'translation':
          // For translation exercises, compare with the target language sentence
          const expectedTranslation = state.currentExercise.sentence; // Target language sentence
          const userTranslation = answer.trim();
          
          console.log('Comparing translation:', { userTranslation, expectedTranslation });
          
          if (userTranslation.length === 0) {
            isCorrect = false;
            explanation = 'Please provide a translation.';
          } else {
            // Use the text comparison utility for better accuracy checking
            const comparisonResult = compareTexts(expectedTranslation, userTranslation);
            
            // Consider it correct if accuracy is 80% or higher
            isCorrect = comparisonResult.accuracy >= 80;
            
            console.log('Translation comparison result:', {
              accuracy: comparisonResult.accuracy,
              isCorrect,
              tokenResults: comparisonResult.tokenResults
            });
            
            // Get detailed explanation for incorrect or partially correct translations
            if (!isCorrect || comparisonResult.accuracy < 95) {
              explanation = await getExplanationFromOpenAI(
                userTranslation,
                expectedTranslation,
                state.currentExercise.translation || '', // English sentence
                settings.selectedLanguage,
                'translation'
              );
            }
          }
          break;
          
        case 'vocabulary_marking':
          // For vocabulary marking, always mark as correct (it's about word selection)
          isCorrect = true;
          explanation = selectedWords && selectedWords.length > 0 
            ? `You marked ${selectedWords.length} word(s) for review. Great job identifying vocabulary to practice!`
            : 'No words were marked. That\'s okay - this helps us know what you already understand!';
          break;
          
        case 'cloze':
        default:
          // For cloze exercises, compare with target word
          const expectedWord = state.currentExercise.targetWord.toLowerCase().trim();
          const userWord = answer.toLowerCase().trim();
          
          if (userWord === expectedWord) {
            isCorrect = true;
          } else {
            // Use text comparison for partial credit
            const comparisonResult = compareTexts(expectedWord, userWord);
            isCorrect = comparisonResult.accuracy >= 90;
            
            if (!isCorrect) {
              explanation = await getExplanationFromOpenAI(
                userWord,
                expectedWord,
                state.currentExercise.sentence,
                settings.selectedLanguage,
                'cloze'
              );
            }
          }
          break;
      }

      // Update state with results
      setState(prev => ({
        ...prev,
        showResult: true,
        isCorrect,
        currentExercise: prev.currentExercise ? {
          ...prev.currentExercise,
          explanation: explanation || prev.currentExercise.explanation,
          attempts: prev.currentExercise.attempts + 1,
          correctAttempts: prev.currentExercise.correctAttempts + (isCorrect ? 1 : 0)
        } : null,
        currentSession: prev.currentSession ? {
          ...prev.currentSession,
          totalAttempts: prev.currentSession.totalAttempts + 1,
          totalCorrect: prev.currentSession.totalCorrect + (isCorrect ? 1 : 0)
        } : null
      }));

      // Update progress
      if (state.progress) {
        const updatedProgress = {
          ...state.progress,
          totalExercises: state.progress.totalExercises + 1,
          totalCorrect: state.progress.totalCorrect + (isCorrect ? 1 : 0),
          averageAccuracy: ((state.progress.totalCorrect + (isCorrect ? 1 : 0)) / (state.progress.totalExercises + 1)) * 100,
          difficultyProgress: {
            ...state.progress.difficultyProgress,
            [state.currentExercise.difficulty]: {
              attempted: state.progress.difficultyProgress[state.currentExercise.difficulty].attempted + 1,
              correct: state.progress.difficultyProgress[state.currentExercise.difficulty].correct + (isCorrect ? 1 : 0),
              accuracy: ((state.progress.difficultyProgress[state.currentExercise.difficulty].correct + (isCorrect ? 1 : 0)) / 
                        (state.progress.difficultyProgress[state.currentExercise.difficulty].attempted + 1)) * 100
            }
          },
          exerciseTypeProgress: {
            ...state.progress.exerciseTypeProgress,
            [state.currentExercise.exerciseType]: {
              attempted: state.progress.exerciseTypeProgress[state.currentExercise.exerciseType].attempted + 1,
              correct: state.progress.exerciseTypeProgress[state.currentExercise.exerciseType].correct + (isCorrect ? 1 : 0),
              accuracy: ((state.progress.exerciseTypeProgress[state.currentExercise.exerciseType].correct + (isCorrect ? 1 : 0)) / 
                        (state.progress.exerciseTypeProgress[state.currentExercise.exerciseType].attempted + 1)) * 100
            }
          }
        };

        saveProgress(updatedProgress);
      }

      // Show toast notification
      if (isCorrect) {
        toast.success('Correct! Well done!');
      } else {
        toast.error('Incorrect. Try again or continue to the next exercise.');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Error checking answer. Please try again.');
    }
  }, [state.currentExercise, state.currentSession, state.progress, settings.selectedLanguage, saveProgress]);

  const nextExercise = useCallback(async () => {
    if (!state.currentSession) return;

    try {
      setState(prev => ({ ...prev, loading: true }));

      const exerciseType = getRandomExerciseType();
      const newExercise = await generateSentence(state.currentSession.difficulty, exerciseType);
      
      if (!newExercise) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Failed to generate next exercise' 
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        currentExercise: newExercise,
        userResponse: '',
        selectedWords: [],
        showResult: false,
        isCorrect: false,
        showHint: false,
        showTranslation: false,
        loading: false,
        error: null,
        currentSession: prev.currentSession ? {
          ...prev.currentSession,
          exercises: [...prev.currentSession.exercises, newExercise],
          currentExerciseIndex: prev.currentSession.currentExerciseIndex + 1,
          exerciseTypes: [...prev.currentSession.exerciseTypes, exerciseType]
        } : null
      }));
    } catch (error) {
      console.error('Error generating next exercise:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to generate next exercise' 
      }));
    }
  }, [state.currentSession, getRandomExerciseType, generateSentence]);

  const endSession = useCallback(() => {
    if (state.currentSession && state.progress) {
      const updatedProgress = {
        ...state.progress,
        totalSessions: state.progress.totalSessions + 1,
        lastSessionDate: new Date()
      };
      saveProgress(updatedProgress);
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
      error: null
    }));
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
