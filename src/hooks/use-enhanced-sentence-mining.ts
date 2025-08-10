
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DifficultyLevel, SentenceMiningSession, SentenceMiningExercise, SentenceMiningProgress } from '@/types/sentence-mining';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';

// Import the new enhanced services
import { AdvancedWordSelectionEngine } from '@/services/advancedWordSelectionEngine';
import { SentencePatternDiversityEngine } from '@/services/sentencePatternDiversityEngine';
import { EnhancedCooldownSystem } from '@/services/enhancedCooldownSystem';
import { AdaptiveNoveltyInjector, UserNoveltyProfile } from '@/services/adaptiveNoveltyInjector';
import { QualityAssuranceEngine, SessionQualityReport } from '@/services/qualityAssuranceEngine';

interface EnhancedSentenceMiningState {
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
  
  // Enhanced features
  qualityReport: SessionQualityReport | null;
  noveltyProfile: UserNoveltyProfile | null;
  exerciseCount: number;
  qualityAlerts: any[];
  diversityMetrics: any;
  selectionQuality: number;
}

export const useEnhancedSentenceMining = () => {
  const { settings } = useUserSettingsContext();
  
  const [state, setState] = useState<EnhancedSentenceMiningState>({
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
    qualityReport: null,
    noveltyProfile: null,
    exerciseCount: 0,
    qualityAlerts: [],
    diversityMetrics: null,
    selectionQuality: 80
  });

  // Load progress and initialize enhanced features
  useEffect(() => {
    loadProgress();
    loadNoveltyProfile();
  }, [settings.selectedLanguage]);

  // Monitor real-time quality during active session
  useEffect(() => {
    if (state.currentSession && state.exerciseCount > 0) {
      monitorSessionQuality();
    }
  }, [state.currentSession, state.exerciseCount]);

  const loadProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // ... keep existing code (basic progress loading) the same ...
      
      // Get sessions for the selected language
      const { data: sessions } = await supabase
        .from('sentence_mining_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('language', settings.selectedLanguage)
        .order('created_at', { ascending: false });

      // Calculate enhanced progress with quality metrics
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
        streak: 0, // Could be enhanced
        vocabularyStats: {
          passiveVocabulary: 0, // Will be calculated
          activeVocabulary: 0,
          totalWordsEncountered: 0,
          language: settings.selectedLanguage
        }
      };

      setState(prev => ({ ...prev, progress }));
    } catch (error) {
      console.error('[EnhancedSentenceMining] Error loading progress:', error);
    }
  };

  const loadNoveltyProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const noveltyProfile = await AdaptiveNoveltyInjector.generateUserNoveltyProfile(
        user.id,
        settings.selectedLanguage
      );
      setState(prev => ({ ...prev, noveltyProfile }));
    } catch (error) {
      console.error('[EnhancedSentenceMining] Error loading novelty profile:', error);
    }
  };

  const startEnhancedSession = async (difficulty: DifficultyLevel) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in to start a session');
      return;
    }

    console.log(`[EnhancedSentenceMining] Starting enhanced session with difficulty: ${difficulty}`);
    
    setState(prev => ({ ...prev, loading: true, error: null, exerciseCount: 0 }));

    try {
      // Create enhanced session data
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
          language: settings.selectedLanguage,
          enhancedFeatures: {
            advancedWordSelection: true,
            patternDiversity: true,
            enhancedCooldown: true,
            adaptiveNovelty: true,
            qualityAssurance: true
          }
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
        exercises: [],
        currentExerciseIndex: 0,
        startTime: new Date(session.started_at),
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

      setState(prev => ({
        ...prev,
        currentSession: newSession,
        currentExercise: null,
        userResponse: '',
        showResult: false,
        loading: false,
        qualityAlerts: []
      }));

      // Generate first enhanced exercise
      await generateEnhancedExercise(newSession);
      
      toast.success(`Started enhanced ${difficulty} session with AI-powered features`);
      return newSession;
    } catch (error) {
      console.error('[EnhancedSentenceMining] Error starting enhanced session:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to start enhanced session' 
      }));
      toast.error('Failed to start enhanced session');
    }
  };

  const generateEnhancedExercise = async (session: SentenceMiningSession) => {
    setState(prev => ({ ...prev, isGeneratingNext: true, error: null }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log(`[EnhancedSentenceMining] Generating enhanced exercise for session ${session.id}`);

      // Step 1: Analyze current diversity patterns
      const diversityMetrics = await SentencePatternDiversityEngine.analyzePatternDiversity(
        user.id,
        session.language,
        session.id
      );

      // Step 2: Get patterns to avoid
      const avoidPatterns = await SentencePatternDiversityEngine.getAvoidancePatterns(
        user.id,
        session.language,
        session.difficulty_level,
        session.id
      );

      // Step 3: Smart word selection with advanced algorithm
      const wordSelection = await AdvancedWordSelectionEngine.selectOptimalWords({
        language: session.language,
        difficultyLevel: session.difficulty_level,
        userId: user.id,
        sessionId: session.id,
        targetCount: 1
      });

      // Step 4: Check for novelty injection opportunity
      const noveltyDecision = state.noveltyProfile 
        ? await AdaptiveNoveltyInjector.shouldInjectNovelty(
            state.noveltyProfile,
            state.exerciseCount / 10, // Session progress approximation
            state.exerciseCount
          )
        : { shouldInject: false, reason: 'No profile', confidence: 0 };

      // Step 5: Get novelty candidates if appropriate
      let noveltyWords: string[] = [];
      if (noveltyDecision.shouldInject && state.noveltyProfile) {
        const noveltyCandidates = await AdaptiveNoveltyInjector.selectNoveltyWords(
          state.noveltyProfile,
          session.difficulty_level,
          [], // contextHints
          wordSelection.selectedWords,
          1
        );
        noveltyWords = noveltyCandidates.map(c => c.word);
      }

      // Step 6: Get session history for context
      const { data: previousExercises } = await supabase
        .from('sentence_mining_exercises')
        .select('sentence, target_words')
        .eq('session_id', session.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const previousSentences = previousExercises?.map(ex => ex.sentence) || [];

      // Step 7: Enhanced generation call
      const { data, error } = await supabase.functions.invoke('generate-sentence-mining', {
        body: {
          language: session.language,
          difficulty: session.difficulty_level,
          sessionId: session.id,
          user_id: user.id,
          previous_sentences: previousSentences,
          n_plus_one: true,
          // Enhanced parameters
          preferred_words: wordSelection.selectedWords,
          novelty_words: noveltyWords,
          avoid_patterns: avoidPatterns,
          diversity_score_target: Math.max(70, diversityMetrics.patternDistribution),
          selection_quality: wordSelection.selectionQuality,
          enhanced_mode: true
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
        isSkipped: false
      };

      // Track word usage for enhanced cooldown
      if (data.targetWord) {
        await EnhancedCooldownSystem.trackWordUsage(
          user.id,
          data.targetWord,
          session.language,
          session.id,
          data.sentence,
          SentencePatternDiversityEngine.extractSentenceStructure(data.sentence, session.language)
        );
      }

      setState(prev => ({
        ...prev,
        currentExercise: exercise,
        userResponse: '',
        showResult: false,
        isGeneratingNext: false,
        diversityMetrics,
        selectionQuality: wordSelection.selectionQuality,
        exerciseCount: prev.exerciseCount + 1
      }));

      console.log(`[EnhancedSentenceMining] Generated enhanced exercise with quality score: ${wordSelection.selectionQuality}`);
    } catch (error) {
      console.error('[EnhancedSentenceMining] Error generating enhanced exercise:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate enhanced exercise',
        isGeneratingNext: false
      }));
      toast.error('Failed to generate enhanced exercise');
    }
  };

  const monitorSessionQuality = async () => {
    if (!state.currentSession) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get real-time quality alerts
      const alerts = await QualityAssuranceEngine.monitorRealtimeQuality(
        state.currentSession.id,
        user.id,
        settings.selectedLanguage
      );

      if (alerts.length > 0) {
        setState(prev => ({ ...prev, qualityAlerts: alerts }));
        
        // Show user-friendly notifications for high-severity alerts
        alerts.forEach(alert => {
          if (alert.severity === 'high') {
            toast.warning(`Quality Alert: ${alert.message}`, {
              duration: 5000
            });
          }
        });
      }
    } catch (error) {
      console.error('[EnhancedSentenceMining] Error monitoring quality:', error);
    }
  };

  const submitEnhancedAnswer = async (response: string, selectedWords: string[] = [], isSkipped: boolean = false) => {
    const currentSession = state.currentSession;
    const currentExercise = state.currentExercise;
    
    if (!currentSession || !currentExercise) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const correctAnswer = currentExercise.correctAnswer;
      const isCorrect = !isSkipped && response.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

      // Store enhanced exercise result
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
          completion_time: null,
          completed_at: new Date().toISOString()
        }]);

      if (exerciseError) {
        console.error('[EnhancedSentenceMining] Error storing exercise result:', exerciseError);
      }

      // Track novelty word introduction if applicable
      if (isCorrect && !isSkipped && state.noveltyProfile) {
        await AdaptiveNoveltyInjector.trackNoveltyIntroduction(
          user.id,
          settings.selectedLanguage,
          currentExercise.targetWord,
          currentSession.id,
          currentExercise.sentence
        );
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

    } catch (error) {
      console.error('[EnhancedSentenceMining] Error submitting enhanced answer:', error);
      setState(prev => ({ ...prev, loading: false, error: 'Failed to submit answer' }));
      toast.error('Failed to submit answer');
    }
  };

  const nextEnhancedExercise = useCallback(async () => {
    const { currentSession } = state;
    if (!currentSession) return;

    setState(prev => ({
      ...prev,
      currentExercise: null,
      userResponse: '',
      showResult: false,
      showTranslation: false
    }));

    await generateEnhancedExercise(currentSession);
  }, [state.currentSession]);

  const endEnhancedSession = async () => {
    const { currentSession } = state;
    if (!currentSession) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Generate final quality report
      const qualityReport = await QualityAssuranceEngine.generateSessionQualityReport(
        currentSession.id,
        user.id,
        settings.selectedLanguage
      );

      // Clear session cache
      EnhancedCooldownSystem.clearSessionCache(currentSession.id);

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
        qualityReport,
        exerciseCount: 0,
        qualityAlerts: []
      }));

      // Reload progress
      await loadProgress();

      // Show quality summary
      toast.success(
        `Session completed! ${currentSession.totalCorrect}/${currentSession.totalAttempts} correct. Quality: ${qualityReport.overallGrade}`,
        { duration: 5000 }
      );
    } catch (error) {
      console.error('[EnhancedSentenceMining] Error ending enhanced session:', error);
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
    startSession: startEnhancedSession,
    submitAnswer: submitEnhancedAnswer,
    nextExercise: nextEnhancedExercise,
    endSession: endEnhancedSession,
    updateUserResponse,
    toggleTranslation,
    loadProgress,
    // Enhanced methods
    monitorSessionQuality,
    loadNoveltyProfile
  };
};
