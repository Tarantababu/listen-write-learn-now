import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DifficultyLevel, ExerciseType, SentenceMiningSession, SentenceMiningExercise } from '@/types/sentence-mining';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { evaluateAnswer, evaluateVocabularyMarking, evaluateMultipleChoice } from '@/utils/answerEvaluation';

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
  const [progress, setProgress] = useState<any>(null);
  const [showHint, setShowHint] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user's sentence mining progress
      const { data: sessions } = await supabase
        .from('sentence_mining_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (sessions && sessions.length > 0) {
        const recentSessions = sessions.slice(0, 10);
        const difficultyProgress = {
          beginner: recentSessions.filter(s => s.difficulty_level === 'beginner').length,
          intermediate: recentSessions.filter(s => s.difficulty_level === 'intermediate').length,
          advanced: recentSessions.filter(s => s.difficulty_level === 'advanced').length,
        };

        setProgress({
          totalSessions: sessions.length,
          averageAccuracy: calculateAverageAccuracy(recentSessions),
          difficultyProgress,
          wordsLearned: await getWordsLearned(user.id)
        });
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

      // Create new session
      const { data: session, error: sessionError } = await supabase
        .from('sentence_mining_sessions')
        .insert({
          user_id: user.id,
          language: settings.selectedLanguage,
          difficulty_level: difficulty,
          exercise_types: ['translation', 'vocabulary_marking', 'cloze', 'multiple_choice'],
          total_exercises: 0,
          correct_exercises: 0,
          new_words_encountered: 0,
          words_mastered: 0
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

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

      // Determine exercise type (cycle through different types)
      const exerciseTypes: ExerciseType[] = ['translation', 'vocabulary_marking', 'cloze', 'multiple_choice'];
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
        correctAnswer: currentExercise.sentence,
        translation: currentExercise.translation,
        targetWords: currentExercise.targetWords
      });

      // Enhanced answer evaluation based on exercise type
      switch (currentExercise.exerciseType) {
        case 'translation':
          // For translation exercises, compare user's response against the target language sentence
          evaluationResult = evaluateAnswer(
            response, 
            currentExercise.sentence || '', 
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
          
        case 'multiple_choice':
          evaluationResult = evaluateMultipleChoice(
            response,
            currentExercise.correctAnswer || ''
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
