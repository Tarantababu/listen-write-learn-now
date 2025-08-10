import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DifficultyLevel, SentenceMiningSession, SentenceMiningExercise, SentenceMiningProgress } from '@/types/sentence-mining';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { IntelligentWordSelection } from '@/services/intelligentWordSelection';
import { WordDiversityEngine } from '@/services/wordDiversityEngine';
import { SentencePatternDiversityEngine } from '@/services/sentencePatternDiversityEngine';
import { EnhancedCooldownSystem } from '@/services/enhancedCooldownSystem';

interface ReliableSentenceMiningState {
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
  exerciseCount: number;
}

export const useReliableSentenceMining = () => {
  const { settings } = useUserSettingsContext();
  const [state, setState] = useState<ReliableSentenceMiningState>({
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
    exerciseCount: 0,
  });

  // Load progress data
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

      const progress: SentenceMiningProgress = {
        language: settings.selectedLanguage,
        totalSessions,
        totalExercises,
        totalCorrect,
        averageAccuracy,
        streak: 0,
        vocabularyStats: {
          passiveVocabulary: 0,
          activeVocabulary: 0,
          totalWordsEncountered: 0,
          language: settings.selectedLanguage
        },
        correct: totalCorrect,
        total: totalExercises
      };

      setState(prev => ({ ...prev, progress }));
    } catch (error) {
      console.error('[ReliableSentenceMining] Error loading progress:', error);
    }
  };

  const startSession = useCallback(async (difficulty: DifficultyLevel) => {
    console.log(`[ReliableSentenceMining] Starting session with difficulty: ${difficulty}`);
    setState(prev => ({ ...prev, loading: true, error: null, exerciseCount: 0 }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create session
      const sessionData = {
        user_id: user.id,
        language: settings.selectedLanguage,
        difficulty_level: difficulty,
        exercise_types: ['cloze'],
        total_exercises: 0,
        correct_exercises: 0,
        new_words_encountered: 0,
        words_mastered: 0,
        started_at: new Date().toISOString(),
        session_data: {
          startTime: new Date().toISOString(),
          difficulty: difficulty,
          language: settings.selectedLanguage
        }
      };

      const { data: session, error } = await supabase
        .from('sentence_mining_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) throw error;

      const newSession: SentenceMiningSession = {
        id: session.id,
        language: session.language,
        difficulty: session.difficulty_level as DifficultyLevel,
        difficulty_level: session.difficulty_level as DifficultyLevel,
        exercises: [],
        currentExerciseIndex: 0,
        startTime: new Date(session.started_at),
        totalCorrect: 0,
        totalAttempts: 0,
        user_id: session.user_id,
        total_exercises: session.total_exercises,
        correct_exercises: session.correct_exercises,
        new_words_encountered: session.new_words_encountered,
        words_mastered: session.words_mastered,
        started_at: session.started_at,
        created_at: session.created_at,
        session_data: session.session_data
      };

      setState(prev => ({ ...prev, currentSession: newSession, loading: false }));

      // Generate first exercise with enhanced parameters
      await generateEnhancedExercise(newSession);
      
      toast.success(`Started ${difficulty} session for ${settings.selectedLanguage}`);
      return newSession;
    } catch (error) {
      console.error('[ReliableSentenceMining] Error starting session:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to start session' 
      }));
      toast.error('Failed to start session');
      throw error;
    }
  }, [settings.selectedLanguage]);

  const generateEnhancedExercise = async (session: SentenceMiningSession) => {
    console.log(`[ReliableSentenceMining] Generating enhanced exercise for session: ${session.id}`);
    setState(prev => ({ ...prev, isGeneratingNext: true, error: null }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get intelligent word selection with enhanced diversity
      const wordSelection = await IntelligentWordSelection.selectOptimalWords(
        user.id,
        session.language,
        session.difficulty_level as DifficultyLevel,
        session.id,
        1, // Select 1 word
        {
          maxRecentUsage: 1,
          minCooldownHours: 12,
          preferredDifficulty: 50,
          diversityWeight: 0.6,
          noveltyWeight: 0.4
        }
      );

      // Get word diversity metrics
      const diversityMetrics = await WordDiversityEngine.analyzeSessionDiversity(
        user.id,
        session.language,
        session.id,
        48
      );

      // Get pattern avoidance recommendations
      const avoidPatterns = await SentencePatternDiversityEngine.getAvoidancePatterns(
        user.id,
        session.language,
        session.difficulty_level as DifficultyLevel,
        session.id,
        24
      );

      // Apply enhanced cooldown filtering
      const { available: availableWords } = await EnhancedCooldownSystem.getAvailableWords(
        user.id,
        session.language,
        wordSelection.selectedWords,
        session.id
      );

      // Determine final word selection
      let finalSelectedWords = wordSelection.selectedWords;
      let selectionMethod = 'intelligent_selection';
      
      if (availableWords.length === 0) {
        console.log(`[ReliableSentenceMining] All words on cooldown, using emergency selection`);
        
        // Emergency: find any unused words from the last 24 hours
        const { data: unusedWords } = await supabase
          .from('known_words')
          .select('word')
          .eq('user_id', user.id)
          .eq('language', session.language)
          .order('last_reviewed_at', { ascending: true, nullsFirst: true })
          .limit(10);

        if (unusedWords && unusedWords.length > 0) {
          finalSelectedWords = [unusedWords[Math.floor(Math.random() * unusedWords.length)].word];
          selectionMethod = 'emergency_unused_words';
        } else {
          // Ultimate fallback
          finalSelectedWords = ['cat']; // Safe fallback word
          selectionMethod = 'ultimate_fallback';
        }
      } else {
        finalSelectedWords = availableWords.slice(0, 1);
        selectionMethod = 'cooldown_filtered_selection';
      }

      // Get previous sentences to avoid repetition
      const { data: previousExercises } = await supabase
        .from('sentence_mining_exercises')
        .select('sentence')
        .eq('session_id', session.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Call the edge function with enhanced parameters
      const exerciseResponse = await supabase.functions.invoke('generate-sentence-mining', {
        body: {
          difficulty_level: session.difficulty_level,
          language: session.language,
          session_id: session.id,
          user_id: user.id,
          preferred_words: finalSelectedWords,
          novelty_words: [],
          avoid_patterns: avoidPatterns,
          diversity_score_target: Math.max(80, diversityMetrics.overallScore),
          selection_quality: Math.round(wordSelection.diversityScore),
          enhanced_mode: true,
          previous_sentences: previousExercises?.map(e => e.sentence) || [],
          known_words: [],
          n_plus_one: false
        }
      });

      if (exerciseResponse.error) {
        throw new Error(`Exercise generation failed: ${exerciseResponse.error.message}`);
      }

      const exerciseData = exerciseResponse.data;
      
      if (!exerciseData || !exerciseData.sentence) {
        throw new Error('Invalid exercise data received from server');
      }

      // Track word usage for future diversity
      if (exerciseData.targetWord) {
        await EnhancedCooldownSystem.trackWordUsage(
          user.id,
          exerciseData.targetWord,
          session.language,
          session.id,
          exerciseData.sentence || '',
          this.extractSentencePattern(exerciseData.sentence || ''),
          session.difficulty_level as DifficultyLevel
        );
      }

      // Create exercise record in database
      const { data: exerciseRecord, error: insertError } = await supabase
        .from('sentence_mining_exercises')
        .insert({
          session_id: session.id,
          sentence: exerciseData.sentence,
          target_words: [exerciseData.targetWord],
          translation: exerciseData.translation,
          exercise_type: 'cloze',
          difficulty_score: 50,
          unknown_words: [],
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('[ReliableSentenceMining] Error saving exercise:', insertError);
      }

      // Create the exercise object
      const newExercise: SentenceMiningExercise = {
        id: exerciseRecord?.id || `temp-${Date.now()}`,
        sentence: exerciseData.sentence,
        targetWord: exerciseData.targetWord,
        targetWordTranslation: exerciseData.targetWordTranslation,
        clozeSentence: exerciseData.clozeSentence,
        translation: exerciseData.translation,
        difficulty: session.difficulty_level as DifficultyLevel,
        context: exerciseData.context || '',
        hints: exerciseData.hints || [],
        isCorrect: null,
        userAnswer: '',
        attempts: 0,
        sessionId: session.id,
        createdAt: new Date(),
        exerciseType: 'cloze',
        correctAnswer: exerciseData.targetWord
      };

      setState(prev => ({
        ...prev,
        currentExercise: newExercise,
        isGeneratingNext: false,
        exerciseCount: prev.exerciseCount + 1
      }));

      console.log(`[ReliableSentenceMining] Successfully generated exercise: ${exerciseData.targetWord} using ${selectionMethod}`);
    } catch (error) {
      console.error('[ReliableSentenceMining] Error generating exercise:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate exercise',
        isGeneratingNext: false
      }));
      
      // Clean up failed session
      if (session.id) {
        try {
          await supabase
            .from('sentence_mining_sessions')
            .delete()
            .eq('id', session.id);
          setState(prev => ({ ...prev, currentSession: null }));
        } catch (cleanupError) {
          console.error('[ReliableSentenceMining] Error cleaning up failed session:', cleanupError);
        }
      }
      
      toast.error('Failed to generate exercise. Please try again.');
    }
  };

  const nextExercise = useCallback(async () => {
    if (!state.currentSession) return;

    console.log(`[ReliableSentenceMining] Generating next exercise`);
    await generateEnhancedExercise(state.currentSession);
  }, [state.currentSession]);

  const submitAnswer = useCallback(async (response: string, selectedWords: string[] = [], isSkipped: boolean = false) => {
    const currentSession = state.currentSession;
    const currentExercise = state.currentExercise;
    
    if (!currentSession || !currentExercise) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const correctAnswer = currentExercise.correctAnswer || currentExercise.targetWord;
      const isCorrect = !isSkipped && response.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

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
        console.error('[ReliableSentenceMining] Error storing exercise:', exerciseError);
      }

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

      if (isCorrect) {
        toast.success('Correct!');
      } else if (isSkipped) {
        toast.info('Exercise skipped');
      } else {
        toast.error(`Incorrect. The correct answer was "${correctAnswer}"`);
      }
    } catch (error) {
      console.error('[ReliableSentenceMining] Error submitting answer:', error);
      setState(prev => ({ ...prev, loading: false, error: 'Failed to submit answer' }));
      toast.error('Failed to submit answer');
    }
  }, [state.currentSession, state.currentExercise, loadProgress]);

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

      setState(prev => ({
        ...prev,
        currentSession: null,
        currentExercise: null,
        userResponse: '',
        showResult: false,
        exerciseCount: 0
      }));

      await loadProgress();
      
      toast.success(
        `Session completed! ${currentSession.totalCorrect}/${currentSession.totalAttempts} correct`,
        { duration: 4000 }
      );
    } catch (error) {
      console.error('[ReliableSentenceMining] Error ending session:', error);
      toast.error('Failed to end session properly');
    }
  }, [state.currentSession, loadProgress]);

  const updateUserResponse = (response: string) => {
    setState(prev => ({ ...prev, userResponse: response }));
  };

  const toggleTranslation = () => {
    setState(prev => ({ ...prev, showTranslation: !prev.showTranslation }));
  };

  const toggleHint = () => {
    setState(prev => ({ ...prev, showHint: !prev.showHint }));
  };

  // Helper method for pattern extraction
  const extractSentencePattern = (sentence: string): string => {
    if (!sentence) return 'unknown';
    
    const length = sentence.split(' ').length;
    let pattern = '';
    
    if (length <= 6) pattern += 'short_';
    else if (length <= 12) pattern += 'medium_';
    else pattern += 'long_';
    
    if (sentence.includes('?')) pattern += 'question_';
    if (sentence.includes(',')) pattern += 'complex_';
    
    return pattern || 'simple';
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
