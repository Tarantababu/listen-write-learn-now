
import { supabase } from '@/integrations/supabase/client';
import { DifficultyLevel } from '@/types/sentence-mining';
import { VocabularyTrackingService } from './vocabularyTrackingService';

export interface WordSelectionConfig {
  newWordRatio: number;        // 0.0 to 1.0 - percentage of new words per exercise
  reviewWordRatio: number;     // 0.0 to 1.0 - percentage of review words
  strugglingWordBoost: number; // Multiplier for struggling words
  masteredWordPenalty: number; // Reduction factor for mastered words
  nPlusOneMode: boolean;       // N+1 learning approach
}

export interface EnhancedWordSelectionResult {
  selectedWords: string[];
  wordTypes: Record<string, 'new' | 'review' | 'struggling' | 'mastered'>;
  selectionReason: string;
  vocabularyDistribution: {
    newWords: number;
    reviewWords: number;
    strugglingWords: number;
    masteredWords: number;
  };
}

export class EnhancedWordSelection {
  private static readonly DEFAULT_CONFIG: WordSelectionConfig = {
    newWordRatio: 0.6,
    reviewWordRatio: 0.3,
    strugglingWordBoost: 2.0,
    masteredWordPenalty: 0.2,
    nPlusOneMode: true
  };

