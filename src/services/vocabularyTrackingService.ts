
import { supabase } from '@/integrations/supabase/client';

export interface VocabularyClassification {
  passiveVocabulary: number; // Words with mastery_level >= 2
  activeVocabulary: number;  // Words with mastery_level >= 4 and accuracy >= 80%
  totalWordsEncountered: number;
  strugglingWords: number;   // Words with accuracy < 60%
  masteryDistribution: {
    beginner: number;    // mastery_level 1
    intermediate: number; // mastery_level 2-3
    advanced: number;    // mastery_level 4-5
    mastered: number;    // mastery_level >= 6
  };
}

export class VocabularyTrackingService {
  static async getVocabularyStats(
    userId: string,
    language: string
  ): Promise<VocabularyClassification> {
    try {
      const { data: knownWords, error } = await supabase
        .from('known_words')
        .select('mastery_level, review_count, correct_count')
        .eq('user_id', userId)
        .eq('language', language);

      if (error) {
        console.error('Error fetching vocabulary stats:', error);
        return this.getEmptyStats();
      }

      if (!knownWords || knownWords.length === 0) {
        return this.getEmptyStats();
      }

      let passiveVocabulary = 0;
      let activeVocabulary = 0;
      let strugglingWords = 0;
      const masteryDistribution = {
        beginner: 0,
        intermediate: 0,
        advanced: 0,
        mastered: 0
      };

      knownWords.forEach(word => {
        const accuracy = word.review_count > 0 ? (word.correct_count / word.review_count) : 0;
        
        // Classify by mastery level for distribution
        if (word.mastery_level === 1) {
          masteryDistribution.beginner++;
        } else if (word.mastery_level <= 3) {
          masteryDistribution.intermediate++;
        } else if (word.mastery_level <= 5) {
          masteryDistribution.advanced++;
        } else {
          masteryDistribution.mastered++;
        }

        // Passive vocabulary: recognized words (mastery >= 2)
        if (word.mastery_level >= 2) {
          passiveVocabulary++;
        }

        // Active vocabulary: mastered words (mastery >= 4 with good accuracy)
        if (word.mastery_level >= 4 && accuracy >= 0.8) {
          activeVocabulary++;
        }

        // Struggling words: low accuracy with some attempts
        if (word.review_count >= 3 && accuracy < 0.6) {
          strugglingWords++;
        }
      });

      return {
        passiveVocabulary,
        activeVocabulary,
        totalWordsEncountered: knownWords.length,
        strugglingWords,
        masteryDistribution,
        language
      };
    } catch (error) {
      console.error('Error in getVocabularyStats:', error);
      return this.getEmptyStats();
    }
  }

  private static getEmptyStats(): VocabularyClassification {
    return {
      passiveVocabulary: 0,
      activeVocabulary: 0,
      totalWordsEncountered: 0,
      strugglingWords: 0,
      masteryDistribution: {
        beginner: 0,
        intermediate: 0,
        advanced: 0,
        mastered: 0
      }
    };
  }

  static async getWordsForReview(
    userId: string,
    language: string,
    limit: number = 10
  ): Promise<string[]> {
    try {
      const { data: words } = await supabase
        .from('known_words')
        .select('word')
        .eq('user_id', userId)
        .eq('language', language)
        .lte('next_review_date', new Date().toISOString().split('T')[0])
        .order('next_review_date', { ascending: true })
        .limit(limit);

      return words?.map(w => w.word) || [];
    } catch (error) {
      console.error('Error getting words for review:', error);
      return [];
    }
  }

  static async getStrugglingWords(
    userId: string,
    language: string,
    limit: number = 5
  ): Promise<string[]> {
    try {
      const { data: words } = await supabase
        .from('known_words')
        .select('word, review_count, correct_count')
        .eq('user_id', userId)
        .eq('language', language)
        .gte('review_count', 3);

      if (!words) return [];

      const strugglingWords = words
        .filter(w => (w.correct_count / w.review_count) < 0.6)
        .slice(0, limit)
        .map(w => w.word);

      return strugglingWords;
    } catch (error) {
      console.error('Error getting struggling words:', error);
      return [];
    }
  }

  static async getMasteredWords(
    userId: string,
    language: string
  ): Promise<string[]> {
    try {
      const { data: words } = await supabase
        .from('known_words')
        .select('word')
        .eq('user_id', userId)
        .eq('language', language)
        .gte('mastery_level', 4)
        .gte('correct_count', 5);

      return words?.map(w => w.word) || [];
    } catch (error) {
      console.error('Error getting mastered words:', error);
      return [];
    }
  }

  static calculateVocabularyGrowthRate(
    currentStats: VocabularyClassification,
    previousStats?: VocabularyClassification
  ): {
    passiveGrowth: number;
    activeGrowth: number;
    totalGrowth: number;
  } {
    if (!previousStats) {
      return { passiveGrowth: 0, activeGrowth: 0, totalGrowth: 0 };
    }

    return {
      passiveGrowth: currentStats.passiveVocabulary - previousStats.passiveVocabulary,
      activeGrowth: currentStats.activeVocabulary - previousStats.activeVocabulary,
      totalGrowth: currentStats.totalWordsEncountered - previousStats.totalWordsEncountered
    };
  }
}
