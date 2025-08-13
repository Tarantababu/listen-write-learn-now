
import { supabase } from '@/integrations/supabase/client';
import { DifficultyLevel, SentenceMiningExercise } from '@/types/sentence-mining';
import { ProgressiveVocabularyEngine, ProgressiveWordSelectionResult } from './progressiveVocabularyEngine';

export interface ProgressiveSentenceMiningConfig {
  adaptiveWordSelection: boolean;
  progressionVelocity: number;
  maxNewWordsPerSession: number;
  reinforcementRatio: number;
}

export class ProgressiveSentenceMiningService {
  
  static async startProgressiveSession(
    userId: string,
    language: string,
    difficulty: DifficultyLevel,
    config: Partial<ProgressiveSentenceMiningConfig> = {}
  ) {
    try {
      const finalConfig: ProgressiveSentenceMiningConfig = {
        adaptiveWordSelection: true,
        progressionVelocity: 1.0,
        maxNewWordsPerSession: 3,
        reinforcementRatio: 0.6,
        ...config
      };

      // Create progressive session record
      const { data: session, error: sessionError } = await supabase
        .from('vocabulary_progression_sessions')
        .insert({
          user_id: userId,
          language: language,
          session_type: 'progressive',
          current_complexity_level: 30,
          progression_velocity: finalConfig.progressionVelocity,
          session_data: { config: finalConfig } as any
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create corresponding sentence mining session
      const { data: miningSession, error: miningError } = await supabase
        .from('sentence_mining_sessions')
        .insert({
          user_id: userId,
          language: language,
          difficulty_level: difficulty,
          exercise_types: ['cloze'],
          session_data: { 
            progressive: true, 
            progressionSessionId: session.id,
            config: finalConfig
          } as any
        })
        .select()
        .single();

      if (miningError) throw miningError;

      console.log('Started progressive session:', { session, miningSession });

      return {
        sessionId: miningSession.id,
        progressionSessionId: session.id,
        config: finalConfig
      };
    } catch (error) {
      console.error('Error starting progressive session:', error);
      throw error;
    }
  }

  static async generateProgressiveExercise(
    userId: string,
    sessionId: string,
    language: string,
    difficulty: DifficultyLevel
  ): Promise<SentenceMiningExercise> {
    try {
      console.log('[ProgressiveSentenceMiningService] Generating progressive exercise for:', { userId, sessionId, language, difficulty });

      // Get progressive word selection
      const wordSelection = await ProgressiveVocabularyEngine.selectProgressiveWords(
        userId,
        language,
        difficulty,
        1 // One target word per exercise for better focus
      );

      console.log('[ProgressiveSentenceMiningService] Word selection:', wordSelection);

      if (wordSelection.targetWords.length === 0) {
        throw new Error('No suitable words found for progression');
      }

      // Call the enhanced AI generation service
      const response = await supabase.functions.invoke('generate-sentence-mining', {
        body: {
          targetWords: wordSelection.targetWords,
          language,
          difficulty,
          exerciseType: 'cloze',
          userId,
          sessionId,
          progressionData: {
            recommendedComplexity: wordSelection.nextComplexityLevel,
            progressionReason: wordSelection.progressionReason,
            introducedWords: wordSelection.introducedWords,
            reinforcedWords: wordSelection.reinforcedWords,
            sessionData: wordSelection.sessionData
          }
        }
      });

      if (response.error) {
        console.error('AI generation error:', response.error);
        throw new Error('Failed to generate progressive exercise');
      }

      const exerciseData = response.data;

      // Update progression session
      await this.updateProgressionSession(
        wordSelection.sessionData.progressionSessionId || sessionId,
        wordSelection.introducedWords.length,
        wordSelection.reinforcedWords.length,
        wordSelection.nextComplexityLevel
      );

      // Convert to SentenceMiningExercise format
      const exercise: SentenceMiningExercise = {
        id: exerciseData.id,
        sentence: exerciseData.sentence,
        targetWord: exerciseData.targetWord,
        clozeSentence: exerciseData.clozeSentence,
        difficulty: difficulty,
        context: exerciseData.context,
        createdAt: new Date(),
        attempts: 0,
        translation: exerciseData.translation,
        hints: exerciseData.hints || [],
        targetWordTranslation: exerciseData.targetWordTranslation,
        sessionId: sessionId,
        difficultyScore: exerciseData.difficultyScore,
        exerciseType: 'cloze',
        language: language
      };

      console.log('[ProgressiveSentenceMiningService] Generated exercise:', exercise);

      return exercise;
    } catch (error) {
      console.error('Error generating progressive exercise:', error);
      throw error;
    }
  }

  static async submitProgressiveAnswer(
    userId: string,
    exerciseId: string,
    sessionId: string,
    userAnswer: string,
    targetWord: string,
    language: string,
    isCorrect: boolean,
    responseTime?: number
  ) {
    try {
      // Update exercise record
      await supabase
        .from('sentence_mining_exercises')
        .update({
          user_response: userAnswer,
          is_correct: isCorrect,
          completed_at: new Date().toISOString()
        })
        .eq('id', exerciseId);

      // Update word progression using the progressive engine
      await ProgressiveVocabularyEngine.updateWordProgression(
        userId,
        targetWord,
        language,
        isCorrect,
        responseTime
      );

      // Update session statistics
      await this.updateSessionStats(sessionId, isCorrect);

      console.log(`[ProgressiveSentenceMiningService] Answer submitted for word: ${targetWord}, correct: ${isCorrect}`);
    } catch (error) {
      console.error('Error submitting progressive answer:', error);
      throw error;
    }
  }

  private static async updateProgressionSession(
    sessionId: string,
    wordsIntroduced: number,
    wordsReinforced: number,
    complexityLevel: number
  ) {
    try {
      await supabase
        .from('vocabulary_progression_sessions')
        .update({
          words_introduced: wordsIntroduced,
          words_reinforced: wordsReinforced,
          current_complexity_level: complexityLevel
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error updating progression session:', error);
    }
  }

  private static async updateSessionStats(sessionId: string, isCorrect: boolean) {
    try {
      const { data: session } = await supabase
        .from('sentence_mining_sessions')
        .select('total_exercises, correct_exercises')
        .eq('id', sessionId)
        .single();

      if (session) {
        await supabase
          .from('sentence_mining_sessions')
          .update({
            total_exercises: session.total_exercises + 1,
            correct_exercises: session.correct_exercises + (isCorrect ? 1 : 0)
          })
          .eq('id', sessionId);
      }
    } catch (error) {
      console.error('Error updating session stats:', error);
    }
  }

  static async getProgressionInsights(userId: string, language: string) {
    try {
      const analysis = await ProgressiveVocabularyEngine.analyzeUserProgression(userId, language);
      
      const { data: recentSessions } = await supabase
        .from('vocabulary_progression_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('language', language)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: wordProgress } = await supabase
        .from('user_word_progression')
        .select('*')
        .eq('user_id', userId)
        .eq('language', language)
        .order('last_reviewed_at', { ascending: false })
        .limit(20);

      return {
        currentLevel: analysis.currentLevel,
        masteredWords: analysis.masteredWords,
        learningWords: analysis.learningWords,
        readyForProgression: analysis.readyForProgression,
        recommendedComplexity: analysis.recommendedComplexity,
        recentSessions: recentSessions || [],
        recentWordProgress: wordProgress || [],
        progressionVelocity: this.calculateProgressionVelocity(wordProgress || [])
      };
    } catch (error) {
      console.error('Error getting progression insights:', error);
      return null;
    }
  }

  private static calculateProgressionVelocity(wordProgress: any[]): number {
    if (wordProgress.length === 0) return 1.0;
    
    const averageVelocity = wordProgress.reduce((sum, word) => 
      sum + (word.acquisition_velocity || 0), 0
    ) / wordProgress.length;
    
    return Math.max(0.5, Math.min(2.0, averageVelocity));
  }
}