  static async selectVocabularyAwareWords(
    userId: string,
    language: string,
    difficulty: DifficultyLevel,
    wordCount: number = 1,
    config: Partial<WordSelectionConfig> = {}
  ): Promise<EnhancedWordSelectionResult> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    try {
      // Get user's vocabulary classification
      const vocabularyStats = await VocabularyTrackingService.getVocabularyStats(userId, language);
      
      // Get different types of words
      const [strugglingWords, reviewWords, masteredWords] = await Promise.all([
        VocabularyTrackingService.getStrugglingWords(userId, language, 10),
        VocabularyTrackingService.getWordsForReview(userId, language, 10),
        VocabularyTrackingService.getMasteredWords(userId, language)
      ]);

      // Calculate target distribution
      const distribution = this.calculateTargetDistribution(
        wordCount,
        finalConfig,
        vocabularyStats.totalWordsEncountered > 0
      );

      // Select words based on distribution
      const selectedWords: string[] = [];
      const wordTypes: Record<string, 'new' | 'review' | 'struggling' | 'mastered'> = {};
      
      // Prioritize struggling words
      let selectedStruggling = 0;
      for (const word of strugglingWords.slice(0, distribution.strugglingWords)) {
        selectedWords.push(word);
        wordTypes[word] = 'struggling';
        selectedStruggling++;
      }

      // Add review words
      let selectedReview = 0;
      for (const word of reviewWords.slice(0, distribution.reviewWords)) {
        if (!selectedWords.includes(word)) {
          selectedWords.push(word);
          wordTypes[word] = 'review';
          selectedReview++;
        }
      }

      // Add mastered words (lower priority)
      let selectedMastered = 0;
      for (const word of masteredWords.slice(0, distribution.masteredWords)) {
        if (!selectedWords.includes(word)) {
          selectedWords.push(word);
          wordTypes[word] = 'mastered';
          selectedMastered++;
        }
      }

      // Fill remaining with new words from database
      const remainingSlots = wordCount - selectedWords.length;
      if (remainingSlots > 0) {
        const newWords = await this.getNewWordsFromDatabase(
          userId,
          language,
          difficulty,
          remainingSlots,
          selectedWords
        );
        
        newWords.forEach(word => {
          selectedWords.push(word);
          wordTypes[word] = 'new';
        });
      }

      const selectionReason = this.generateSelectionReason(
        distribution,
        selectedStruggling,
        selectedReview,
        selectedMastered,
        finalConfig
      );

      return {
        selectedWords: selectedWords.slice(0, wordCount),
        wordTypes,
        selectionReason,
        vocabularyDistribution: {
          newWords: Object.values(wordTypes).filter(t => t === 'new').length,
          reviewWords: selectedReview,
          strugglingWords: selectedStruggling,
          masteredWords: selectedMastered
        }
      };
    } catch (error) {
      console.error('Error in vocabulary-aware word selection:', error);
      return {
        selectedWords: [],
        wordTypes: {},
        selectionReason: 'Error in word selection',
        vocabularyDistribution: {
          newWords: 0,
          reviewWords: 0,
          strugglingWords: 0,
          masteredWords: 0
        }
      };
    }
  }

  private static calculateTargetDistribution(
    wordCount: number,
    config: WordSelectionConfig,
    hasExistingVocabulary: boolean
  ) {
    if (!hasExistingVocabulary) {
      // New user - mostly new words
      return {
        newWords: wordCount,
        reviewWords: 0,
        strugglingWords: 0,
        masteredWords: 0
      };
    }

    const strugglingWords = Math.ceil(wordCount * 0.1); // Always prioritize struggling words
    const reviewWords = Math.ceil(wordCount * config.reviewWordRatio);
    const masteredWords = Math.floor(wordCount * 0.1); // Small amount of mastered words
    const newWords = Math.max(0, wordCount - strugglingWords - reviewWords - masteredWords);

    return {
      newWords,
      reviewWords,
      strugglingWords,
      masteredWords
    };
  }

  private static async getNewWordsFromDatabase(
    userId: string,
    language: string,
    difficulty: DifficultyLevel,
    count: number,
    excludeWords: string[]
  ): Promise<string[]> {
    try {
      // Get words that user hasn't encountered yet
      const { data: knownWordsData } = await supabase
        .from('known_words')
        .select('word')
        .eq('user_id', userId)
        .eq('language', language);

      const knownWords = knownWordsData?.map(w => w.word.toLowerCase()) || [];
      const allExcludeWords = [...excludeWords, ...knownWords].map(w => w.toLowerCase());

      // Use the existing word pool system but filter out known words
      const difficultyWordPools = {
        beginner: ['der', 'die', 'das', 'und', 'ich', 'haben', 'sein', 'gehen', 'gut', 'neu'],
        intermediate: ['jedoch', 'während', 'dadurch', 'trotzdem', 'beispielsweise', 'möglich'],
        advanced: ['nichtsdestotrotz', 'diesbezüglich', 'hinsichtlich', 'entsprechend']
      };

      const availableWords = difficultyWordPools[difficulty] || difficultyWordPools.beginner;
      const newWords = availableWords
        .filter(word => !allExcludeWords.includes(word.toLowerCase()))
        .slice(0, count);

      return newWords;
    } catch (error) {
      console.error('Error getting new words:', error);
      return [];
    }
  }

  private static generateSelectionReason(
    distribution: any,
    selectedStruggling: number,
    selectedReview: number,
    selectedMastered: number,
    config: WordSelectionConfig
  ): string {
    const reasons = [];

    if (selectedStruggling > 0) {
      reasons.push(`${selectedStruggling} struggling word${selectedStruggling > 1 ? 's' : ''} for reinforcement`);
    }

    if (selectedReview > 0) {
      reasons.push(`${selectedReview} review word${selectedReview > 1 ? 's' : ''} for practice`);
    }

    if (distribution.newWords > 0) {
      reasons.push(`${distribution.newWords} new word${distribution.newWords > 1 ? 's' : ''} for learning`);
    }

    if (config.nPlusOneMode) {
      reasons.push('N+1 learning approach');
    }

    return reasons.join(', ') || 'Vocabulary-optimized selection';
  }

  static getOptimalConfig(
    vocabularySize: number,
    strugglingWordsCount: number,
    userPreference: 'conservative' | 'balanced' | 'aggressive' = 'balanced'
  ): WordSelectionConfig {
    const baseConfig = { ...this.DEFAULT_CONFIG };

    // Adjust based on vocabulary size
    if (vocabularySize < 50) {
      // New learner - focus on new words
      baseConfig.newWordRatio = 0.8;
      baseConfig.reviewWordRatio = 0.2;
    } else if (vocabularySize < 200) {
      // Intermediate learner - balanced approach
      baseConfig.newWordRatio = 0.6;
      baseConfig.reviewWordRatio = 0.4;
    } else {
      // Advanced learner - more review focus
      baseConfig.newWordRatio = 0.4;
      baseConfig.reviewWordRatio = 0.6;
    }

    // Adjust for struggling words
    if (strugglingWordsCount > 10) {
      baseConfig.strugglingWordBoost = 3.0;
      baseConfig.reviewWordRatio += 0.1;
      baseConfig.newWordRatio -= 0.1;
    }

    // Apply user preference
    switch (userPreference) {
      case 'conservative':
        baseConfig.newWordRatio *= 0.7;
        baseConfig.reviewWordRatio += 0.2;
        break;
      case 'aggressive':
        baseConfig.newWordRatio *= 1.3;
        baseConfig.reviewWordRatio -= 0.1;
        break;
    }

    return baseConfig;
  }
}
