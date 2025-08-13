
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { DifficultyLevel, SentenceMiningExercise, SentenceMiningSession } from '@/types/sentence-mining';
import { ProgressiveSentenceMiningService } from '@/services/progressiveSentenceMiningService';
import { toast } from 'sonner';

export const useProgressiveSentenceMining = () => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  
  const [currentSession, setCurrentSession] = useState<SentenceMiningSession | null>(null);
  const [currentExercise, setCurrentExercise] = useState<SentenceMiningExercise | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [userResponse, setUserResponse] = useState('');
  const [progressionInsights, setProgressionInsights] = useState(null);

  const startProgressiveSession = useCallback(async (difficulty: DifficultyLevel) => {
    if (!user) {
      toast.error('Please log in to start a progressive session');
      return;
    }

    setLoading(true);
    try {
      console.log('[useProgressiveSentenceMining] Starting progressive session');
      
      const sessionData = await ProgressiveSentenceMiningService.startProgressiveSession(
        user.id,
        settings.selectedLanguage,
        difficulty,
        {
          adaptiveWordSelection: true,
          maxNewWordsPerSession: 3,
          reinforcementRatio: 0.6
        }
      );

      // Create session object
      const session: SentenceMiningSession = {
        id: sessionData.sessionId,
        user_id: user.id,
        language: settings.selectedLanguage,
        difficulty_level: difficulty,
        total_exercises: 0,
        correct_exercises: 0,
        new_words_encountered: 0,
        words_mastered: 0,
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        difficulty: difficulty,
        exercises: [],
        currentExerciseIndex: 0,
        startTime: new Date(),
        totalCorrect: 0,
        totalAttempts: 0,
        session_data: sessionData.config
      };

      setCurrentSession(session);
      toast.success(`Started progressive ${difficulty} session`);
      
      // Generate first exercise
      await generateNextExercise(sessionData.sessionId, difficulty);
      
    } catch (error) {
      console.error('Error starting progressive session:', error);
      toast.error('Failed to start progressive session');
    } finally {
      setLoading(false);
    }
  }, [user, settings.selectedLanguage]);

  const generateNextExercise = useCallback(async (sessionId: string, difficulty: DifficultyLevel) => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('[useProgressiveSentenceMining] Generating next progressive exercise');
      
      const exercise = await ProgressiveSentenceMiningService.generateProgressiveExercise(
        user.id,
        sessionId,
        settings.selectedLanguage,
        difficulty
      );

      setCurrentExercise(exercise);
      setShowResult(false);
      setUserResponse('');
      
      console.log('[useProgressiveSentenceMining] Generated exercise:', exercise);
      
    } catch (error) {
      console.error('Error generating progressive exercise:', error);
      toast.error('Failed to generate next exercise');
    } finally {
      setLoading(false);
    }
  }, [user, settings.selectedLanguage]);

  const submitAnswer = useCallback(async (response: string) => {
    if (!user || !currentExercise || !currentSession) return;

    const normalizedResponse = response.toLowerCase().trim();
    const normalizedTarget = currentExercise.targetWord.toLowerCase().trim();
    const isAnswerCorrect = normalizedResponse === normalizedTarget;

    setIsCorrect(isAnswerCorrect);
    setShowResult(true);
    setUserResponse(response);

    try {
      await ProgressiveSentenceMiningService.submitProgressiveAnswer(
        user.id,
        currentExercise.id,
        currentSession.id,
        response,
        currentExercise.targetWord,
        settings.selectedLanguage,
        isAnswerCorrect
      );

      // Update session state
      setCurrentSession(prev => prev ? {
        ...prev,
        total_exercises: prev.total_exercises + 1,
        correct_exercises: prev.correct_exercises + (isAnswerCorrect ? 1 : 0)
      } : null);

      if (isAnswerCorrect) {
        toast.success('Correct! Word progression updated');
      } else {
        toast.error(`Incorrect. The answer was: ${currentExercise.targetWord}`);
      }

    } catch (error) {
      console.error('Error submitting progressive answer:', error);
      toast.error('Failed to submit answer');
    }
  }, [user, currentExercise, currentSession, settings.selectedLanguage]);

  const nextExercise = useCallback(async () => {
    if (!currentSession) return;
    
    await generateNextExercise(currentSession.id, currentSession.difficulty_level as DifficultyLevel);
  }, [currentSession, generateNextExercise]);

  const endSession = useCallback(async () => {
    if (!currentSession) return;

    setLoading(true);
    try {
      // Load progression insights
      const insights = await ProgressiveSentenceMiningService.getProgressionInsights(
        user?.id || '',
        settings.selectedLanguage
      );
      
      setProgressionInsights(insights);
      setCurrentSession(null);
      setCurrentExercise(null);
      
      toast.success('Progressive session completed!');
      
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to complete session');
    } finally {
      setLoading(false);
    }
  }, [currentSession, user, settings.selectedLanguage]);

  const getProgressionInsights = useCallback(async () => {
    if (!user) return null;

    try {
      const insights = await ProgressiveSentenceMiningService.getProgressionInsights(
        user.id,
        settings.selectedLanguage
      );
      setProgressionInsights(insights);
      return insights;
    } catch (error) {
      console.error('Error getting progression insights:', error);
      return null;
    }
  }, [user, settings.selectedLanguage]);

  return {
    // Session state
    currentSession,
    currentExercise,
    loading,
    showResult,
    isCorrect,
    userResponse,
    progressionInsights,
    
    // Actions
    startProgressiveSession,
    submitAnswer,
    nextExercise,
    endSession,
    getProgressionInsights,
    
    // Setters for UI control
    setUserResponse,
    setShowResult
  };
};
