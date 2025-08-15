
import { DifficultyLevel } from '@/types/sentence-mining';
import { WordSelectionOptions, WordSelectionResult } from './wordSelection/wordSelectionTypes';
import { WordFrequencyService } from './wordSelection/wordFrequencyService';
import { WordPoolGenerator } from './wordSelection/wordPoolGenerator';
import { WordMeaningService } from './wordSelection/wordMeaningService';
import { WordUsageTracker } from './wordSelection/wordUsageTracker';

export class EnhancedWordFrequencyService {
  static async selectWordsForDifficulty(options: WordSelectionOptions): Promise<WordSelectionResult> {
    console.log(`[EnhancedWordFrequencyService] Selecting ${options.count} words for ${options.language} (${options.difficulty})`);
    
    try {
      const wordData = await WordFrequencyService.getWordFrequencyData(options.language);
      const excludeWords = (options.excludeWords || []).map(w => w.toLowerCase());
      
      let wordPool: string[];
      switch (options.difficulty) {
        case 'beginner':
          wordPool = wordData.top1k;
          break;
        case 'intermediate':
          wordPool = wordData.top3k;
          break;
        case 'advanced':
          wordPool = wordData.top5k;
          break;
        default:
          wordPool = wordData.top1k;
      }

      const availableWords = wordPool.filter(word => 
        !excludeWords.includes(word.toLowerCase())
      );

      if (availableWords.length === 0) {
        console.warn('[EnhancedWordFrequencyService] No available words after filtering, using emergency fallback');
        const emergency = WordPoolGenerator.getEmergencyWordPool(options.language);
        return {
          words: emergency.slice(0, options.count),
          metadata: {
            selectionQuality: 20,
            diversityScore: 30,
            source: 'emergency_fallback',
            totalAvailable: emergency.length,
            difficultyLevel: options.difficulty
          }
        };
      }

      const selectedWords: string[] = [];
      const shuffled = [...availableWords].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < Math.min(options.count, shuffled.length); i++) {
        selectedWords.push(shuffled[i]);
      }

      const selectionQuality = Math.min(95, 60 + (availableWords.length / wordPool.length) * 35);
      const diversityScore = Math.min(90, selectedWords.length * 20);

      console.log(`[EnhancedWordFrequencyService] Selected ${selectedWords.length} words with ${Math.round(selectionQuality)}% quality`);

      return {
        words: selectedWords,
        metadata: {
          selectionQuality: Math.round(selectionQuality),
          diversityScore: Math.round(diversityScore),
          source: `${options.difficulty}_pool`,
          totalAvailable: availableWords.length,
          difficultyLevel: options.difficulty
        }
      };
    } catch (error) {
      console.error('[EnhancedWordFrequencyService] Error in word selection:', error);
      
      const emergency = WordPoolGenerator.getEmergencyWordPool(options.language);
      return {
        words: emergency.slice(0, options.count),
        metadata: {
          selectionQuality: 10,
          diversityScore: 20,
          source: 'error_fallback',
          totalAvailable: emergency.length,
          difficultyLevel: options.difficulty
        }
      };
    }
  }

  static getEmergencyFallbackWords(language: string): string[] {
    return WordPoolGenerator.getEmergencyWordPool(language);
  }

  static getSessionData(language: string) {
    return WordFrequencyService.getSessionData(language);
  }

  static getSessionStats(language: string) {
    return WordFrequencyService.getSessionData(language);
  }

  static clearSessionData(language?: string): void {
    WordFrequencyService.clearSessionData(language);
  }

  static getWordMeaning(language: string, word: string): string {
    return WordMeaningService.getWordMeaning(language, word);
  }

  static trackWordUsage(
    userId: string,
    word: string,
    language: string,
    sessionId: string,
    isCorrect?: boolean
  ): void {
    WordUsageTracker.trackWordUsage(userId, word, language, sessionId, isCorrect);
  }
}

// Re-export types for backward compatibility
export type { WordSelectionOptions, WordSelectionResult };
