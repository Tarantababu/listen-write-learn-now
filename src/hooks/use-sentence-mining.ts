import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DifficultyLevel, ExerciseType, SentenceMiningSession, SentenceMiningExercise, SentenceMiningProgress } from '@/types/sentence-mining';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { evaluateAnswer, evaluateVocabularyMarking } from '@/utils/answerEvaluation';

export const useSentenceMining = () => {
  const { settings } = useUserSettingsContext();
  const [currentSession, setCurrentSession] = useState<SentenceMiningSession | null>(null);
  const [currentExercise, setCurrentExercise] = useState<SentenceMiningExercise | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<SentenceMiningProgress | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Loading sentence mining progress for user:', user.id);

      // Load user's sentence mining sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('sentence_mining_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (sessionsError) {
        console.error('Error loading sessions:', sessionsError);
        return;
      }

      console.log('Loaded sessions:', sessions);

      // Load exercises data for analysis
      const { data: exercises, error: exercisesError } = await supabase
        .from('sentence_mining_exercises')
        .select('*')
        .in('session_id', sessions?.map(s => s.id) || []);

      if (exercisesError) {
        console.error('Error loading exercises:', exercisesError);
      }

      console.log('Loaded exercises:', exercises);

      if (sessions && sessions.length > 0) {
        const recentSessions = sessions.slice(0, 30); // Analyze more sessions for better stats
        
        // Calculate difficulty progress
        const difficultyStats = {
          beginner: { attempted: 0, correct: 0, accuracy: 0 },
          intermediate: { attempted: 0, correct: 0, accuracy: 0 },
          advanced: { attempted: 0, correct: 0, accuracy: 0 }
        };

        recentSessions.forEach(session => {
          const difficulty = session.difficulty_level as DifficultyLevel;
          if (difficultyStats[difficulty]) {
            difficultyStats[difficulty].attempted += session.total_exercises;
            difficultyStats[difficulty].correct += session.correct_exercises;
          }
        });

        // Calculate accuracy for each difficulty
        Object.keys(difficultyStats).forEach(key => {
          const stats = difficultyStats[key as DifficultyLevel];
          stats.accuracy = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;
        });

        // Calculate exercise type progress
        const exerciseTypeStats = {
          translation: { attempted: 0, correct: 0, accuracy: 0 },
          vocabulary_marking: { attempted: 0, correct: 0, accuracy: 0 },
          cloze: { attempted: 0, correct: 0, accuracy: 0 }
        };

        if (exercises) {
          exercises.forEach(exercise => {
            const type = exercise.exercise_type as ExerciseType;
            if (exerciseTypeStats[type]) {
              exerciseTypeStats[type].attempted += 1;
              if (exercise.is_correct) {
                exerciseTypeStats[type].correct += 1;
              }
            }
          });

          // Calculate accuracy for each exercise type
          Object.keys(exerciseTypeStats).forEach(key => {
            const stats = exerciseTypeStats[key as ExerciseType];
            stats.accuracy = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;
          });
        }

        // Calculate streak
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
        let streak = 0;
        let lastDate = '';

        const sortedSessions = [...sessions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        for (const session of sortedSessions) {
          const sessionDate = new Date(session.created_at).toDateString();
          
          if (streak === 0) {
            if (sessionDate === today || sessionDate === yesterday) {
              streak = 1;
              lastDate = sessionDate;
            } else {
              break;
            }
          } else {
            const expectedDate = new Date(new Date(lastDate).getTime() - 24 * 60 * 60 * 1000).toDateString();
            if (sessionDate === expectedDate) {
              streak++;
              lastDate = sessionDate;
            } else {
              break;
            }
          }
        }

        const progressData: SentenceMiningProgress = {
          language: settings.selectedLanguage,
          totalSessions: sessions.length,
          totalExercises: sessions.reduce((sum, s) => sum + s.total_exercises, 0),
          totalCorrect: sessions.reduce((sum, s) => sum + s.correct_exercises, 0),
          averageAccuracy: calculateAverageAccuracy(recentSessions),
          streak,
          lastSessionDate: sessions.length > 0 ? new Date(sessions[0].created_at) : undefined,
          difficultyProgress: difficultyStats,
          exerciseTypeProgress: exerciseTypeStats,
          wordsLearned: await getWordsLearned(user.id)
        };

        console.log('Setting progress data:', progressData);
        setProgress(progressData);
      } else {
        // No sessions yet, set empty progress
        const emptyProgress: SentenceMiningProgress = {
          language: settings.selectedLanguage,
          totalSessions: 0,
          totalExercises: 0,
          totalCorrect: 0,
          averageAccuracy: 0,
          streak: 0,
          difficultyProgress: {
            beginner: { attempted: 0, correct: 0, accuracy: 0 },
            intermediate: { attempted: 0, correct: 0, accuracy: 0 },
            advanced: { attempted: 0, correct: 0, accuracy: 0 }
          },
          exerciseTypeProgress: {
            translation: { attempted: 0, correct: 0, accuracy: 0 },
            vocabulary_marking: { attempted: 0, correct: 0, accuracy: 0 },
            cloze: { attempted: 0, correct: 0, accuracy: 0 }
          },
          wordsLearned: 0
        };
        setProgress(emptyProgress);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const getWordsLearned = async (userId: string) => {
    const { data: knownWords } = await supabase
      .from('known_words')
      .select('word, mastery_level')
      .eq('user_id', userId)
      .gte('mastery_level', 2);

    return knownWords?.length || 0;
  };

  const calculateAverageAccuracy = (sessions: any[]) => {
    if (sessions.length === 0) return 0;
    const totalAccuracy = sessions.reduce((sum, session) => {
      return sum + (session.total_exercises > 0 ? (session.correct_exercises / session.total_exercises) * 100 : 0);
    }, 0);
    return Math.round(totalAccuracy / sessions.length);
  };

  const startSession = async (difficulty: DifficultyLevel) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Starting new session with difficulty:', difficulty);

      // Create new session
      const { data: session, error: sessionError } = await supabase
        .from('sentence_mining_sessions')
        .insert({
          user_id: user.id,
          language: settings.selectedLanguage,
          difficulty_level: difficulty,
          exercise_types: ['translation', 'vocabulary_marking', 'cloze'],
          total_exercises: 0,
          correct_exercises: 0,
          new_words_encountered: 0,
          words_mastered: 0
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      console.log('Session created:', session);

      // Convert database session to our interface format
      const mappedSession: SentenceMiningSession = {
        ...session,
        id: session.id,
        language: session.language,
        difficulty: session.difficulty_level as DifficultyLevel,
        exercises: [],
        currentExerciseIndex: 0,
        startTime: new Date(session.started_at),
        endTime: session.completed_at ? new Date(session.completed_at) : undefined,
        totalCorrect: session.correct_exercises,
        totalAttempts: session.total_exercises,
        exerciseTypes: session.exercise_types as ExerciseType[],
        // Database fields
        user_id: session.user_id,
        difficulty_level: session.difficulty_level as DifficultyLevel,
        total_exercises: session.total_exercises,
        correct_exercises: session.correct_exercises,
        new_words_encountered: session.new_words_encountered,
        words_mastered: session.words_mastered,
        started_at: session.started_at,
        completed_at: session.completed_at,
        created_at: session.created_at,
        session_data: session.session_data
      };

      setCurrentSession(mappedSession);
      
      // Generate first exercise
      await generateNextExercise(session.id, difficulty);
      
    } catch (error: any) {
      console.error('Error starting session:', error);
      setError(error.message);
      toast.error('Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const generateNextExercise = async (sessionId: string, difficulty: DifficultyLevel) => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Generating next exercise for session:', sessionId);

      // Determine exercise type (cycle through different types, excluding multiple_choice)
      const exerciseTypes: ExerciseType[] = ['translation', 'vocabulary_marking', 'cloze'];
      const randomType = exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];

      // Generate exercise using the edge function
      const { data: exercise, error } = await supabase.functions.invoke('generate-sentence-mining', {
        body: {
          difficulty_level: difficulty,
          language: settings.selectedLanguage,
          exercise_type: randomType,
          session_id: sessionId
        }
      });

      if (error) throw error;

      console.log('Generated exercise:', exercise);

      // Store exercise in database
      const { data: storedExercise, error: storeError } = await supabase
        .from('sentence_mining_exercises')
        .insert({
          session_id: sessionId,
          exercise_type: exercise.exerciseType,
          sentence: exercise.sentence,
          translation: exercise.translation,
          target_words: exercise.targetWords,
          unknown_words: exercise.unknownWords,
          difficulty_score: exercise.difficultyScore
        })
        .select()
        .single();

      if (storeError) throw storeError;

      console.log('Stored exercise:', storedExercise);

      setCurrentExercise({
        ...exercise,
        id: storedExercise.id,
        sessionId: storedExercise.session_id
      });

      // Reset UI state
      setUserResponse('');
      setSelectedWords([]);
      setShowResult(false);
      setIsCorrect(false);
      setShowHint(false);
      setShowTranslation(false);

    } catch (error: any) {
      console.error('Error generating exercise:', error);
      setError(error.message);
      toast.error('Failed to generate exercise');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (response: string, selectedWords: string[] = []) => {
    if (!currentExercise || !currentSession) return;

    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let evaluationResult;

      console.log('Submitting answer:', {
        exerciseType: currentExercise.exerciseType,
        userResponse: response,
        correctAnswer: currentExercise.correctAnswer || currentExercise.sentence,
        translation: currentExercise.translation,
        targetWords: currentExercise.targetWords
      });

      // Fixed answer evaluation based on exercise type
      switch (currentExercise.exerciseType) {
        case 'translation':
          // For translation exercises, compare user's response against the English translation
          evaluationResult = evaluateAnswer(
            response, 
            currentExercise.translation || '', // Compare against English translation, not original sentence
            'translation',
            0.7
          );
          break;
          
        case 'vocabulary_marking':
          // For vocabulary marking, always consider it successful (just marking words for learning)
          evaluationResult = {
            isCorrect: true,
            accuracy: 100,
            feedback: selectedWords.length > 0 
              ? `Marked ${selectedWords.length} word(s) for learning` 
              : 'No words selected - that\'s okay!',
            similarityScore: 1,
            category: 'excellent' as const
          };
          break;
          
        case 'cloze':
          evaluationResult = evaluateAnswer(
            response, 
            currentExercise.targetWords || [], 
            'cloze',
            0.8
          );
          break;
          
        default:
          evaluationResult = { isCorrect: false, accuracy: 0, feedback: 'Unknown exercise type', similarityScore: 0, category: 'poor' as const };
      }

      console.log('Evaluation result:', evaluationResult);

      setIsCorrect(evaluationResult.isCorrect);
      setShowResult(true);

      // Update exercise in database
      await supabase
        .from('sentence_mining_exercises')
        .update({
          user_response: response,
          is_correct: evaluationResult.isCorrect,
          completed_at: new Date().toISOString(),
          completion_time: Math.floor(Math.random() * 30) + 10 // Placeholder
        })
        .eq('id', currentExercise.id);

      // Update session stats
      await supabase
        .from('sentence_mining_sessions')
        .update({
          total_exercises: currentSession.total_exercises + 1,
          correct_exercises: currentSession.correct_exercises + (evaluationResult.isCorrect ? 1 : 0)
        })
        .eq('id', currentSession.id);

      // Update word mastery for target words
      if (currentExercise.targetWords) {
        for (const word of currentExercise.targetWords) {
          await supabase.rpc('update_word_mastery', {
            user_id_param: user.id,
            word_param: word,
            language_param: currentSession.language,
            is_correct_param: evaluationResult.isCorrect
          });
        }
      }

      // Update session object
      setCurrentSession(prev => prev ? {
        ...prev,
        total_exercises: prev.total_exercises + 1,
        correct_exercises: prev.correct_exercises + (evaluationResult.isCorrect ? 1 : 0)
      } : null);

      // Show appropriate feedback
      if (currentExercise.exerciseType === 'vocabulary_marking') {
        toast.success(evaluationResult.feedback);
      } else if (evaluationResult.isCorrect) {
        toast.success(evaluationResult.feedback);
      } else {
        toast.error(evaluationResult.feedback);
      }

    } catch (error: any) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  const nextExercise = () => {
    if (currentSession) {
      generateNextExercise(currentSession.id, currentSession.difficulty_level as DifficultyLevel);
    }
  };

  const endSession = async () => {
    if (!currentSession) return;

    try {
      await supabase
        .from('sentence_mining_sessions')
        .update({
          completed_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      setCurrentSession(null);
      setCurrentExercise(null);
      setUserResponse('');
      setSelectedWords([]);
      setShowResult(false);
      setIsCorrect(false);
      setShowHint(false);
      setShowTranslation(false);
      
      // Reload progress
      await loadProgress();
      
      toast.success('Session completed!');
    } catch (error: any) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session');
    }
  };

  const updateUserResponse = (response: string) => {
    setUserResponse(response);
  };

  const toggleWord = (word: string) => {
    setSelectedWords(prev => 
      prev.includes(word) 
        ? prev.filter(w => w !== word)
        : [...prev, word]
    );
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  const toggleTranslation = () => {
    setShowTranslation(!showTranslation);
  };

  return {
    currentSession,
    currentExercise,
    userResponse,
    selectedWords,
    showResult,
    isCorrect,
    loading,
    error,
    progress,
    showHint,
    showTranslation,
    startSession,
    submitAnswer,
    nextExercise,
    endSession,
    updateUserResponse,
    toggleWord,
    toggleHint,
    toggleTranslation
  };
};
