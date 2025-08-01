
import { supabase } from '@/integrations/supabase/client';

export interface WordPerformance {
  word: string;
  language: string;
  userId: string;
  totalReviews: number;
  correctReviews: number;
  accuracy: number;
  lastReviewDate: Date;
  nextReviewDate: Date;
  repetitionLevel: number;
  difficultyMultiplier: number;
  isStruggling: boolean;
  masteryScore: number;
}

export interface SpacedRepetitionConfig {
  initialInterval: number; // days
  easyMultiplier: number;
  hardMultiplier: number;
  maxInterval: number; // days
  minAccuracyForPromotion: number;
  strugglingThreshold: number;
}

export class SpacedRepetitionEngine {
  private static readonly DEFAULT_CONFIG: SpacedRepetitionConfig = {
    initialInterval: 1,
    easyMultiplier: 2.5,
    hardMultiplier: 1.3,
    maxInterval: 365,
    minAccuracyForPromotion: 0.8,
    strugglingThreshold: 0.6
  };

  static async getWordPerformance(
    userId: string,
    word: string,
    language: string
  ): Promise<WordPerformance | null> {
    try {
      const { data, error } = await supabase
        .from('known_words')
        .select('*')
        .eq('user_id', userId)
        .eq('word', word)
        .eq('language', language)
        .maybeSingle();

      if (error) {
        console.error('Error fetching word performance:', error);
        return null;
      }

      if (!data) return null;

      const accuracy = data.review_count > 0 ? data.correct_count / data.review_count : 0;
      const masteryScore = this.calculateMasteryScore(data.correct_count, data.review_count, data.mastery_level);

      return {
        word: data.word,
        language: data.language,
        userId: data.user_id,
        totalReviews: data.review_count,
        correctReviews: data.correct_count,
        accuracy,
        lastReviewDate: new Date(data.last_reviewed_at),
        nextReviewDate: data.next_review_date ? new Date(data.next_review_date) : new Date(),
        repetitionLevel: data.mastery_level,
        difficultyMultiplier: 1.0,
        isStruggling: accuracy < this.DEFAULT_CONFIG.strugglingThreshold && data.review_count >= 3,
        masteryScore
      };
    } catch (error) {
      console.error('Error in getWordPerformance:', error);
      return null;
    }
  }

  static async updateWordPerformance(
    userId: string,
    word: string,
    language: string,
    isCorrect: boolean
  ): Promise<void> {
    try {
      const existing = await this.getWordPerformance(userId, word, language);
      const now = new Date();
      
      let newMasteryLevel = 1;
      let nextReviewDate = new Date(now);
      nextReviewDate.setDate(nextReviewDate.getDate() + this.DEFAULT_CONFIG.initialInterval);

      if (existing) {
        const newAccuracy = (existing.correctReviews + (isCorrect ? 1 : 0)) / (existing.totalReviews + 1);
        
        // Calculate next review interval based on performance
        const interval = this.calculateNextInterval(
          existing.repetitionLevel,
          isCorrect,
          newAccuracy
        );
        
        nextReviewDate = new Date(now);
        nextReviewDate.setDate(nextReviewDate.getDate() + interval);
        
        // Update mastery level based on performance
        newMasteryLevel = this.calculateMasteryLevel(
          existing.correctReviews + (isCorrect ? 1 : 0),
          existing.totalReviews + 1,
          existing.repetitionLevel,
          isCorrect
        );
      }

      await supabase
        .from('known_words')
        .upsert({
          user_id: userId,
          word,
          language,
          correct_count: existing ? existing.correctReviews + (isCorrect ? 1 : 0) : (isCorrect ? 1 : 0),
          review_count: existing ? existing.totalReviews + 1 : 1,
          mastery_level: newMasteryLevel,
          last_reviewed_at: now.toISOString(),
          next_review_date: nextReviewDate.toISOString().split('T')[0],
          updated_at: now.toISOString()
        }, {
          onConflict: 'user_id,word,language'
        });

      console.log(`Updated word performance: ${word} (${language}) - Correct: ${isCorrect}, New mastery: ${newMasteryLevel}`);
    } catch (error) {
      console.error('Error updating word performance:', error);
    }
  }

  static async getWordsForReview(
    userId: string,
    language: string,
    limit: number = 10
  ): Promise<string[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('known_words')
        .select('word')
        .eq('user_id', userId)
        .eq('language', language)
        .lte('next_review_date', today)
        .order('next_review_date', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching words for review:', error);
        return [];
      }

      return data?.map(item => item.word) || [];
    } catch (error) {
      console.error('Error in getWordsForReview:', error);
      return [];
    }
  }

  static async getStrugglingWords(
    userId: string,
    language: string,
    limit: number = 5
  ): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('known_words')
        .select('word, review_count, correct_count')
        .eq('user_id', userId)
        .eq('language', language)
        .gte('review_count', 3)
        .order('correct_count', { ascending: true });

      if (error) {
        console.error('Error fetching struggling words:', error);
        return [];
      }

      const strugglingWords = data?.filter(item => {
        const accuracy = item.correct_count / item.review_count;
        return accuracy < this.DEFAULT_CONFIG.strugglingThreshold;
      }).slice(0, limit).map(item => item.word) || [];

      return strugglingWords;
    } catch (error) {
      console.error('Error in getStrugglingWords:', error);
      return [];
    }
  }

  private static calculateNextInterval(
    currentLevel: number,
    wasCorrect: boolean,
    accuracy: number
  ): number {
    const config = this.DEFAULT_CONFIG;
    let multiplier = wasCorrect ? config.easyMultiplier : config.hardMultiplier;
    
    // Adjust multiplier based on accuracy
    if (accuracy > 0.9) multiplier *= 1.2;
    else if (accuracy < 0.7) multiplier *= 0.8;
    
    const newInterval = Math.ceil(config.initialInterval * Math.pow(multiplier, currentLevel - 1));
    return Math.min(newInterval, config.maxInterval);
  }

  private static calculateMasteryLevel(
    correctCount: number,
    totalReviews: number,
    currentLevel: number,
    wasCorrect?: boolean
  ): number {
    const accuracy = totalReviews > 0 ? correctCount / totalReviews : 0;
    
    // Promote if accuracy is high enough and recent performance is good
    if (accuracy >= this.DEFAULT_CONFIG.minAccuracyForPromotion && correctCount >= currentLevel * 2) {
      return Math.min(currentLevel + 1, 10);
    }
    
    // Demote if struggling
    if (accuracy < this.DEFAULT_CONFIG.strugglingThreshold && totalReviews >= 5) {
      return Math.max(currentLevel - 1, 1);
    }
    
    return currentLevel;
  }

  private static calculateMasteryScore(
    correctCount: number,
    totalReviews: number,
    masteryLevel: number
  ): number {
    if (totalReviews === 0) return 0;
    
    const accuracy = correctCount / totalReviews;
    const experienceBonus = Math.min(totalReviews / 20, 1);
    const masteryBonus = masteryLevel / 10;
    
    return Math.min((accuracy * 0.6 + experienceBonus * 0.2 + masteryBonus * 0.2) * 100, 100);
  }
}
