import { supabase } from '@/integrations/supabase/client';
import { DifficultyLevel, SentenceMiningProgress } from '@/types/sentence-mining';
import { AdaptiveDifficultyEngine, DifficultyAnalysis, PerformanceMetrics } from './adaptiveDifficultyEngine';

export interface SmartSessionConfig {
  suggestedDifficulty: DifficultyLevel;
  confidence: number;
  reasoning: string[];
  fallbackDifficulty: DifficultyLevel;
}

export class EnhancedAdaptiveDifficultyEngine extends AdaptiveDifficultyEngine {
  private static readonly NEW_USER_THRESHOLD = 5;
  private static readonly CONFIDENCE_THRESHOLD = 0.7;

  /**
   * Ensures difficulty value is properly typed as DifficultyLevel string
   */
  private static sanitizeDifficultyLevel(level: any): DifficultyLevel {
    const validLevels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
    
    // Handle object or complex types - extract string value
    if (typeof level === 'object' && level !== null) {
      // If it's an object with a difficulty property
      if (level.difficulty) return this.sanitizeDifficultyLevel(level.difficulty);
      if (level.value) return this.sanitizeDifficultyLevel(level.value);
      if (level.level) return this.sanitizeDifficultyLevel(level.level);
      // If it's an object, try to convert to string
      level = String(level);
    }

    // Ensure it's a string and lowercase
    const cleanLevel = String(level).toLowerCase().trim();
    
    // Validate against allowed values
    if (validLevels.includes(cleanLevel as DifficultyLevel)) {
      return cleanLevel as DifficultyLevel;
    }
    
    // Default fallback
    console.warn(`Invalid difficulty level: ${level}, falling back to intermediate`);
    return 'intermediate';
  }

  /**
   * Determines the optimal starting difficulty for a new session
   */
  static async determineOptimalStartingDifficulty(
    userId: string, 
    language: string
  ): Promise<SmartSessionConfig> {
    try {
      const performanceData = await this.getUserPerformanceHistory(userId, language);
      const isNewUser = performanceData.totalSessions < this.NEW_USER_THRESHOLD;

      if (isNewUser) {
        return this.getNewUserConfiguration(performanceData);
      }

      return await this.getExperiencedUserConfiguration(userId, language, performanceData);
    } catch (error) {
      console.error('Error determining optimal difficulty:', error);
      return {
        suggestedDifficulty: 'intermediate',
        confidence: 0.5,
        reasoning: ['Using default difficulty - analysis temporarily unavailable'],
        fallbackDifficulty: 'intermediate'
      };
    }
  }

