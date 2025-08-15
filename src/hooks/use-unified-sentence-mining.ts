import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DifficultyLevel, SentenceMiningSession, SentenceMiningExercise, SentenceMiningProgress } from '@/types/sentence-mining';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { SpacedRepetitionEngine } from '@/services/spacedRepetition/spacedRepetitionEngine';
import { EnhancedWordFrequencyService } from '@/services/enhancedWordFrequencyService';
import { SessionWordTracker } from '@/services/sessionManagement/sessionWordTracker';

interface UnifiedSentenceMiningState {
  currentSession: SentenceMiningSession | null;
  currentExercise: SentenceMiningExercise | null;
  userResponse: string;
  showResult: boolean;
  isCorrect: boolean;
  loading: boolean;
  error: string | null;
  progress: SentenceMiningProgress | null;
  showHint: boolean;
  showTranslation: boolean;
  isGeneratingNext: boolean;
}

export const useUnifiedSentenceMining = () => {
  const { settings } = useUserSettingsContext();
  const [state, setState] = useState<UnifiedSentenceMiningState>({
    currentSession: null,
    currentExercise: null,
    userResponse: '',
    showResult: false,
    isCorrect: false,
    loading: false,
    error: null,
    progress: null,
    showHint: false,
    showTranslation: false,
    isGeneratingNext: false,
  });

  useEffect(() => {
    loadProgress();
  }, [settings.selectedLanguage]);

  const loadProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data: sessions } = await supabase
        .from('sentence_mining_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('language', settings.selectedLanguage)
        .order('created_at', { ascending: false });

      const totalSessions = sessions?.length || 0;
      const totalExercises = sessions?.reduce((sum, s) => sum + s.total_exercises, 0) || 0;
      const totalCorrect = sessions?.reduce((sum, s) => sum + s.correct_exercises, 0) || 0;
      const averageAccuracy = totalExercises > 0 ? Math.round((totalCorrect / totalExercises) * 100) : 0;

      const { data: knownWords } = await supabase
        .from('known_words')
        .select('mastery_level')
        .eq('user_id', user.id)
        .eq('language', settings.selectedLanguage);

      const vocabularyStats = {
        passiveVocabulary: knownWords?.filter(w => w.mastery_level >= 2).length || 0,
        activeVocabulary: knownWords?.filter(w => w.mastery_level >= 4).length || 0,
        totalWordsEncountered: knownWords?.length || 0,
        language: settings.selectedLanguage
      };

      const progress: SentenceMiningProgress = {
        language: settings.selectedLanguage,
        totalSessions,
        totalExercises,
        totalCorrect,
        averageAccuracy,
        streak: 0,
        vocabularyStats,
        correct: totalCorrect,
        total: totalExercises
      };

      setState(prev => ({ ...prev, progress }));
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const selectOptimalWord = async (userId: string, sessionId: string): Promise<string> => {
    try {
      const wordsForReview = await SpacedRepetitionEngine.getWordsForReview(
        userId,
        settings.selectedLanguage,
        5
      );

      const strugglingWords = await SpacedRepetitionEngine.getStrugglingWords(
        userId,
        settings.selectedLanguage,
        3
      );

      const sessionWords = SessionWordTracker.getSessionWords(sessionId);
      const recentWords = await SessionWordTracker.loadRecentWords(userId, settings.selectedLanguage);

      const avoidWords = [...sessionWords, ...recentWords];

      let selectedWord: string | null = null;

      if (strugglingWords.length > 0 && Math.random() < 0.3) {
        const availableStruggling = strugglingWords.filter(w => !avoidWords.includes(w.toLowerCase()));
        if (availableStruggling.length > 0) {
          selectedWord = availableStruggling[Math.floor(Math.random() * availableStruggling.length)];
          console.log(`[UnifiedSentenceMining] Selected struggling word: ${selectedWord}`);
        }
      }

      if (!selectedWord && wordsForReview.length > 0 && Math.random() < 0.4) {
        const availableReview = wordsForReview.filter(w => !avoidWords.includes(w.toLowerCase()));
        if (availableReview.length > 0) {
          selectedWord = availableReview[Math.floor(Math.random() * availableReview.length)];
          console.log(`[UnifiedSentenceMining] Selected review word: ${selectedWord}`);
        }
      }

      if (!selectedWord) {
        const difficultyMapping: Record<DifficultyLevel, 'beginner' | 'intermediate' | 'advanced'> = {
          beginner: 'beginner',
          intermediate: 'intermediate',
          advanced: 'advanced'
        };

        const currentDifficulty = state.currentSession?.difficulty_level as DifficultyLevel || 'intermediate';
        const result = await EnhancedWordFrequencyService.selectWordsForDifficulty({
          language: settings.selectedLanguage,
          difficulty: difficultyMapping[currentDifficulty],
          count: 1,
          excludeWords: avoidWords,
          maxRepetitions: 2
        });

        if (result.words.length > 0) {
          selectedWord = result.words[0];
          console.log(`[UnifiedSentenceMining] Selected frequency-based word: ${selectedWord} (${result.metadata.selectionQuality}% quality)`);
        }
      }

      if (!selectedWord) {
        const emergencyWords = EnhancedWordFrequencyService.getEmergencyFallbackWords(settings.selectedLanguage);
        const availableEmergency = emergencyWords.filter(w => !avoidWords.includes(w.toLowerCase()));
        
        if (availableEmergency.length > 0) {
          selectedWord = availableEmergency[Math.floor(Math.random() * availableEmergency.length)];
          console.log(`[UnifiedSentenceMining] Selected emergency fallback: ${selectedWord}`);
        } else {
          selectedWord = emergencyWords[0] || 'word';
          console.warn(`[UnifiedSentenceMining] Using absolute fallback: ${selectedWord}`);
        }
      }

      return selectedWord;
    } catch (error) {
      console.error('[UnifiedSentenceMining] Error in word selection:', error);
      const emergencyWords = EnhancedWordFrequencyService.getEmergencyFallbackWords(settings.selectedLanguage);
      return emergencyWords[0] || 'word';
    }
  };

  const nextExercise = useCallback(async (session?: SentenceMiningSession) => {
    const currentSession = session || state.currentSession;
    if (!currentSession) return;

    setState(prev => ({ ...prev, loading: true, isGeneratingNext: true }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const selectedWord = await selectOptimalWord(user.id, currentSession.id);

      console.log(`[UnifiedSentenceMining] Generating exercise for word: ${selectedWord} in ${settings.selectedLanguage}`);

      const exerciseResponse = await supabase.functions.invoke('generate-sentence-mining', {
        body: {
          difficulty_level: currentSession.difficulty_level,
          language: settings.selectedLanguage,
          session_id: currentSession.id,
          user_id: user.id,
          preferred_words: [selectedWord],
          enhanced_mode: true,
          spaced_repetition_mode: true,
          target_word_override: selectedWord,
          language_consistency_check: true
        }
      });

      if (exerciseResponse.error) {
        throw new Error(`Exercise generation failed: ${exerciseResponse.error.message}`);
      }

      const exercise = exerciseResponse.data;

      if (exercise.targetWord) {
        SessionWordTracker.addWordToSession(currentSession.id, exercise.targetWord);
        SessionWordTracker.setCooldown(user.id, exercise.targetWord);

        await SpacedRepetitionEngine.updateWordPerformance(
          user.id,
          exercise.targetWord,
          settings.selectedLanguage,
          true
        );
      }

      setState(prev => ({
        ...prev,
        currentExercise: exercise,
        userResponse: '',
        showResult: false,
        showTranslation: false,
        showHint: false,
        loading: false,
        isGeneratingNext: false
      }));

      console.log(`[UnifiedSentenceMining] Generated exercise with target word: ${exercise.targetWord}`);

    } catch (error) {
      console.error('Error generating exercise:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to generate exercise', 
        loading: false,
        isGeneratingNext: false 
      }));
      toast.error('Failed to generate exercise');
    }
  }, [settings.selectedLanguage, state.currentSession]);

  const startSession = useCallback(async (difficulty: DifficultyLevel) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: session, error } = await supabase
        .from('sentence_mining_sessions')
        .insert([{
          user_id: user.id,
          language: settings.selectedLanguage,
          difficulty_level: difficulty,
          exercise_types: ['cloze']
        }])
        .select()
        .single();

      if (error) throw error;

      const newSession: SentenceMiningSession = {
        id: session.id,
        language: session.language,
        difficulty: session.difficulty_level as DifficultyLevel,
        exercises: [],
        currentExerciseIndex: 0,
        startTime: new Date(),
        totalCorrect: 0,
        totalAttempts: 0,
        user_id: session.user_id,
        difficulty_level: session.difficulty_level as DifficultyLevel,
        total_exercises: session.total_exercises,
        correct_exercises: session.correct_exercises,
        new_words_encountered: session.new_words_encountered,
        words_mastered: session.words_mastered,
        started_at: session.started_at,
        created_at: session.created_at,
        session_data: session.session_data
      };

      setState(prev => ({ ...prev, currentSession: newSession }));

      SessionWordTracker.initializeSession(newSession.id);

      console.log(`[UnifiedSentenceMining] Started session with spaced repetition for ${settings.selectedLanguage}`);

      return newSession;
    } catch (error) {
      console.error('Error starting session:', error);
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to start session' }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [settings.selectedLanguage]);

  const submitAnswer = useCallback(async (response: string, selectedWords: string[] = [], isSkipped: boolean = false) => {
    const currentSession = state.currentSession;
    const currentExercise = state.currentExercise;
    if (!currentSession || !currentExercise) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const correctAnswer = currentExercise.correctAnswer;
      const isCorrect = !isSkipped && response.toLowerCase().trim() === correctAnswer?.toLowerCase().trim();

      const { error: exerciseError } = await supabase
        .from('sentence_mining_exercises')
        .insert([{
          session_id: currentSession.id,
          sentence: currentExercise.sentence,
          target_words: [currentExercise.targetWord],
          user_response: response,
          is_correct: isCorrect,
          difficulty_score: currentExercise.difficultyScore || 1,
          exercise_type: 'cloze',
          translation: currentExercise.translation,
          unknown_words: isSkipped ? [currentExercise.targetWord] : [],
          hints_used: 0,
          completed_at: new Date().toISOString()
        }]);

      if (exerciseError) {
        console.error('Error storing exercise:', exerciseError);
      }

      await SpacedRepetitionEngine.updateWordPerformance(
        user.id,
        currentExercise.targetWord,
        settings.selectedLanguage,
        isCorrect
      );

      const updatedSession = {
        ...currentSession,
        totalAttempts: currentSession.totalAttempts + 1,
        totalCorrect: currentSession.totalCorrect + (isCorrect ? 1 : 0)
      };

      await supabase
        .from('sentence_mining_sessions')
        .update({
          total_exercises: updatedSession.totalAttempts,
          correct_exercises: updatedSession.totalCorrect
        })
        .eq('id', currentSession.id);

      setState(prev => ({
        ...prev,
        currentSession: updatedSession,
        showResult: true,
        isCorrect,
        loading: false
      }));

      await loadProgress();

      if (isCorrect) {
        const meaning = EnhancedWordFrequencyService.getWordMeaning(settings.selectedLanguage, currentExercise.targetWord);
        toast.success('Correct!', {
          description: meaning !== currentExercise.targetWord ? `"${meaning}"` : undefined
        });
      } else if (!isSkipped) {
        toast.error('Try again next time!', {
          description: `The answer was "${correctAnswer}"`
        });
      }

    } catch (error) {
      console.error('Error submitting answer:', error);
      setState(prev => ({ ...prev, loading: false, error: 'Failed to submit answer' }));
    }
  }, [loadProgress, settings.selectedLanguage]);

  const endSession = useCallback(async () => {
    const { currentSession } = state;
    if (!currentSession) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('sentence_mining_sessions')
        .update({
          completed_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      SessionWordTracker.clearSession(currentSession.id);

      setState(prev => ({
        ...prev,
        currentSession: null,
        currentExercise: null,
        userResponse: '',
        showResult: false
      }));

      await loadProgress();

      const accuracy = currentSession.totalAttempts > 0 
        ? Math.round((currentSession.totalCorrect / currentSession.totalAttempts) * 100)
        : 0;
      
      toast.success(`Session completed! ${accuracy}% accuracy`, {
        description: `${currentSession.totalCorrect}/${currentSession.totalAttempts} correct answers`
      });

    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, [loadProgress]);

  const updateUserResponse = (response: string) => {
    setState(prev => ({ ...prev, userResponse: response }));
  };

  const toggleTranslation = () => {
    setState(prev => ({ ...prev, showTranslation: !prev.showTranslation }));
  };

  const toggleHint = () => {
    setState(prev => ({ ...prev, showHint: !prev.showHint }));
  };

  return {
    ...state,
    startSession,
    submitAnswer,
    nextExercise,
    endSession,
    updateUserResponse,
    toggleTranslation,
    toggleHint,
    loadProgress
  };
};
