import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DifficultyLevel, SentenceMiningSession, SentenceMiningExercise, SentenceMiningProgress, SentenceMiningState } from '@/types/sentence-mining';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Sanitizes data to prevent circular references when sending to Supabase
 * Preserves critical session fields like difficulty_level
 */
const sanitizeSessionData = (data: any): any => {
  if (data === null || data === undefined) return data;
  
  // Handle primitive types - preserve them as-is
  if (typeof data !== 'object') return data;
  
  // Handle Date objects
  if (data instanceof Date) return data.toISOString();
  
  // Handle DOM elements and event objects - filter them out
  if (data.nodeType || data.target || data.currentTarget || data.preventDefault) {
    console.warn('[sanitizeSessionData] Filtering out DOM element or event object from session data');
    return null;
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeSessionData(item)).filter(item => item !== null);
  }
  
  // Handle objects - preserve critical fields
  const sanitized: any = {};
  const criticalFields = ['difficulty_level', 'language', 'user_id', 'started_at', 'session_data', 'exercise_types'];
  
  for (const [key, value] of Object.entries(data)) {
    // Skip function properties
    if (typeof value === 'function') {
      console.log(`[sanitizeSessionData] Skipping function property: ${key}`);
      continue;
    }
    
    // Skip properties that look like DOM elements or events (but not critical fields)
    if (!criticalFields.includes(key) && (key.includes('element') || key.includes('event') || key.includes('target'))) {
      console.log(`[sanitizeSessionData] Skipping DOM-like property: ${key}`);
      continue;
    }
    
    const sanitizedValue = sanitizeSessionData(value);
    if (sanitizedValue !== null || criticalFields.includes(key)) {
      sanitized[key] = sanitizedValue;
      console.log(`[sanitizeSessionData] Preserved field ${key}:`, sanitizedValue);
    }
  }
  
  return sanitized;
};

