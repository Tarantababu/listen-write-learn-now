import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DifficultyLevel, SentenceMiningSession, SentenceMiningExercise, SentenceMiningProgress } from '@/types/sentence-mining';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedSentenceMiningService } from '@/services/enhancedSentenceMiningService';
import { IntelligentWordSelection } from '@/services/intelligentWordSelection';
import { WordDiversityEngine } from '@/services/wordDiversityEngine';
import { SentencePatternDiversityEngine } from '@/services/sentencePatternDiversityEngine';

export const useEnhancedSentenceMining = (language: string, difficulty: DifficultyLevel) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exercises, setExercises] = useState<SentenceMiningExercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState<SentenceMiningExercise | null>(null);
  const [sessionProgress, setSessionProgress] = useState<SentenceMiningProgress>({
    correct: 0,
    incorrect: 0,
    total: 0
  });
  const [currentSession, setCurrentSession] = useState<SentenceMiningSession | null>(null);
  const { user } = useAuth();

  const startNewSession = useCallback(async () => {
    if (!user) {
      console.error('No user available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // End the current session if it exists
      if (currentSession) {
        await endCurrentSession();
      }

      // Create a new session
      const { data: newSession, error: sessionError } = await supabase
        .from('sentence_mining_sessions')
        .insert({
          user_id: user.id,
          language: language,
          difficulty_level: difficulty,
          start_time: new Date(),
          end_time: null,
          total_exercises: 0,
          correct_exercises: 0
        })
        .select()
        .single();

      if (sessionError) {
        throw new Error(`Failed to start new session: ${sessionError.message}`);
      }

      setCurrentSession(newSession);
      setExercises([]);
      setSessionProgress({ correct: 0, incorrect: 0, total: 0 });
      console.log(`[Enhanced Hook] Started new session: ${newSession.id}`);
    } catch (error) {
      console.error('Error starting new session:', error);
      setError(error instanceof Error ? error.message : 'Failed to start new session');
      toast.error('Failed to start new session. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, language, difficulty, currentSession, endCurrentSession]);

  const endCurrentSession = useCallback(async () => {
    if (!user || !currentSession) {
      console.warn('No user or session available to end');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate session statistics
      const totalExercises = exercises.length;
      const correctExercises = exercises.filter(exercise => exercise.isCorrect === true).length;

      // Update the session record
      const { error: updateError } = await supabase
        .from('sentence_mining_sessions')
        .update({
          end_time: new Date(),
          total_exercises: totalExercises,
          correct_exercises: correctExercises
        })
        .eq('id', currentSession.id);

      if (updateError) {
        throw new Error(`Failed to end session: ${updateError.message}`);
      }

      setCurrentSession(null);
      setExercises([]);
      setSessionProgress({ correct: 0, incorrect: 0, total: 0 });
      console.log(`[Enhanced Hook] Ended session: ${currentSession.id}`);
    } catch (error) {
      console.error('Error ending session:', error);
      setError(error instanceof Error ? error.message : 'Failed to end session');
      toast.error('Failed to end session. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, currentSession, exercises]);

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

      // Create the exercise record in the database
      const { data: exerciseRecord, error: insertError } = await supabase
        .from('sentence_mining_exercises')
        .insert({
          user_id: user.id,
          session_id: currentSession.id,
          sentence: exercise.sentence,
          cloze_sentence: exercise.clozeSentence,
          target_words: [exercise.targetWord],
          translation: exercise.translation,
          target_word_translation: exercise.targetWordTranslation,
          difficulty_level: difficulty,
          language: language,
          context: exercise.context,
          hints: exercise.hints,
          exercise_data: {
            enhancedMetrics: exercise.enhancedMetrics,
            wordSelectionReason: exercise.wordSelectionReason,
            alternativeWords: exercise.alternativeWords,
            version: '2.1'
          }
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
        language: language,
        context: exercise.context,
        hints: exercise.hints,
        isCorrect: null,
        userAnswer: '',
        attempts: 0,
        sessionId: currentSession.id,
        createdAt: new Date(exerciseRecord.created_at),
        exerciseType: 'cloze'
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

  const submitAnswer = useCallback(async (exerciseId: string, userAnswer: string) => {
    if (!user || !currentSession) {
      console.error('No user or session available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the current exercise
      const exercise = exercises.find(ex => ex.id === exerciseId);
      if (!exercise) {
        throw new Error('Exercise not found');
      }

      // Determine if the answer is correct (case-insensitive comparison)
      const isCorrect = userAnswer.trim().toLowerCase() === exercise.targetWord.toLowerCase();

      // Update the exercise record in the database
      const { error: updateError } = await supabase
        .from('sentence_mining_exercises')
        .update({
          attempts: exercise.attempts + 1,
          correct_attempts: isCorrect ? exercise.correctAttempts + 1 : exercise.correctAttempts,
          is_correct: isCorrect
        })
        .eq('id', exerciseId);

      if (updateError) {
        throw new Error(`Failed to submit answer: ${updateError.message}`);
      }

      // Update the local state
      const updatedExercises = exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, isCorrect, userAnswer, attempts: ex.attempts + 1 } : ex
      );
      setExercises(updatedExercises);
      setCurrentExercise(null); // Clear current exercise

      // Update session progress
      setSessionProgress(prev => ({
        ...prev,
        total: prev.total + 1,
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        incorrect: isCorrect ? prev.incorrect : prev.incorrect + 1
      }));

      // Provide feedback to the user
      if (isCorrect) {
        toast.success('Correct!');
      } else {
        toast.error(`Incorrect. The correct answer was "${exercise.targetWord}".`);
      }

      console.log(`[Enhanced Hook] Submitted answer for exercise: ${exerciseId}, Correct: ${isCorrect}`);
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit answer');
      toast.error('Failed to submit answer. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, currentSession, exercises]);

  useEffect(() => {
    // Load existing session if available
    const loadExistingSession = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        // Get the most recent session that hasn't been ended
        const { data: activeSession, error: sessionError } = await supabase
          .from('sentence_mining_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('language', language)
          .eq('difficulty_level', difficulty)
          .is('end_time', null)
          .order('start_time', { ascending: false })
          .limit(1)
          .single();

        if (sessionError) {
          throw new Error(`Failed to load session: ${sessionError.message}`);
        }

        if (activeSession) {
          setCurrentSession(activeSession);

          // Load exercises for the session
          const { data: sessionExercises, error: exerciseError } = await supabase
            .from('sentence_mining_exercises')
            .select('*')
            .eq('session_id', activeSession.id)
            .order('created_at', { ascending: true });

          if (exerciseError) {
            throw new Error(`Failed to load exercises: ${exerciseError.message}`);
          }

          const formattedExercises: SentenceMiningExercise[] = sessionExercises.map(ex => ({
            id: ex.id,
            sentence: ex.sentence,
            targetWord: ex.target_words[0],
            targetWordTranslation: ex.target_word_translation,
            clozeSentence: ex.cloze_sentence,
            translation: ex.translation,
            difficulty: ex.difficulty_level,
            language: ex.language,
            context: ex.context,
            hints: ex.hints,
            isCorrect: ex.is_correct,
            userAnswer: ex.userAnswer,
            attempts: ex.attempts,
            sessionId: activeSession.id,
            createdAt: new Date(ex.created_at),
            exerciseType: 'cloze'
          }));

          setExercises(formattedExercises);

          // Calculate session progress
          const correctExercises = formattedExercises.filter(exercise => exercise.isCorrect === true).length;
          setSessionProgress({
            correct: correctExercises,
            incorrect: formattedExercises.length - correctExercises,
            total: formattedExercises.length
          });

          console.log(`[Enhanced Hook] Loaded existing session: ${activeSession.id} with ${formattedExercises.length} exercises`);
        } else {
          console.log('[Enhanced Hook] No active session found');
        }
      } catch (error) {
        console.error('Error loading existing session:', error);
        setError(error instanceof Error ? error.message : 'Failed to load existing session');
        toast.error('Failed to load existing session. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadExistingSession();
  }, [user, language, difficulty]);

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
    endCurrentSession,
    generateExercise,
    submitAnswer
  };
};
