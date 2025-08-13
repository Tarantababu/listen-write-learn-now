
import { LANGUAGE_WORD_DATA, getLanguageRules, LanguageWordData } from './wordFrequencyData';
import { DifficultyLevel } from '@/types/sentence-mining';

export interface WordSelectionOptions {
  language: string;
  difficulty: DifficultyLevel;
  count: number;
  excludeWords: string[];
  sessionWords?: string[];
  preferredTypes?: string[];
  maxRepetitions?: number;
}

export interface WordSelectionResult {
  words: string[];
  metadata: {
    source: 'frequency_based' | 'fallback';
    difficultyLevel: DifficultyLevel;
    totalAvailable: number;
    selectionQuality: number;
  };
}

export class EnhancedWordFrequencyService {
  private static cache = new Map<string, LanguageWordData>();
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static cacheTimestamps = new Map<string, number>();
  
  // Session-based word tracking for anti-repetition
  private static sessionWordUsage = new Map<string, Map<string, number>>();
  
  static async getWordFrequencyData(language: string): Promise<LanguageWordData> {
    const cacheKey = language.toLowerCase();
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    const cacheTime = this.cacheTimestamps.get(cacheKey);
    
    if (cached && cacheTime && Date.now() - cacheTime < this.CACHE_DURATION) {
      console.log(`[EnhancedWordFrequencyService] Using cached data for ${language}`);
      return cached;
    }
    
    // Get data from our comprehensive word lists
    const normalizedLanguage = this.normalizeLanguageName(cacheKey);
    const wordData = LANGUAGE_WORD_DATA[normalizedLanguage];
    
    if (!wordData) {
      console.warn(`[EnhancedWordFrequencyService] No word data found for ${language}, using English fallback`);
      return LANGUAGE_WORD_DATA.english;
    }
    
    // Cache the results
    this.cache.set(cacheKey, wordData);
    this.cacheTimestamps.set(cacheKey, Date.now());
    
    console.log(`[EnhancedWordFrequencyService] Loaded ${wordData.top1k.length} top1k words for ${language}`);
    return wordData;
  }
  
  static async selectWordsForDifficulty(options: WordSelectionOptions): Promise<WordSelectionResult> {
    const { language, difficulty, count, excludeWords, sessionWords = [], maxRepetitions = 3 } = options;
    
    console.log(`[EnhancedWordFrequencyService] Selecting ${count} words for ${language} (${difficulty})`);
    console.log(`[EnhancedWordFrequencyService] Excluding: [${excludeWords.join(', ')}]`);
    
    try {
      const wordData = await this.getWordFrequencyData(language);
      
      // Get appropriate word list based on difficulty
      let targetList: string[];
      switch (difficulty) {
        case 'beginner':
          targetList = wordData.top1k;
          break;
        case 'intermediate':
          targetList = wordData.top3k.length > 0 ? wordData.top3k : wordData.top1k;
          break;
        case 'advanced':
          targetList = wordData.top5k.length > 0 ? wordData.top5k : (wordData.top3k.length > 0 ? wordData.top3k : wordData.top1k);
          break;
        default:
          targetList = wordData.top1k;
      }
      
      // Apply session-based anti-repetition logic
      const sessionId = this.getSessionId(language);
      const sessionUsage = this.getSessionWordUsage(sessionId);
      
      // Filter words based on exclusion rules and repetition limits
      let availableWords = targetList.filter(word => {
        const normalizedWord = word.toLowerCase();
        
        // Exclude explicitly forbidden words
        if (excludeWords.some(excluded => excluded.toLowerCase() === normalizedWord)) {
          return false;
        }
        
        // Exclude recently used session words
        if (sessionWords.some(sessionWord => sessionWord.toLowerCase() === normalizedWord)) {
          return false;
        }
        
        // Check repetition limit
        const usageCount = sessionUsage.get(normalizedWord) || 0;
        if (usageCount >= maxRepetitions) {
          return false;
        }
        
        return true;
      });
      
      // If not enough words available, gradually relax restrictions
      if (availableWords.length < count) {
        console.log(`[EnhancedWordFrequencyService] Not enough words (${availableWords.length}), relaxing restrictions`);
        
        // First, allow session words that aren't in the immediate exclude list
        availableWords = targetList.filter(word => {
          const normalizedWord = word.toLowerCase();
          return !excludeWords.some(excluded => excluded.toLowerCase() === normalizedWord);
        });
        
        // If still not enough, use the full list minus explicit excludes
        if (availableWords.length < count) {
          availableWords = targetList.filter(word => {
            const normalizedWord = word.toLowerCase();
            return !excludeWords.slice(-5).some(excluded => excluded.toLowerCase() === normalizedWord); // Only exclude last 5
          });
        }
      }
      
      // Randomize and select
      const shuffled = this.shuffleArray([...availableWords]);
      const selectedWords = shuffled.slice(0, Math.min(count, shuffled.length));
      
      // Track usage for session management
      selectedWords.forEach(word => {
        const normalizedWord = word.toLowerCase();
        const currentUsage = sessionUsage.get(normalizedWord) || 0;
        sessionUsage.set(normalizedWord, currentUsage + 1);
      });
      
      // Calculate selection quality score
      const selectionQuality = Math.min(100, Math.round(
        (availableWords.length / targetList.length) * 100 * (selectedWords.length / count)
      ));
      
      console.log(`[EnhancedWordFrequencyService] Selected ${selectedWords.length} words with ${selectionQuality}% quality`);
      
      return {
        words: selectedWords,
        metadata: {
          source: 'frequency_based',
          difficultyLevel: difficulty,
          totalAvailable: availableWords.length,
          selectionQuality
        }
      };
      
    } catch (error) {
      console.error(`[EnhancedWordFrequencyService] Error selecting words:`, error);
      
      // Fallback to basic word selection
      return this.getFallbackSelection(language, difficulty, count, excludeWords);
    }
  }
  