  private static async getUserPerformanceHistory(userId: string, language: string) {
    try {
      const { data: sessions, error } = await supabase
        .from('sentence_mining_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('language', language)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching sessions:', error);
        throw error;
      }

      const totalSessions = sessions?.length || 0;
      const recentSessions = sessions?.slice(0, 5) || [];
      
      let totalAccuracy = 0;
      let weightedAccuracy = 0;
      let totalWeight = 0;

      recentSessions.forEach((session, index) => {
        const accuracy = session.total_exercises > 0 
          ? (session.correct_exercises / session.total_exercises) * 100 
          : 0;
        
        const weight = Math.pow(0.8, index);
        weightedAccuracy += accuracy * weight;
        totalWeight += weight;
        totalAccuracy += accuracy;
      });

      const averageAccuracy = recentSessions.length > 0 ? totalAccuracy / recentSessions.length : 0;
      const recentWeightedAccuracy = totalWeight > 0 ? weightedAccuracy / totalWeight : 0;

      // Ensure lastSessionDifficulty is properly sanitized
      const rawLastDifficulty = sessions?.[0]?.difficulty_level;
      const lastSessionDifficulty = this.sanitizeDifficultyLevel(rawLastDifficulty);

      return {
        totalSessions,
        recentSessions: recentSessions.length,
        averageAccuracy,
        recentWeightedAccuracy,
        lastSessionDifficulty,
        sessions: recentSessions
      };
    } catch (error) {
      console.error('Error in getUserPerformanceHistory:', error);
      return {
        totalSessions: 0,
        recentSessions: 0,
        averageAccuracy: 0,
        recentWeightedAccuracy: 0,
        lastSessionDifficulty: 'intermediate' as DifficultyLevel,
        sessions: []
      };
    }
  }

  private static getNewUserConfiguration(performanceData: any): SmartSessionConfig {
    return {
      suggestedDifficulty: 'beginner',
      confidence: 0.8,
      reasoning: [
        'New user detected - starting with beginner level',
        'System will adapt quickly based on initial performance'
      ],
      fallbackDifficulty: 'beginner'
    };
  }

  private static async getExperiencedUserConfiguration(
    userId: string, 
    language: string, 
    performanceData: any
  ): Promise<SmartSessionConfig> {
    const reasoning: string[] = [];
    let suggestedDifficulty: DifficultyLevel = 'intermediate';
    let confidence = 0.5;

    try {
      if (performanceData.recentWeightedAccuracy >= 85) {
        const nextLevel = performanceData.lastSessionDifficulty === 'advanced' 
          ? 'advanced' 
          : this.getNextDifficultyLevel(performanceData.lastSessionDifficulty);
        
        // Ensure the next level is properly sanitized
        suggestedDifficulty = this.sanitizeDifficultyLevel(nextLevel);
        confidence = 0.8;
        reasoning.push(`High recent accuracy (${Math.round(performanceData.recentWeightedAccuracy)}%) suggests readiness for ${suggestedDifficulty}`);
      } else if (performanceData.recentWeightedAccuracy <= 60) {
        const prevLevel = this.getPreviousDifficultyLevel(performanceData.lastSessionDifficulty);
        suggestedDifficulty = this.sanitizeDifficultyLevel(prevLevel);
        confidence = 0.7;
        reasoning.push(`Lower recent accuracy (${Math.round(performanceData.recentWeightedAccuracy)}%) suggests ${suggestedDifficulty} level`);
      } else {
        suggestedDifficulty = this.sanitizeDifficultyLevel(performanceData.lastSessionDifficulty || 'intermediate');
        confidence = 0.6;
        reasoning.push(`Moderate performance suggests maintaining ${suggestedDifficulty} level`);
      }

      try {
        const vocabularyInsights = await this.getVocabularyInsights(userId, language);
        if (vocabularyInsights.strugglingWordsCount > 10) {
          const easierLevel = this.getPreviousDifficultyLevel(suggestedDifficulty);
          suggestedDifficulty = this.sanitizeDifficultyLevel(easierLevel);
          confidence += 0.1;
          reasoning.push(`High number of struggling words (${vocabularyInsights.strugglingWordsCount}) suggests focusing on ${suggestedDifficulty}`);
        }
      } catch (vocabError) {
        console.error('Error getting vocabulary insights:', vocabError);
      }

      return {
        suggestedDifficulty,
        confidence: Math.min(confidence, 1.0),
        reasoning,
        fallbackDifficulty: 'intermediate'
      };
    } catch (error) {
      console.error('Error in getExperiencedUserConfiguration:', error);
      return {
        suggestedDifficulty: 'intermediate',
        confidence: 0.5,
        reasoning: ['Using intermediate difficulty as fallback'],
        fallbackDifficulty: 'intermediate'
      };
    }
  }

  private static async getVocabularyInsights(userId: string, language: string) {
    try {
      const { data: knownWords, error } = await supabase
        .from('known_words')
        .select('mastery_level, review_count, correct_count')
        .eq('user_id', userId)
        .eq('language', language);

      if (error) {
        console.error('Error fetching known words:', error);
        throw error;
      }

      let strugglingWordsCount = 0;
      let masteredWordsCount = 0;

      knownWords?.forEach(word => {
        const accuracy = word.review_count > 0 ? (word.correct_count / word.review_count) : 0;
        if (word.review_count >= 3 && accuracy < 0.6) {
          strugglingWordsCount++;
        }
        if (word.correct_count >= 5 && accuracy >= 0.8) {
          masteredWordsCount++;
        }
      });

      return {
        strugglingWordsCount,
        masteredWordsCount,
        totalWords: knownWords?.length || 0
      };
    } catch (error) {
      console.error('Error in getVocabularyInsights:', error);
      return {
        strugglingWordsCount: 0,
        masteredWordsCount: 0,
        totalWords: 0
      };
    }
  }

  /**
   * Continuously monitors session performance for mid-session difficulty adjustment
   */
  static async evaluateMidSessionAdjustment(
    sessionId: string,
    userId: string,
    language: string,
    currentDifficulty: DifficultyLevel
  ): Promise<DifficultyAnalysis | null> {
    try {
      const { data: exercises, error } = await supabase
        .from('sentence_mining_exercises')
        .select('is_correct, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching exercises for mid-session adjustment:', error);
        return null;
      }

      if (!exercises || exercises.length < 3) {
        return null;
      }

      const recentExercises = exercises.slice(0, 5);
      const correctCount = recentExercises.filter(e => e.is_correct === true).length;
      const sessionAccuracy = (correctCount / recentExercises.length) * 100;

      // Ensure current difficulty is properly sanitized
      const sanitizedCurrentDifficulty = this.sanitizeDifficultyLevel(currentDifficulty);

      const analysis: DifficultyAnalysis = {
        currentLevel: sanitizedCurrentDifficulty,
        suggestedLevel: sanitizedCurrentDifficulty,
        shouldAdjust: false,
        confidence: 0,
        reasons: []
      };

      if (sessionAccuracy >= 90 && recentExercises.length >= 4) {
        const nextLevel = this.getNextDifficultyLevel(sanitizedCurrentDifficulty);
        const sanitizedNextLevel = this.sanitizeDifficultyLevel(nextLevel);
        
        if (sanitizedNextLevel !== sanitizedCurrentDifficulty) {
          analysis.suggestedLevel = sanitizedNextLevel;
          analysis.shouldAdjust = true;
          analysis.confidence = 0.7;
          analysis.reasons.push(`Perfect performance (${sessionAccuracy}%) in current session suggests ${sanitizedNextLevel} difficulty`);
        }
      }

      if (sessionAccuracy <= 40 && recentExercises.length >= 4) {
        const prevLevel = this.getPreviousDifficultyLevel(sanitizedCurrentDifficulty);
        const sanitizedPrevLevel = this.sanitizeDifficultyLevel(prevLevel);
        
        if (sanitizedPrevLevel !== sanitizedCurrentDifficulty) {
          analysis.suggestedLevel = sanitizedPrevLevel;
          analysis.shouldAdjust = true;
          analysis.confidence = 0.8;
          analysis.reasons.push(`Low performance (${sessionAccuracy}%) in current session suggests ${sanitizedPrevLevel} difficulty`);
        }
      }

      return analysis.shouldAdjust ? analysis : null;
    } catch (error) {
      console.error('Error in evaluateMidSessionAdjustment:', error);
      return null;
    }
  }
}
