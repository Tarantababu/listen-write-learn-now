import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DifficultyLevel, SentenceMiningSession, SentenceMiningExercise, SentenceMiningProgress } from '@/types/sentence-mining';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedSentenceMiningService } from '@/services/enhancedSentenceMiningService';

export const useEnhancedSentenceMining = (language: string, difficulty: DifficultyLevel) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exercises, setExercises] = useState<SentenceMiningExercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState<SentenceMiningExercise | null>(null);
  const [sessionProgress, setSessionProgress] = useState<SentenceMiningProgress>({
    language,
    totalSessions: 0,
    totalExercises: 0,
    totalCorrect: 0,
    averageAccuracy: 0,
    streak: 0,
    vocabularyStats: {
      passiveVocabulary: 0,
      activeVocabulary: 0,
      totalWordsEncountered: 0,
      language
    },
    correct: 0,
    total: 0,
    incorrect: 0
  });
  const [currentSession, setCurrentSession] = useState<SentenceMiningSession | null>(null);
  const { user } = useAuth();

  const endSession = useCallback(async (session: SentenceMiningSession) => {
    if (!user || !session) {
      console.warn('No user or session available to end');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate session statistics
      const totalExercises = exercises.length;
      const correctExercises = exercises.filter(exercise => exercise.isCorrect === true).length;

      // Update the session record with correct field names
      const { error: updateError } = await supabase
        .from('sentence_mining_sessions')
        .update({
          completed_at: new Date().toISOString(),
          total_exercises: totalExercises,
          correct_exercises: correctExercises
        })
        .eq('id', session.id);

      if (updateError) {
        throw new Error(`Failed to end session: ${updateError.message}`);
      }

      setCurrentSession(null);
      setExercises([]);
      setSessionProgress(prev => ({ ...prev, correct: 0, total: 0 }));
      console.log(`[Enhanced Hook] Ended session: ${session.id}`);
    } catch (error) {
      console.error('Error ending session:', error);
      setError(error instanceof Error ? error.message : 'Failed to end session');
      toast.error('Failed to end session. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, exercises]);

  const startNewSession = useCallback(async () => {
    if (!user) {
      console.error('No user available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // End the current session if it exists
      if (currentSession) {
        await endSession(currentSession);
      }

      // Create a new session with correct field names
      const { data: newSession, error: sessionError } = await supabase
        .from('sentence_mining_sessions')
        .insert({
          user_id: user.id,
          language: language,
          difficulty_level: difficulty,
          started_at: new Date().toISOString(),
          completed_at: null,
          total_exercises: 0,
          correct_exercises: 0,
          exercise_types: ['cloze']
        })
        .select()
        .single();

      if (sessionError) {
        throw new Error(`Failed to start new session: ${sessionError.message}`);
      }

      // Convert to expected format with proper type casting
      const formattedSession: SentenceMiningSession = {
        ...newSession,
        difficulty: newSession.difficulty_level as DifficultyLevel,
        difficulty_level: newSession.difficulty_level as DifficultyLevel,
        exercises: [],
        currentExerciseIndex: 0,
        startTime: new Date(newSession.started_at),
        totalCorrect: 0,
        totalAttempts: 0
      };

      setCurrentSession(formattedSession);
      setExercises([]);
      setSessionProgress(prev => ({ ...prev, correct: 0, total: 0 }));
      console.log(`[Enhanced Hook] Started new session: ${newSession.id}`);
      
      return formattedSession;
    } catch (error) {
      console.error('Error starting new session:', error);
      setError(error instanceof Error ? error.message : 'Failed to start new session');
      toast.error('Failed to start new session. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, language, difficulty, currentSession, endSession]);

  const generateExercise = useCallback(async (): Promise<SentenceMiningExercise | null> => {
    if (!user || !currentSession) {
      console.error('[Enhanced Hook] No user or session available');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`[Enhanced Hook] Generating exercise for ${language} (${difficulty})`);

      // Always use the enhanced service for better word diversity
      const exercise = await EnhancedSentenceMiningService.generateEnhancedExercise({
        userId: user.id,
        language,
        difficulty,
        sessionId: currentSession.id,
        previousSentences: exercises.slice(-5).map(e => e.sentence), // Last 5 sentences
        enhancedMode: true
      });

      // Create the exercise record in the database with correct field names
      const { data: exerciseRecord, error: insertError } = await supabase
        .from('sentence_mining_exercises')
        .insert({
          session_id: currentSession.id,
          sentence: exercise.sentence,
          target_words: [exercise.targetWord],
          translation: exercise.translation,
          exercise_type: 'cloze',
          difficulty_score: 50, // Default difficulty score
          unknown_words: [],
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to save exercise: ${insertError.message}`);
      }

      const newExercise: SentenceMiningExercise = {
        id: exerciseRecord.id,
        sentence: exercise.sentence,
        targetWord: exercise.targetWord,
        targetWordTranslation: exercise.targetWordTranslation,
        clozeSentence: exercise.clozeSentence,
        translation: exercise.translation,
        difficulty: difficulty,
        context: exercise.context,
        hints: exercise.hints,
        isCorrect: null,
        userAnswer: '',
        attempts: 0,
        sessionId: currentSession.id,
        createdAt: new Date(exerciseRecord.created_at),
        exerciseType: 'cloze',
        correctAnswer: exercise.targetWord
      };

      setExercises(prev => [...prev, newExercise]);
      setCurrentExercise(newExercise);

      // Log word selection details for debugging
      if (exercise.enhancedMetrics?.wordSelectionMetrics) {
        const metrics = exercise.enhancedMetrics.wordSelectionMetrics;
        console.log(`[Enhanced Hook] Word selection: ${metrics.selectionMethod}, diversity: ${metrics.diversityScore}, cooldown filtered: ${metrics.cooldownFiltered}`);
      }

      return newExercise;

    } catch (error) {
      console.error('[Enhanced Hook] Error generating exercise:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate exercise');
      
      // Show user-friendly error message
      toast.error('Failed to generate exercise. Please try again.');
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, currentSession, language, difficulty, exercises]);

  const submitAnswer = useCallback(async (exercise: SentenceMiningExercise, userAnswer: string): Promise<boolean | null> => {
    if (!user || !currentSession || !exercise) {
      console.error('No user, session, or exercise available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Determine if the answer is correct (case-insensitive comparison)
      const isCorrect = userAnswer.trim().toLowerCase() === exercise.targetWord.toLowerCase();

      // Update the exercise record in the database
      const { error: updateError } = await supabase
        .from('sentence_mining_exercises')
        .update({
          is_correct: isCorrect,
          user_response: userAnswer
        })
        .eq('id', exercise.id);

      if (updateError) {
        throw new Error(`Failed to submit answer: ${updateError.message}`);
      }

      // Update the local state
      const updatedExercises = exercises.map(ex =>
        ex.id === exercise.id ? { ...ex, isCorrect, userAnswer, attempts: ex.attempts + 1 } : ex
      );
      setExercises(updatedExercises);
      setCurrentExercise(null); // Clear current exercise

      // Update session progress
      setSessionProgress(prev => ({
        ...prev,
        total: prev.total + 1,
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        incorrect: isCorrect ? prev.incorrect || 0 : (prev.incorrect || 0) + 1
      }));

      // Provide feedback to the user
      if (isCorrect) {
        toast.success('Correct!');
      } else {
        toast.error(`Incorrect. The correct answer was "${exercise.targetWord}".`);
      }

      console.log(`[Enhanced Hook] Submitted answer for exercise: ${exercise.id}, Correct: ${isCorrect}`);
      return isCorrect;
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit answer');
      toast.error('Failed to submit answer. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, currentSession, exercises]);

  // Enhanced analytics for debugging word repetition
  useEffect(() => {
    if (exercises.length > 0) {
      const wordUsage = new Map<string, number>();
      exercises.forEach(ex => {
        const word = ex.targetWord.toLowerCase();
        wordUsage.set(word, (wordUsage.get(word) || 0) + 1);
      });

      // Log word usage statistics
      const sortedUsage = Array.from(wordUsage.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      if (sortedUsage.length > 0) {
        console.log(`[Enhanced Hook] Word usage stats:`, sortedUsage.map(([word, count]) => `${word}: ${count}`).join(', '));
        
        // Warn about overused words
        const overusedWords = sortedUsage.filter(([, count]) => count > 3);
        if (overusedWords.length > 0) {
          console.warn(`[Enhanced Hook] Overused words detected:`, overusedWords);
        }
      }
    }
  }, [exercises]);

  return {
    loading,
    error,
    exercises,
    currentExercise,
    sessionProgress,
    currentSession,
    startNewSession,
    endSession,
    generateExercise,
    submitAnswer
  };
};
