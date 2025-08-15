
import { WordFrequencyData, SessionData } from './wordSelectionTypes';
import { WordPoolGenerator } from './wordPoolGenerator';

export class WordFrequencyService {
  private static wordFrequencyCache: Record<string, WordFrequencyData> = {};
  private static sessionData: Record<string, SessionData> = {};

  static async getWordFrequencyData(language: string): Promise<WordFrequencyData> {
    console.log(`[WordFrequencyService] Getting word frequency data for ${language}`);
    
    if (this.wordFrequencyCache[language]) {
      return this.wordFrequencyCache[language];
    }

    try {
      const beginnerWords = WordPoolGenerator.generateWordPool(language, 'beginner');
      const intermediateWords = WordPoolGenerator.generateWordPool(language, 'intermediate');
      const advancedWords = WordPoolGenerator.generateWordPool(language, 'advanced');

      const top1k = beginnerWords;
      const top3k = [...beginnerWords, ...intermediateWords].slice(0, 50);
      const top5k = [...beginnerWords, ...intermediateWords, ...advancedWords.slice(0, 10)].slice(0, 80);
      const top10k = [...beginnerWords, ...intermediateWords, ...advancedWords].slice(0, 100);

      const wordData: WordFrequencyData = {
        top1k,
        top3k,
        top5k,
        top10k
      };

      this.wordFrequencyCache[language] = wordData;
      console.log(`[WordFrequencyService] Cached word data for ${language}: ${top1k.length}/${top3k.length}/${top5k.length}/${top10k.length} words`);
      
      return wordData;
    } catch (error) {
      console.error(`[WordFrequencyService] Error getting word data:`, error);
      
      const emergency = WordPoolGenerator.getEmergencyWordPool(language);
      return {
        top1k: emergency,
        top3k: emergency,
        top5k: emergency,
        top10k: emergency
      };
    }
  }

  static getSessionData(language: string): SessionData {
    if (!this.sessionData[language]) {
      this.sessionData[language] = {
        totalExercises: 0,
        correctAnswers: 0,
        lastAccessed: Date.now(),
        wordUsage: {}
      };
    }
    
    this.sessionData[language].lastAccessed = Date.now();
    return this.sessionData[language];
  }

  static clearSessionData(language?: string): void {
    if (language) {
      delete this.sessionData[language];
      delete this.wordFrequencyCache[language];
      console.log(`[WordFrequencyService] Cleared session data for ${language}`);
    } else {
      this.sessionData = {};
      this.wordFrequencyCache = {};
      console.log('[WordFrequencyService] Cleared all session data');
    }
  }
}
