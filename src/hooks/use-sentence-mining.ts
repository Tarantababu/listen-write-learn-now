
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DifficultyLevel, SentenceMiningSession, SentenceMiningExercise, SentenceMiningProgress, VocabularyStats } from '@/types/sentence-mining';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { evaluateAnswer } from '@/utils/answerEvaluation';

export const useSentenceMining = () => {
  const { settings } = useUserSettingsContext();
  const [currentSession, setCurrentSession] = useState<SentenceMiningSession | null>(null);
  const [currentExercise, setCurrentExercise] = useState<SentenceMiningExercise | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<SentenceMiningProgress | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);

  useEffect(() => {
    loadProgress();
  }, [settings.selectedLanguage]);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Loading sentence mining progress for user:', user.id, 'language:', settings.selectedLanguage);

      // Load user's sentence mining sessions for the selected language
      const { data: sessions, error: sessionsError } = await supabase
        .from('sentence_mining_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('language', settings.selectedLanguage)
        .order('created_at', { ascending: false });

      if (sessionsError) {
        console.error('Error loading sessions:', sessionsError);
        return;
      }

      // Calculate vocabulary stats
      const { data: knownWords } = await supabase
        .from('known_words')
        .select('word, mastery_level')
        .eq('user_id', user.id)
        .eq('language', settings.selectedLanguage);

      const vocabularyStats: VocabularyStats = {
        passiveVocabulary: knownWords?.length || 0,
        activeVocabulary: knownWords?.filter(w => w.mastery_level >= 3).length || 0,
        totalWordsEncountered: knownWords?.length || 0,
        language: settings.selectedLanguage
      };

      // Calculate streak (simplified)
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
      let streak = 0;

      if (sessions && sessions.length > 0) {
        const latestSession = sessions[0];
        const sessionDate = new Date(latestSession.created_at).toDateString();
        
        if (sessionDate === today || sessionDate === yesterday) {
          streak = 1;
          // Could extend this to calculate longer streaks
        }
      }

      const progressData: SentenceMiningProgress = {
        language: settings.selectedLanguage,
        totalSessions: sessions?.length || 0,
        totalExercises: sessions?.reduce((sum, s) => sum + s.total_exercises, 0) || 0,
        totalCorrect: sessions?.reduce((sum, s) => sum + s.correct_exercises, 0) || 0,
        averageAccuracy: sessions?.length ? calculateAverageAccuracy(sessions) : 0,
        streak,
        lastSessionDate: sessions?.length > 0 ? new Date(sessions[0].created_at) : undefined,
        vocabularyStats
      };

      console.log('Setting simplified progress data:', progressData);
      setProgress(progressData);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
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

      console.log('Starting new cloze session with difficulty:', difficulty, 'language:', settings.selectedLanguage);

      // Create new session
      const { data: session, error: sessionError } = await supabase
        .from('sentence_mining_sessions')
        .insert({
          user_id: user.id,
          language: settings.selectedLanguage,
          difficulty_level: difficulty,
          exercise_types: ['cloze'], // Only cloze exercises
          total_exercises: 0,
          correct_exercises: 0,
          new_words_encountered: 0,
          words_mastered: 0
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      console.log('Session created:', session);

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
    setIsGeneratingNext(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Generating next cloze exercise for session:', sessionId, 'language:', settings.selectedLanguage);

      // Get user's known words for N+1 methodology
      const { data: knownWords } = await supabase
        .from('known_words')
        .select('word, mastery_level')
        .eq('user_id', user.id)
        .eq('language', settings.selectedLanguage)
        .gte('mastery_level', 1);

      // Get previous exercises from this session to avoid repetition
      const { data: previousExercises } = await supabase
        .from('sentence_mining_exercises')
        .select('sentence')
        .eq('session_id', sessionId);

      // Generate cloze exercise using the edge function
      const { data: exercise, error } = await supabase.functions.invoke('generate-sentence-mining', {
        body: {
          difficulty_level: difficulty,
          language: settings.selectedLanguage,
          session_id: sessionId,
          known_words: knownWords?.map(w => w.word) || [],
          previous_sentences: previousExercises?.map(e => e.sentence) || [],
          n_plus_one: true
        }
      });

      if (error) throw error;

      console.log('Generated cloze exercise:', exercise);

      // Store exercise in database
      const { data: storedExercise, error: storeError } = await supabase
        .from('sentence_mining_exercises')
        .insert({
          session_id: sessionId,
          exercise_type: 'cloze',
          sentence: exercise.sentence,
          translation: exercise.translation,
          target_words: [exercise.targetWord], // Store as array for compatibility
          unknown_words: [exercise.targetWord],
          difficulty_score: exercise.difficultyScore
        })
        .select()
        .single();

      if (storeError) throw storeError;

      console.log('Stored exercise:', storedExercise);

      // Map to our interface
      setCurrentExercise({
        id: storedExercise.id,
        sentence: exercise.sentence,
        targetWord: exercise.targetWord,
        clozeSentence: exercise.clozeSentence,
        difficulty: difficulty,
        context: exercise.context,
        createdAt: new Date(),
        attempts: 0,
        correctAttempts: 0,
        translation: exercise.translation,
        correctAnswer: exercise.targetWord,
        hints: exercise.hints,
        sessionId: storedExercise.session_id,
        difficultyScore: exercise.difficultyScore
      });

      // Reset UI state
      setUserResponse('');
      setShowResult(false);
      setIsCorrect(false);
      setShowTranslation(false);

    } catch (error: any) {
      console.error('Error generating exercise:', error);
      setError(error.message);
      toast.error('Failed to generate exercise');
    } finally {
      setIsGeneratingNext(false);
    }
  };

  const submitAnswer = async (response: string, selectedWords: string[] = [], isSkipped: boolean = false) => {
    if (!currentExercise || !currentSession) return;

    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Submitting cloze answer:', {
        userResponse: response,
        correctAnswer: currentExercise.targetWord,
        isSkipped
      });

      // Evaluate cloze answer
      const evaluationResult = isSkipped ? {
        isCorrect: false,
        accuracy: 0,
        feedback: 'Exercise skipped',
        similarityScore: 0,
        category: 'skipped' as const
      } : evaluateAnswer(
        response, 
        currentExercise.targetWord, 
        'cloze',
        0.8
      );

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
          completion_time: Math.floor(Math.random() * 30) + 10,
          is_skipped: isSkipped
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

      // Update word mastery for target word (unless skipped)
      if (!isSkipped && currentExercise.targetWord) {
        await supabase.rpc('update_word_mastery', {
          user_id_param: user.id,
          word_param: currentExercise.targetWord,
          language_param: settings.selectedLanguage,
          is_correct_param: evaluationResult.isCorrect
        });
      }

      // Update session object
      setCurrentSession(prev => prev ? {
        ...prev,
        total_exercises: prev.total_exercises + 1,
        correct_exercises: prev.correct_exercises + (evaluationResult.isCorrect ? 1 : 0)
      } : null);

      // Show feedback
      if (isSkipped) {
        toast.info('Exercise skipped');
      } else if (evaluationResult.isCorrect) {
        toast.success('Correct!');
      } else {
        toast.error(`The answer was: ${currentExercise.targetWord}`);
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
      setShowResult(false);
      setIsCorrect(false);
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

  const toggleTranslation = () => {
    setShowTranslation(!showTranslation);
  };

  return {
    currentSession,
    currentExercise,
    userResponse,
    showResult,
    isCorrect,
    loading,
    error,
    progress,
    showTranslation,
    isGeneratingNext,
    startSession,
    submitAnswer,
    nextExercise,
    endSession,
    updateUserResponse,
    toggleTranslation
  };
};
