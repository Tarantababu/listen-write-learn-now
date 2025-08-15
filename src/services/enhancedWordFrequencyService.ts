import { supabase } from '@/integrations/supabase/client';
import { DifficultyLevel } from '@/types/sentence-mining';

export interface WordFrequencyEntry {
  word: string;
  frequency: number;
  rank: number;
  language: string;
}

export interface WordFrequencyData {
  top1k: string[];
  top3k: string[];
  top5k: string[];
  top10k: string[];
}

export interface WordSelectionOptions {
  language: string;
  difficulty: DifficultyLevel;
  count?: number;
  excludeWords?: string[];
  maxRepetitions?: number;
}

export interface WordSelectionResult {
  words: string[];
  metadata: {
    selectionQuality: number;
    diversityScore: number;
    source: string;
    totalAvailable: number;
  };
}

export class EnhancedWordFrequencyService {
  private static wordFrequencyCache: Map<string, WordFrequencyData> = new Map();
  private static sessionData: Map<string, any> = new Map();

  // Enhanced language-specific emergency fallbacks
  static getEmergencyFallbackWords(language: string): string[] {
    const fallbacks: Record<string, string[]> = {
      german: ['der', 'die', 'das', 'und', 'ist', 'ich', 'du', 'er', 'sie', 'wir', 'haben', 'sein', 'können', 'werden', 'müssen'],
      spanish: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'te', 'lo', 'le', 'da'],
      french: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son'],
      italian: ['il', 'di', 'che', 'e', 'la', 'a', 'per', 'non', 'in', 'da', 'un', 'essere', 'con', 'avere', 'lo'],
      portuguese: ['o', 'de', 'que', 'e', 'do', 'a', 'em', 'um', 'para', 'com', 'não', 'uma', 'os', 'no', 'se'],
      japanese: ['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ', 'ある', 'いる', 'する'],
      arabic: ['في', 'من', 'إلى', 'على', 'هذا', 'هذه', 'التي', 'التي', 'كان', 'كانت', 'يكون', 'تكون', 'الذي', 'اللذان', 'اللتان'],
      english: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'he']
    };

    return fallbacks[language.toLowerCase()] || fallbacks.english;
  }

  // Enhanced word meaning retrieval with language consistency
  static getWordMeaning(language: string, word: string): string {
    const meanings: Record<string, Record<string, string>> = {
      german: {
        'der': 'the (masculine)',
        'die': 'the (feminine)',
        'das': 'the (neuter)',
        'und': 'and',
        'ist': 'is',
        'ich': 'I',
        'du': 'you',
        'er': 'he',
        'sie': 'she/they',
        'wir': 'we',
        'haben': 'to have',
        'sein': 'to be',
        'können': 'can/to be able to',
        'werden': 'to become',
        'müssen': 'must/to have to'
      },
      spanish: {
        'el': 'the (masculine)',
        'la': 'the (feminine)',
        'de': 'of/from',
        'que': 'that/which',
        'y': 'and',
        'a': 'to/at',
        'en': 'in/on',
        'un': 'a/an (masculine)',
        'ser': 'to be',
        'se': 'himself/herself/itself',
        'no': 'no/not',
        'te': 'you (object)',
        'lo': 'it/him (object)',
        'le': 'to him/her',
        'da': 'gives'
      },
      french: {
        'le': 'the (masculine)',
        'de': 'of/from',
        'et': 'and',
        'à': 'to/at',
        'un': 'a/an (masculine)',
        'il': 'he/it',
        'être': 'to be',
        'en': 'in/of it',
        'avoir': 'to have',
        'que': 'that/which',
        'pour': 'for',
        'dans': 'in',
        'ce': 'this/that',
        'son': 'his/her/its'
      }
    };

    const languageMeanings = meanings[language.toLowerCase()];
    if (languageMeanings && languageMeanings[word.toLowerCase()]) {
      return languageMeanings[word.toLowerCase()];
    }

    // Fallback to word itself if no meaning found
    return word;
  }

  static async getWordFrequencyData(language: string): Promise<WordFrequencyData> {
    if (this.wordFrequencyCache.has(language)) {
      console.log(`[EnhancedWordFrequencyService] Getting word frequency data from cache for ${language}`);
      return this.wordFrequencyCache.get(language)!;
    }

    try {
      console.log(`[EnhancedWordFrequencyService] Fetching word frequency data for ${language}`);

      const { data, error } = await supabase
        .from('word_frequencies')
        .select('top1k, top3k, top5k, top10k')
        .eq('language', language)
        .single();

      if (error) {
        throw new Error(`Error fetching word frequencies: ${error.message}`);
      }

      if (!data) {
        throw new Error(`No word frequency data found for language: ${language}`);
      }

      const wordData: WordFrequencyData = {
        top1k: data.top1k || [],
        top3k: data.top3k || [],
        top5k: data.top5k || [],
        top10k: data.top10k || []
      };

      this.wordFrequencyCache.set(language, wordData);
      return wordData;

    } catch (error) {
      console.error(`[EnhancedWordFrequencyService] Error getting word frequency data:`, error);
      
      // Fallback data
      return {
        top1k: ['the', 'be', 'to', 'of', 'and'],
        top3k: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it'],
        top5k: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'he'],
        top10k: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this']
      };
    }
  }

  static async selectWordsForDifficulty(options: WordSelectionOptions): Promise<WordSelectionResult> {
    const {
      language,
      difficulty,
      count = 10,
      excludeWords = [],
      maxRepetitions = 3
    } = options;

    console.log(`[EnhancedWordFrequencyService] Selecting ${count} words for ${language} (${difficulty})`);

    try {
      // Get language-specific word pool
      const wordData = await this.getWordFrequencyData(language);
      let availableWords: string[] = [];

      // Select appropriate difficulty tier with language consistency check
      switch (difficulty) {
        case 'beginner':
          availableWords = wordData.top1k || this.getEmergencyFallbackWords(language);
          break;
        case 'intermediate':
          availableWords = wordData.top3k.length > 0 ? wordData.top3k : wordData.top1k || this.getEmergencyFallbackWords(language);
          break;
        case 'advanced':
          availableWords = wordData.top5k.length > 0 ? wordData.top5k : (wordData.top3k.length > 0 ? wordData.top3k : wordData.top1k) || this.getEmergencyFallbackWords(language);
          break;
        default:
          availableWords = wordData.top1k || this.getEmergencyFallbackWords(language);
      }

      // Filter out excluded words
      const filteredWords = availableWords.filter(word => 
        !excludeWords.map(w => w.toLowerCase()).includes(word.toLowerCase())
      );

      // If no words available after filtering, use emergency fallbacks
      if (filteredWords.length === 0) {
        console.warn(`[EnhancedWordFrequencyService] No words available after filtering, using emergency fallbacks for ${language}`);
        const emergencyWords = this.getEmergencyFallbackWords(language);
        const availableEmergency = emergencyWords.filter(word => 
          !excludeWords.map(w => w.toLowerCase()).includes(word.toLowerCase())
        );
        
        if (availableEmergency.length === 0) {
          // Absolute emergency - just use the first few emergency words
          return {
            words: emergencyWords.slice(0, count),
            metadata: {
              selectionQuality: 30,
              diversityScore: 40,
              source: `emergency_fallback_${language}`,
              totalAvailable: emergencyWords.length
            }
          };
        }
        
        return {
          words: this.shuffleArray(availableEmergency).slice(0, count),
          metadata: {
            selectionQuality: 50,
            diversityScore: 60,
            source: `filtered_emergency_${language}`,
            totalAvailable: availableEmergency.length
          }
        };
      }

      // Intelligent selection with diversity
      const selectedWords = this.selectDiverseWords(filteredWords, count, maxRepetitions);
      const selectionQuality = Math.min(85 + (filteredWords.length / 100), 100);

      console.log(`[EnhancedWordFrequencyService] Selected ${selectedWords.length} words with ${selectionQuality}% quality for ${language}`);

      return {
        words: selectedWords,
        metadata: {
          selectionQuality: Math.round(selectionQuality),
          diversityScore: Math.round(this.calculateDiversityScore(selectedWords)),
          source: `${difficulty}_${language}`,
          totalAvailable: filteredWords.length
        }
      };

    } catch (error) {
      console.error(`[EnhancedWordFrequencyService] Error selecting words for ${language}:`, error);
      
      // Emergency fallback on error
      const emergencyWords = this.getEmergencyFallbackWords(language);
      return {
        words: emergencyWords.slice(0, count),
        metadata: {
          selectionQuality: 25,
          diversityScore: 30,
          source: `error_fallback_${language}`,
          totalAvailable: emergencyWords.length
        }
      };
    }
  }

  private static selectDiverseWords(words: string[], count: number, maxRepetitions: number): string[] {
    const selectedWords: string[] = [];
    const wordCounts: { [word: string]: number } = {};

    for (const word of words) {
      const lowerCaseWord = word.toLowerCase();
      wordCounts[lowerCaseWord] = (wordCounts[lowerCaseWord] || 0) + 1;
    }

    // Sort words by frequency in descending order
    const sortedWords = Object.entries(wordCounts).sort(([, countA], [, countB]) => countB - countA);

    for (const [word] of sortedWords) {
      if (selectedWords.length >= count) {
        break;
      }

      if (selectedWords.filter(selected => selected.toLowerCase() === word).length < maxRepetitions) {
        selectedWords.push(word);
      }
    }

    return selectedWords;
  }

  private static calculateDiversityScore(words: string[]): number {
    if (words.length === 0) return 0;

    const uniqueChars = new Set<string>();
    for (const word of words) {
      for (const char of word) {
        uniqueChars.add(char);
      }
    }

    // A higher number of unique characters indicates greater diversity
    const diversityScore = (uniqueChars.size / words.length) * 50;
    return Math.min(diversityScore, 100);
  }

  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static clearCache(language?: string) {
    if (language) {
      console.log(`[EnhancedWordFrequencyService] Clearing cache for ${language}`);
      this.wordFrequencyCache.delete(language);
    } else {
      console.log(`[EnhancedWordFrequencyService] Clearing all cache`);
      this.wordFrequencyCache.clear();
    }
  }

  static clearSessionData(language?: string) {
    if (language) {
      console.log(`[EnhancedWordFrequencyService] Clearing session data for ${language}`);
      this.sessionData.delete(language);
    } else {
      console.log(`[EnhancedWordFrequencyService] Clearing all session data`);
      this.sessionData.clear();
    }
  }

  static getCacheInfo(): { languages: string[], totalWords: number } {
    let totalWords = 0;
    const languages: string[] = [];

    for (const [language, data] of this.wordFrequencyCache.entries()) {
      languages.push(language);
      totalWords += (data.top1k?.length || 0) + (data.top3k?.length || 0) + (data.top5k?.length || 0);
    }

    return { languages, totalWords };
  }

  static setSessionData(key: string, data: any, language?: string) {
    const sessionKey = language ? `${language}-${key}` : key;
    this.sessionData.set(sessionKey, data);
  }

  static getSessionData(key: string, language?: string): any {
    const sessionKey = language ? `${language}-${key}` : key;
    return this.sessionData.get(sessionKey);
  }
}
