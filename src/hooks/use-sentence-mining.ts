
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DifficultyLevel, SentenceMiningSession, SentenceMiningExercise, SentenceMiningProgress, SentenceMiningState } from '@/types/sentence-mining';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Sanitizes data to prevent circular references when sending to Supabase
 */
const sanitizeSessionData = (data: any): any => {
  if (data === null || data === undefined) return data;
  
  // Handle primitive types
  if (typeof data !== 'object') return data;
  
  // Handle Date objects
  if (data instanceof Date) return data.toISOString();
  
  // Handle DOM elements and event objects
  if (data.nodeType || data.target || data.currentTarget || data.preventDefault) {
    console.warn('Filtering out DOM element or event object from session data');
    return null;
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeSessionData(item)).filter(item => item !== null);
  }
  
  // Handle objects
  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    // Skip function properties
    if (typeof value === 'function') continue;
    
    // Skip properties that look like DOM elements or events
    if (key.includes('element') || key.includes('event') || key.includes('target')) continue;
    
    const sanitizedValue = sanitizeSessionData(value);
    if (sanitizedValue !== null) {
      sanitized[key] = sanitizedValue;
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

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Sanitize the session data before creating
      const sessionData = sanitizeSessionData({
        user_id: user.id,
        language: settings.selectedLanguage,
        difficulty_level: difficulty,
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
      });

      console.log('Creating session with sanitized data:', sessionData);

      const { data: session, error } = await supabase
        .from('sentence_mining_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        throw error;
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

      setState(prev => ({
        ...prev,
        currentSession: newSession,
        currentExercise: null,
        userResponse: '',
        showResult: false,
        loading: false
      }));

      // Generate first exercise
      await generateNextExercise(newSession);
      
      toast.success(`Started ${difficulty} session in ${settings.selectedLanguage}`);
    } catch (error) {
      console.error('Error starting session:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to start session' 
      }));
      toast.error('Failed to start session');
    }
  };

  const generateNextExercise = async (session: SentenceMiningSession) => {
    setState(prev => ({ ...prev, isGeneratingNext: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('generate-sentence-mining', {
        body: {
          language: session.language,
          difficulty: session.difficulty_level,
          sessionId: session.id
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
        difficultyScore: data.difficultyScore
      };

      setState(prev => ({
        ...prev,
        currentExercise: exercise,
        userResponse: '',
        showResult: false,
        isGeneratingNext: false
      }));
    } catch (error) {
      console.error('Error generating exercise:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate exercise',
        isGeneratingNext: false
      }));
      toast.error('Failed to generate exercise');
    }
  };

  const submitAnswer = async (response: string, selectedWords: string[] = [], isSkipped: boolean = false) => {
    const { currentSession, currentExercise } = state;
    if (!currentSession || !currentExercise) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      const isCorrect = !isSkipped && response.toLowerCase().trim() === currentExercise.correctAnswer.toLowerCase().trim();

      // Store exercise result in database - match the exact schema
      const { error: exerciseError } = await supabase
        .from('sentence_mining_exercises')
        .insert([{
          session_id: currentSession.id,
          sentence: currentExercise.sentence,
          target_words: [currentExercise.targetWord], // Convert single target word to array
          user_response: response,
          is_correct: isCorrect,
          difficulty_score: currentExercise.difficultyScore || 1,
          exercise_type: 'cloze',
          translation: currentExercise.translation,
          unknown_words: isSkipped ? [currentExercise.targetWord] : [] // Track unknown words if skipped
        }]);

      if (exerciseError) {
        console.error('Error storing exercise result:', exerciseError);
      }

      // Update session stats
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

      // Track word performance if correct
      if (isCorrect && !isSkipped) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('known_words')
            .upsert({
              user_id: user.id,
              word: currentExercise.targetWord,
              language: currentSession.language,
              correct_count: 1,
              review_count: 1,
              mastery_level: 1
            }, {
              onConflict: 'user_id,word,language'
            });
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setState(prev => ({ ...prev, loading: false, error: 'Failed to submit answer' }));
      toast.error('Failed to submit answer');
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