export const useSentenceMining = () => {
  const { settings } = useUserSettingsContext();
  
  const [state, setState] = useState<SentenceMiningState>({
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
    isGeneratingNext: false
  });

  // Load progress when language changes
  useEffect(() => {
    loadProgress();
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

      // Get vocabulary stats
      const { data: knownWords } = await supabase
        .from('known_words')
        .select('*')
        .eq('user_id', user.id)
        .eq('language', settings.selectedLanguage);

      // Calculate progress
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
        streak: 0, // Simplified for now
        vocabularyStats: {
          passiveVocabulary: knownWords?.length || 0,
          activeVocabulary: knownWords?.filter(w => w.mastery_level >= 3)?.length || 0,
          totalWordsEncountered: knownWords?.length || 0,
          language: settings.selectedLanguage
        }
      };

      setState(prev => ({ ...prev, progress }));
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const startSession = async (difficulty: DifficultyLevel) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in to start a session');
      return;
    }

    console.log(`[startSession] Starting adaptive session with difficulty: ${difficulty} for language: ${settings.selectedLanguage}`);
    
    // Validate difficulty parameter
    const validLevels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
    if (!validLevels.includes(difficulty)) {
      console.error(`[startSession] Invalid difficulty level provided: ${difficulty}`);
      toast.error('Invalid difficulty level');
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      
      
      const rawSessionData = {
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
          language: settings.selectedLanguage,
          exerciseTypes: ['cloze'],
          // Enhanced session metadata for adaptive features
          intelligentWordSelection: true,
          spacedRepetitionEnabled: true,
          wordCooldownEnabled: true,
          adaptiveGeneration: true
        }
      };

      
      const sessionData = sanitizeSessionData(rawSessionData);
      
      console.log('[startSession] Sanitized session data:', sessionData);
      
      // Final validation that critical fields are preserved
      if (!sessionData.difficulty_level) {
        console.error('[startSession] difficulty_level was lost during sanitization!');
        sessionData.difficulty_level = difficulty; // Force restore
      }
      
      if (!sessionData.language) {
        console.error('[startSession] language was lost during sanitization!');
        sessionData.language = settings.selectedLanguage; // Force restore
      }

      if (!sessionData.exercise_types) {
        console.error('[startSession] exercise_types was lost during sanitization!');
        sessionData.exercise_types = ['cloze']; // Force restore
      }

      console.log('[startSession] Final session data being sent to Supabase:', sessionData);

      const { data: session, error } = await supabase
        .from('sentence_mining_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) {
        console.error('[startSession] Supabase error creating session:', error);
        throw error;
      }

      console.log('[startSession] Successfully created adaptive session in database:', session);

      // Validate that the created session has the correct difficulty
      if (!session.difficulty_level) {
        console.error('[startSession] Created session has null difficulty_level!', session);
        throw new Error('Session creation failed: difficulty_level is null');
      }

      if (!session.exercise_types || session.exercise_types.length === 0) {
        console.error('[startSession] Created session has null or empty exercise_types!', session);
        throw new Error('Session creation failed: exercise_types is null or empty');
      }

      // Convert to expected format
      const newSession: SentenceMiningSession = {
        id: session.id,
        language: session.language,
        difficulty: session.difficulty_level as DifficultyLevel,
        exercises: [],
        currentExerciseIndex: 0,
        startTime: new Date(session.started_at),
        totalCorrect: 0,
        totalAttempts: 0,
        // Include database fields
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

      console.log('[startSession] Created session object:', newSession);

      setState(prev => ({
        ...prev,
        currentSession: newSession,
        currentExercise: null,
        userResponse: '',
        showResult: false,
        loading: false
      }));

      // Generate first adaptive exercise
      await generateNextExercise(newSession);
      
      toast.success(`Started adaptive ${difficulty} session in ${settings.selectedLanguage}`);
      return newSession;
    } catch (error) {
      console.error('[startSession] Error starting adaptive session:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to start adaptive session' 
      }));
      toast.error('Failed to start adaptive session');
      throw error;
    }
  };

  const generateNextExercise = async (session: SentenceMiningSession) => {
    setState(prev => ({ ...prev, isGeneratingNext: true, error: null }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get session history for intelligent generation
      const { data: previousExercises } = await supabase
        .from('sentence_mining_exercises')
        .select('sentence, target_words')
        .eq('session_id', session.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const previousSentences = previousExercises?.map(ex => ex.sentence) || [];

      // Enhanced generation with adaptive intelligence
      const { data, error } = await supabase.functions.invoke('generate-sentence-mining', {
        body: {
          language: session.language,
          difficulty: session.difficulty_level,
          sessionId: session.id,
          user_id: user.id, // Add user ID for intelligent word selection
          previous_sentences: previousSentences,
          n_plus_one: true, // Enable N+1 methodology
          // Add adaptive parameters
          enable_smart_selection: true,
          enable_spaced_repetition: true,
          enable_word_cooldown: true
        }
      });

      if (error) throw error;

      const exercise: SentenceMiningExercise = {
        id: crypto.randomUUID(),
        sentence: data.sentence,
        targetWord: data.targetWord,
        clozeSentence: data.clozeSentence,
        difficulty: session.difficulty_level as DifficultyLevel,
        context: data.context || '',
        createdAt: new Date(),
        attempts: 0,
        correctAttempts: 0,
        translation: data.translation,
        correctAnswer: data.targetWord,
        hints: data.hints,
        session_id: session.id,
        difficultyScore: data.difficultyScore,
        // Enhanced metadata from adaptive generation
        isSkipped: false
      };

      console.log(`[generateNextExercise] Generated adaptive exercise:`, {
        targetWord: data.targetWord,
        wordSelectionReason: data.wordSelectionReason,
        isReviewWord: data.isReviewWord,
        isStrugglingWord: data.isStrugglingWord,
        selectionQuality: data.selectionQuality
      });

      setState(prev => ({
        ...prev,
        currentExercise: exercise,
        userResponse: '',
        showResult: false,
        isGeneratingNext: false
      }));
    } catch (error) {
      console.error('Error generating adaptive exercise:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate adaptive exercise',
        isGeneratingNext: false
      }));
      toast.error('Failed to generate adaptive exercise');
    }
  };

  const submitAnswer = async (response: string, selectedWords: string[] = [], isSkipped: boolean = false) => {
    const { currentSession, currentExercise } = state;
    
    // Early return with proper type checking
    if (!currentSession || !currentExercise) {
      console.error('[submitAnswer] Missing session or exercise');
      return;
    }

    // At this point, TypeScript knows both currentSession and currentExercise are defined
    setState(prev => ({ ...prev, loading: true }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Now we can safely access currentExercise.correctAnswer because we've verified it exists above
      const isCorrect = !isSkipped && response.toLowerCase().trim() === currentExercise.correctAnswer.toLowerCase().trim();

      // Enhanced exercise result storage with adaptive metadata
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
          // Enhanced tracking fields
          hints_used: 0, // Could be enhanced to track hint usage
          completion_time: null, // Could be enhanced to track completion time
          completed_at: new Date().toISOString()
        }]);

      if (exerciseError) {
        console.error('Error storing exercise result:', exerciseError);
      }

      // Update spaced repetition system with performance
      try {
        // Import and use the SpacedRepetitionEngine (inline implementation for edge function compatibility)
        await this.updateWordPerformanceInline(user.id, currentExercise.targetWord, currentSession.language, isCorrect);
      } catch (srError) {
        console.error('Error updating spaced repetition:', srError);
      }

      
      const updatedSession = {
        ...currentSession,
        totalAttempts: currentSession.totalAttempts + 1,
        totalCorrect: currentSession.totalCorrect + (isCorrect ? 1 : 0)
      };

      // Update database session stats
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

      // Enhanced word tracking for adaptive learning
      if (isCorrect && !isSkipped) {
        await supabase
          .from('known_words')
          .upsert({
            user_id: user.id,
            word: currentExercise.targetWord,
            language: currentSession.language,
            correct_count: 1,
            review_count: 1,
            mastery_level: 1,
            last_reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,word,language'
          });

        console.log(`[submitAnswer] Updated word performance for: ${currentExercise.targetWord} (correct: ${isCorrect})`);
      }
    } catch (error) {
      console.error('Error submitting adaptive answer:', error);
      setState(prev => ({ ...prev, loading: false, error: 'Failed to submit answer' }));
      toast.error('Failed to submit answer');
    }
  };

  // Inline spaced repetition update for immediate use
  const updateWordPerformanceInline = async (
    userId: string,
    word: string,
    language: string,
    isCorrect: boolean
  ) => {
    try {
      // Get existing performance
      const { data: existing } = await supabase
        .from('known_words')
        .select('*')
        .eq('user_id', userId)
        .eq('word', word)
        .eq('language', language)
        .maybeSingle();

      const now = new Date();
      let newMasteryLevel = 1;
      let nextReviewDate = new Date(now);

      if (existing) {
        const newAccuracy = (existing.correct_count + (isCorrect ? 1 : 0)) / (existing.review_count + 1);
        
        // Simple spaced repetition calculation
        const baseInterval = isCorrect ? 2 : 1;
        const multiplier = Math.min(existing.mastery_level * 1.5, 7);
        const intervalDays = Math.ceil(baseInterval * multiplier);
        
        nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);
        
        // Update mastery level
        if (isCorrect && newAccuracy >= 0.8) {
          newMasteryLevel = Math.min(existing.mastery_level + 1, 10);
        } else if (!isCorrect && newAccuracy < 0.6) {
          newMasteryLevel = Math.max(existing.mastery_level - 1, 1);
        } else {
          newMasteryLevel = existing.mastery_level;
        }
      } else {
        nextReviewDate.setDate(nextReviewDate.getDate() + (isCorrect ? 2 : 1));
      }

      await supabase
        .from('known_words')
        .upsert({
          user_id: userId,
          word,
          language,
          correct_count: existing ? existing.correct_count + (isCorrect ? 1 : 0) : (isCorrect ? 1 : 0),
          review_count: existing ? existing.review_count + 1 : 1,
          mastery_level: newMasteryLevel,
          last_reviewed_at: now.toISOString(),
          next_review_date: nextReviewDate.toISOString().split('T')[0],
          updated_at: now.toISOString()
        }, {
          onConflict: 'user_id,word,language'
        });

      console.log(`Updated spaced repetition: ${word} -> mastery level ${newMasteryLevel}, next review: ${nextReviewDate.toDateString()}`);
    } catch (error) {
      console.error('Error in inline spaced repetition update:', error);
    }
  };

  
  const nextExercise = useCallback(async () => {
    const { currentSession } = state;
    if (!currentSession) return;

    setState(prev => ({
      ...prev,
      currentExercise: null,
      userResponse: '',
      showResult: false,
      showTranslation: false
    }));

    await generateNextExercise(currentSession);
  }, [state.currentSession]);

  const endSession = async () => {
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
        showResult: false
      }));

      // Reload progress
      await loadProgress();

      toast.success(`Session completed! ${currentSession.totalCorrect}/${currentSession.totalAttempts} correct`);
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session');
    }
  };

  const updateUserResponse = (response: string) => {
    setState(prev => ({ ...prev, userResponse: response }));
  };

  const toggleTranslation = () => {
    setState(prev => ({ ...prev, showTranslation: !prev.showTranslation }));
  };

  return {
    ...state,
    startSession,
    submitAnswer,
    nextExercise,
    endSession,
    updateUserResponse,
    toggleTranslation,
    loadProgress
  };
};
