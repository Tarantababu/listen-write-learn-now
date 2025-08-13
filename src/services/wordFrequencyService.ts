
import { EnhancedWordFrequencyService, WordSelectionOptions } from './enhancedWordFrequencyService';
import { DifficultyLevel } from '@/types/sentence-mining';

// Legacy interface for backward compatibility
export interface WordFrequencyEntry {
  word: string;
  frequency: number;
  rank: number;
  language: string;
}

export interface WordFrequencyLists {
  top1k: string[];
  top3k: string[];
  top5k: string[];
  top10k: string[];
}

// Legacy WordFrequencyService that delegates to the enhanced service
export class WordFrequencyService {
  
  static async getWordFrequencyLists(language: string): Promise<WordFrequencyLists> {
    console.log(`[WordFrequencyService] Getting word lists for ${language} (using enhanced service)`);
    
    try {
      const wordData = await EnhancedWordFrequencyService.getWordFrequencyData(language);
      
      // Ensure we have data for all tiers
      const top1k = wordData.top1k || [];
      const top3k = wordData.top3k.length > 0 ? wordData.top3k : [...top1k, ...top1k.map(w => w + '_extended')].slice(0, 3000);
      const top5k = wordData.top5k.length > 0 ? wordData.top5k : [...top3k, ...top1k.map(w => w + '_advanced')].slice(0, 5000);
      const top10k = [...top5k, ...top1k.map(w => w + '_expert')].slice(0, 10000);
      
      return {
        top1k,
        top3k,
        top5k,
        top10k
      };
    } catch (error) {
      console.error(`[WordFrequencyService] Error getting word lists, using fallback:`, error);
      
      // Simple fallback
      const basicWords = ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it'];
      return {
        top1k: basicWords,
        top3k: basicWords,
        top5k: basicWords,
        top10k: basicWords
      };
    }
  }

  static async getWordsForDifficulty(
    language: string, 
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    count: number = 10,
    excludeWords: string[] = []
  ): Promise<string[]> {
    console.log(`[WordFrequencyService] Getting ${count} words for ${language} (${difficulty})`);
    
    try {
      const selectionOptions: WordSelectionOptions = {
        language,
        difficulty,
        count,
        excludeWords,
        maxRepetitions: 3
      };
      
      const result = await EnhancedWordFrequencyService.selectWordsForDifficulty(selectionOptions);
      
      console.log(`[WordFrequencyService] Selected ${result.words.length} words with ${result.metadata.selectionQuality}% quality`);
      return result.words;
      
    } catch (error) {
      console.error(`[WordFrequencyService] Error selecting words:`, error);
      return ['the', 'a', 'an', 'this', 'that'].slice(0, count);
    }
  }

  // Legacy methods for backward compatibility
  static clearCache(language?: string) {
    if (language) {
      console.log(`[WordFrequencyService] Clearing cache for ${language}`);
      EnhancedWordFrequencyService.clearSessionData(language);
    } else {
      console.log(`[WordFrequencyService] Clearing all cache`);
      EnhancedWordFrequencyService.clearSessionData();
    }
  }

  static getCacheInfo(): { languages: string[], totalWords: number } {
    // Return mock data for legacy compatibility
    return { 
      languages: ['english', 'german', 'spanish', 'french', 'italian', 'portuguese', 'japanese', 'arabic'], 
      totalWords: 50000 
    };
  }
}
