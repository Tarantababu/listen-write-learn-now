
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DifficultyLevel, SentenceMiningSession, SentenceMiningExercise, SentenceMiningProgress, VocabularyStats } from '@/types/sentence-mining';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { ImprovedAutomaticWordSelection } from '@/services/improvedAutomaticWordSelection';
import { SessionWordTracker } from '@/services/sessionWordTracker';

export const useEnhancedSentenceMining = () => {
  const { settings } = useUserSettingsContext();
  const [state, setState] = useState({
    currentSession: null as SentenceMiningSession | null,
    currentExercise: null as SentenceMiningExercise | null,
    userResponse: '',
    showResult: false,
    isCorrect: false,
    loading: false,
    error: null as string | null,
    progress: null as SentenceMiningProgress | null,
    showHint: false,
    showTranslation: false,
    isGeneratingNext: false,
  });

  const [vocabularyStats, setVocabularyStats] = useState<VocabularyStats | null>(null);
  const [recentWords, setRecentWords] = useState<string[]>([]);

  // Load progress and recent words
  useEffect(() => {
    loadProgress();
    loadRecentWords();
  }, [settings.selectedLanguage]);

  const loadProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Get sessions for the selected language
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

      // Load vocabulary stats
      const { data: knownWords } = await supabase
        .from('known_words')
        .select('mastery_level')
        .eq('user_id', user.id)
        .eq('language', settings.selectedLanguage);

      const vocabularyStats: VocabularyStats = {
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
      setVocabularyStats(vocabularyStats);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const loadRecentWords = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const words = await SessionWordTracker.loadRecentWords(user.id, settings.selectedLanguage);
      setRecentWords(words);
    } catch (error) {
      console.error('Error loading recent words:', error);
    }
  };

  const nextExercise = useCallback(async (session?: SentenceMiningSession) => {
    const currentSession = session || state.currentSession;
    if (!currentSession) return;

    setState(prev => ({ ...prev, loading: true, isGeneratingNext: true }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get comprehensive avoidance list
      const sessionWords = SessionWordTracker.getSessionWords(currentSession.id);
      const avoidanceList = SessionWordTracker.getAvoidanceList(currentSession.id, user.id, recentWords);
      
      console.log(`[EnhancedSentenceMining] Session words: [${sessionWords.join(', ')}]`);
      console.log(`[EnhancedSentenceMining] Total avoiding: ${avoidanceList.length} words`);

      // Get improved word selection
      const wordSelection = await ImprovedAutomaticWordSelection.selectAutomaticWord({
        language: settings.selectedLanguage,
        difficulty: currentSession.difficulty_level as DifficultyLevel,
        userId: user.id,
        sessionId: currentSession.id,
        previousWords: avoidanceList,
        wordCount: 1,
        avoidRecentWords: true
      });

      console.log(`[EnhancedSentenceMining] Selected: ${wordSelection.selectedWord} (${wordSelection.selectionReason})`);

      // Generate exercise with enhanced parameters
      const exerciseResponse = await supabase.functions.invoke('generate-sentence-mining', {
        body: {
          difficulty_level: currentSession.difficulty_level,
          language: settings.selectedLanguage,
          session_id: currentSession.id,
          user_id: user.id,
          preferred_words: [wordSelection.selectedWord],
          novelty_words: wordSelection.alternativeWords,
          avoid_patterns: avoidanceList,
          diversity_score_target: 85,
          selection_quality: wordSelection.quality,
          enhanced_mode: true,
          previous_sentences: [],
          known_words: [],
          n_plus_one: false
        }
      });

      if (exerciseResponse.error) {
        throw new Error(`Exercise generation failed: ${exerciseResponse.error.message}`);
      }

      const exercise = exerciseResponse.data;

      // Track word usage
      if (exercise.targetWord) {
        await ImprovedAutomaticWordSelection.trackWordUsage(
          user.id,
          exercise.targetWord,
          settings.selectedLanguage,
          currentSession.id,
          undefined
        );

        // Add to session tracking
        SessionWordTracker.addWordToSession(currentSession.id, exercise.targetWord);
        
        // Set cooldown for future sessions
        SessionWordTracker.setCooldown(user.id, exercise.targetWord);
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

      // Show minimal feedback
      if (wordSelection.wordType === 'review') {
        toast.success(`Review: ${wordSelection.selectedWord}`);
      } else if (wordSelection.quality >= 90) {
        toast.success(`New word: ${wordSelection.selectedWord}`);
      }

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
  }, [settings.selectedLanguage, state.currentSession, recentWords]);

  const startSession = useCallback(async (difficulty: DifficultyLevel) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create session
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

      // Load fresh recent words for this session
      await loadRecentWords();

      return newSession;
    } catch (error) {
      console.error('Error starting session:', error);
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to start session' }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [settings.selectedLanguage, loadRecentWords]);

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

      // Store exercise result
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

      // Track performance for adaptive learning
      await ImprovedAutomaticWordSelection.trackWordUsage(
        user.id,
        currentExercise.targetWord,
        settings.selectedLanguage,
        currentSession.id,
        isCorrect
      );

      const updatedSession = {
        ...currentSession,
        totalAttempts: currentSession.totalAttempts + 1,
        totalCorrect: currentSession.totalCorrect + (isCorrect ? 1 : 0)
      };

      // Update session stats
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

      // Update progress
      await loadProgress();
    } catch (error) {
      console.error('Error submitting answer:', error);
      setState(prev => ({ ...prev, loading: false, error: 'Failed to submit answer' }));
    }
  }, [loadProgress, settings.selectedLanguage]);

  const endSession = useCallback(async () => {
    const { currentSession } = state;
    if (!currentSession) return;

    try {
      // Mark session as completed
      await supabase
        .from('sentence_mining_sessions')
        .update({
          completed_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      // Clear session tracking
      SessionWordTracker.clearSession(currentSession.id);

      setState(prev => ({
        ...prev,
        currentSession: null,
        currentExercise: null,
        userResponse: '',
        showResult: false
      }));

      await loadProgress();
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
    loadProgress,
    vocabularyStats,
    recentWords
  };
};