  private static getFallbackSelection(
    language: string, 
    difficulty: DifficultyLevel, 
    count: number, 
    excludeWords: string[]
  ): WordSelectionResult {
    console.log(`[EnhancedWordFrequencyService] Using fallback selection for ${language}`);
    
    // Basic fallback words by language
    const fallbackWords = {
      english: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this'],
      german: ['der', 'die', 'das', 'ich', 'du', 'er', 'sie', 'es', 'haben', 'sein', 'werden', 'können', 'müssen', 'sagen', 'gehen', 'kommen', 'sehen', 'wissen', 'machen', 'geben'],
      spanish: ['el', 'la', 'yo', 'tú', 'él', 'ella', 'ser', 'estar', 'tener', 'hacer', 'decir', 'ir', 'ver', 'dar', 'saber', 'querer', 'llegar', 'pasar', 'deber', 'poner'],
      french: ['le', 'la', 'je', 'tu', 'il', 'elle', 'être', 'avoir', 'faire', 'dire', 'aller', 'voir', 'savoir', 'prendre', 'venir', 'falloir', 'devoir', 'pouvoir', 'dire', 'donner'],
      italian: ['il', 'la', 'io', 'tu', 'lui', 'lei', 'essere', 'avere', 'fare', 'dire', 'andare', 'potere', 'dovere', 'volere', 'sapere', 'dare', 'stare', 'venire', 'uscire', 'parlare'],
      portuguese: ['o', 'a', 'eu', 'tu', 'ele', 'ela', 'ser', 'estar', 'ter', 'fazer', 'dizer', 'ir', 'ver', 'dar', 'saber', 'querer', 'chegar', 'passar', 'dever', 'pôr']
    };
    
    const normalizedLanguage = this.normalizeLanguageName(language);
    const wordPool = fallbackWords[normalizedLanguage as keyof typeof fallbackWords] || fallbackWords.english;
    
    // Filter out excluded words
    let availableWords = wordPool.filter(word => 
      !excludeWords.some(excluded => excluded.toLowerCase() === word.toLowerCase())
    );
    
    // If no words available, use full pool
    if (availableWords.length === 0) {
      availableWords = [...wordPool];
    }
    
    const shuffled = this.shuffleArray(availableWords);
    const selectedWords = shuffled.slice(0, Math.min(count, shuffled.length));
    
    return {
      words: selectedWords,
      metadata: {
        source: 'fallback',
        difficultyLevel: difficulty,
        totalAvailable: availableWords.length,
        selectionQuality: 50 // Fallback quality score
      }
    };
  }
  
  private static normalizeLanguageName(language: string): string {
    const normalized = language.toLowerCase().trim();
    
    // Handle language name variations
    const languageMap: Record<string, string> = {
      'english': 'english',
      'german': 'german',
      'deutsch': 'german',
      'spanish': 'spanish',
      'español': 'spanish',
      'french': 'french',
      'français': 'french',
      'italian': 'italian',
      'italiano': 'italian',
      'portuguese': 'portuguese',
      'português': 'portuguese',
      'japanese': 'japanese',
      '日本語': 'japanese',
      'arabic': 'arabic',
      'العربية': 'arabic'
    };
    
    return languageMap[normalized] || normalized;
  }
  
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  private static getSessionId(language: string): string {
    return `${language}_${new Date().toDateString()}`;
  }
  
  private static getSessionWordUsage(sessionId: string): Map<string, number> {
    if (!this.sessionWordUsage.has(sessionId)) {
      this.sessionWordUsage.set(sessionId, new Map());
    }
    return this.sessionWordUsage.get(sessionId)!;
  }
  
  static clearSessionData(language?: string): void {
    if (language) {
      const sessionId = this.getSessionId(language);
      this.sessionWordUsage.delete(sessionId);
      console.log(`[EnhancedWordFrequencyService] Cleared session data for ${language}`);
    } else {
      this.sessionWordUsage.clear();
      console.log(`[EnhancedWordFrequencyService] Cleared all session data`);
    }
  }
  
  static getSessionStats(language: string): { totalWords: number; uniqueWords: number; mostUsedWord: string | null } {
    const sessionId = this.getSessionId(language);
    const usage = this.sessionWordUsage.get(sessionId);
    
    if (!usage) {
      return { totalWords: 0, uniqueWords: 0, mostUsedWord: null };
    }
    
    const entries = Array.from(usage.entries());
    const totalWords = entries.reduce((sum, [_, count]) => sum + count, 0);
    const uniqueWords = entries.length;
    const mostUsedWord = entries.reduce((max, [word, count]) => 
      count > (max[1] || 0) ? [word, count] : max, ['', 0]
    )[0] || null;
    
    return { totalWords, uniqueWords, mostUsedWord };
  }
}
