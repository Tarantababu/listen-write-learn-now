import { supabase } from '@/integrations/supabase/client';
import { DifficultyLevel } from '@/types/sentence-mining';

export interface WordSelectionOptions {
  language: string;
  difficulty: DifficultyLevel;
  count: number;
  excludeWords: string[];
  maxRepetitions?: number;
  preferWordTypes?: string[];
}

export interface WordSelectionResult {
  words: string[];
  metadata: {
    source: string;
    selectionQuality: number;
    difficultyLevel: DifficultyLevel;
    totalAvailable: number;
  };
}

export interface WordWithMeaning {
  word: string;
  englishMeaning: string;
  difficulty: DifficultyLevel;
  frequency: number;
  wordType: 'noun' | 'verb' | 'adjective' | 'other';
}

export interface WordFrequencyData {
  top1k: string[];
  top3k: string[];
  top5k: string[];
  top10k: string[];
}

export class EnhancedWordFrequencyService {
  private static wordPools: Map<string, WordWithMeaning[]> = new Map();
  private static sessionStats: Map<string, any> = new Map();

  // Comprehensive word pools with English meanings for different languages
  private static readonly COMPREHENSIVE_WORD_POOLS = {
    german: {
      beginner: [
        { word: 'der', englishMeaning: 'the (masculine)', difficulty: 'beginner' as DifficultyLevel, frequency: 1, wordType: 'other' as const },
        { word: 'die', englishMeaning: 'the (feminine)', difficulty: 'beginner' as DifficultyLevel, frequency: 2, wordType: 'other' as const },
        { word: 'das', englishMeaning: 'the (neuter)', difficulty: 'beginner' as DifficultyLevel, frequency: 3, wordType: 'other' as const },
        { word: 'ich', englishMeaning: 'I', difficulty: 'beginner' as DifficultyLevel, frequency: 4, wordType: 'other' as const },
        { word: 'du', englishMeaning: 'you', difficulty: 'beginner' as DifficultyLevel, frequency: 5, wordType: 'other' as const },
        { word: 'er', englishMeaning: 'he', difficulty: 'beginner' as DifficultyLevel, frequency: 6, wordType: 'other' as const },
        { word: 'sie', englishMeaning: 'she/they', difficulty: 'beginner' as DifficultyLevel, frequency: 7, wordType: 'other' as const },
        { word: 'es', englishMeaning: 'it', difficulty: 'beginner' as DifficultyLevel, frequency: 8, wordType: 'other' as const },
        { word: 'haben', englishMeaning: 'to have', difficulty: 'beginner' as DifficultyLevel, frequency: 9, wordType: 'verb' as const },
        { word: 'sein', englishMeaning: 'to be', difficulty: 'beginner' as DifficultyLevel, frequency: 10, wordType: 'verb' as const },
        { word: 'Haus', englishMeaning: 'house', difficulty: 'beginner' as DifficultyLevel, frequency: 11, wordType: 'noun' as const },
        { word: 'Auto', englishMeaning: 'car', difficulty: 'beginner' as DifficultyLevel, frequency: 12, wordType: 'noun' as const },
        { word: 'Katze', englishMeaning: 'cat', difficulty: 'beginner' as DifficultyLevel, frequency: 13, wordType: 'noun' as const },
        { word: 'Hund', englishMeaning: 'dog', difficulty: 'beginner' as DifficultyLevel, frequency: 14, wordType: 'noun' as const },
        { word: 'groß', englishMeaning: 'big', difficulty: 'beginner' as DifficultyLevel, frequency: 15, wordType: 'adjective' as const },
        { word: 'klein', englishMeaning: 'small', difficulty: 'beginner' as DifficultyLevel, frequency: 16, wordType: 'adjective' as const },
        { word: 'gut', englishMeaning: 'good', difficulty: 'beginner' as DifficultyLevel, frequency: 17, wordType: 'adjective' as const },
        { word: 'schlecht', englishMeaning: 'bad', difficulty: 'beginner' as DifficultyLevel, frequency: 18, wordType: 'adjective' as const },
        { word: 'kommen', englishMeaning: 'to come', difficulty: 'beginner' as DifficultyLevel, frequency: 19, wordType: 'verb' as const },
        { word: 'gehen', englishMeaning: 'to go', difficulty: 'beginner' as DifficultyLevel, frequency: 20, wordType: 'verb' as const }
      ],
      intermediate: [
        { word: 'werden', englishMeaning: 'to become', difficulty: 'intermediate' as DifficultyLevel, frequency: 21, wordType: 'verb' as const },
        { word: 'können', englishMeaning: 'can/to be able to', difficulty: 'intermediate' as DifficultyLevel, frequency: 22, wordType: 'verb' as const },
        { word: 'müssen', englishMeaning: 'must/to have to', difficulty: 'intermediate' as DifficultyLevel, frequency: 23, wordType: 'verb' as const },
        { word: 'sollen', englishMeaning: 'should/ought to', difficulty: 'intermediate' as DifficultyLevel, frequency: 24, wordType: 'verb' as const },
        { word: 'wollen', englishMeaning: 'to want', difficulty: 'intermediate' as DifficultyLevel, frequency: 25, wordType: 'verb' as const },
        { word: 'zwischen', englishMeaning: 'between', difficulty: 'intermediate' as DifficultyLevel, frequency: 26, wordType: 'other' as const },
        { word: 'während', englishMeaning: 'during/while', difficulty: 'intermediate' as DifficultyLevel, frequency: 27, wordType: 'other' as const },
        { word: 'trotzdem', englishMeaning: 'nevertheless', difficulty: 'intermediate' as DifficultyLevel, frequency: 28, wordType: 'other' as const },
        { word: 'deshalb', englishMeaning: 'therefore', difficulty: 'intermediate' as DifficultyLevel, frequency: 29, wordType: 'other' as const },
        { word: 'außerdem', englishMeaning: 'furthermore', difficulty: 'intermediate' as DifficultyLevel, frequency: 30, wordType: 'other' as const },
        { word: 'Erfahrung', englishMeaning: 'experience', difficulty: 'intermediate' as DifficultyLevel, frequency: 31, wordType: 'noun' as const },
        { word: 'Gesellschaft', englishMeaning: 'society', difficulty: 'intermediate' as DifficultyLevel, frequency: 32, wordType: 'noun' as const },
        { word: 'Entwicklung', englishMeaning: 'development', difficulty: 'intermediate' as DifficultyLevel, frequency: 33, wordType: 'noun' as const },
        { word: 'Möglichkeit', englishMeaning: 'possibility', difficulty: 'intermediate' as DifficultyLevel, frequency: 34, wordType: 'noun' as const },
        { word: 'wichtig', englishMeaning: 'important', difficulty: 'intermediate' as DifficultyLevel, frequency: 35, wordType: 'adjective' as const },
        { word: 'schwierig', englishMeaning: 'difficult', difficulty: 'intermediate' as DifficultyLevel, frequency: 36, wordType: 'adjective' as const },
        { word: 'interessant', englishMeaning: 'interesting', difficulty: 'intermediate' as DifficultyLevel, frequency: 37, wordType: 'adjective' as const },
        { word: 'notwendig', englishMeaning: 'necessary', difficulty: 'intermediate' as DifficultyLevel, frequency: 38, wordType: 'adjective' as const },
        { word: 'verstehen', englishMeaning: 'to understand', difficulty: 'intermediate' as DifficultyLevel, frequency: 39, wordType: 'verb' as const },
        { word: 'erklären', englishMeaning: 'to explain', difficulty: 'intermediate' as DifficultyLevel, frequency: 40, wordType: 'verb' as const }
      ],
      advanced: [
        { word: 'Verantwortung', englishMeaning: 'responsibility', difficulty: 'advanced' as DifficultyLevel, frequency: 41, wordType: 'noun' as const },
        { word: 'Wissenschaft', englishMeaning: 'science', difficulty: 'advanced' as DifficultyLevel, frequency: 42, wordType: 'noun' as const },
        { word: 'Verständnis', englishMeaning: 'understanding', difficulty: 'advanced' as DifficultyLevel, frequency: 43, wordType: 'noun' as const },
        { word: 'Beziehung', englishMeaning: 'relationship', difficulty: 'advanced' as DifficultyLevel, frequency: 44, wordType: 'noun' as const },
        { word: 'Entscheidung', englishMeaning: 'decision', difficulty: 'advanced' as DifficultyLevel, frequency: 45, wordType: 'noun' as const },
        { word: 'außergewöhnlich', englishMeaning: 'extraordinary', difficulty: 'advanced' as DifficultyLevel, frequency: 46, wordType: 'adjective' as const },
        { word: 'verantwortlich', englishMeaning: 'responsible', difficulty: 'advanced' as DifficultyLevel, frequency: 47, wordType: 'adjective' as const },
        { word: 'wissenschaftlich', englishMeaning: 'scientific', difficulty: 'advanced' as DifficultyLevel, frequency: 48, wordType: 'adjective' as const },
        { word: 'charakteristisch', englishMeaning: 'characteristic', difficulty: 'advanced' as DifficultyLevel, frequency: 49, wordType: 'adjective' as const },
        { word: 'repräsentativ', englishMeaning: 'representative', difficulty: 'advanced' as DifficultyLevel, frequency: 50, wordType: 'adjective' as const },
        { word: 'berücksichtigen', englishMeaning: 'to consider', difficulty: 'advanced' as DifficultyLevel, frequency: 51, wordType: 'verb' as const },
        { word: 'charakterisieren', englishMeaning: 'to characterize', difficulty: 'advanced' as DifficultyLevel, frequency: 52, wordType: 'verb' as const },
        { word: 'repräsentieren', englishMeaning: 'to represent', difficulty: 'advanced' as DifficultyLevel, frequency: 53, wordType: 'verb' as const },
        { word: 'demonstrieren', englishMeaning: 'to demonstrate', difficulty: 'advanced' as DifficultyLevel, frequency: 54, wordType: 'verb' as const },
        { word: 'interpretieren', englishMeaning: 'to interpret', difficulty: 'advanced' as DifficultyLevel, frequency: 55, wordType: 'verb' as const }
      ]
    },
    english: {
      beginner: [
        { word: 'the', englishMeaning: 'definite article', difficulty: 'beginner', frequency: 1, wordType: 'other' },
        { word: 'be', englishMeaning: 'to exist', difficulty: 'beginner', frequency: 2, wordType: 'verb' },
        { word: 'to', englishMeaning: 'preposition', difficulty: 'beginner', frequency: 3, wordType: 'other' },
        { word: 'of', englishMeaning: 'belonging to', difficulty: 'beginner', frequency: 4, wordType: 'other' },
        { word: 'and', englishMeaning: 'conjunction', difficulty: 'beginner', frequency: 5, wordType: 'other' },
        { word: 'have', englishMeaning: 'to possess', difficulty: 'beginner', frequency: 6, wordType: 'verb' },
        { word: 'it', englishMeaning: 'pronoun', difficulty: 'beginner', frequency: 7, wordType: 'other' },
        { word: 'in', englishMeaning: 'inside', difficulty: 'beginner', frequency: 8, wordType: 'other' },
        { word: 'that', englishMeaning: 'demonstrative', difficulty: 'beginner', frequency: 9, wordType: 'other' },
        { word: 'for', englishMeaning: 'preposition', difficulty: 'beginner', frequency: 10, wordType: 'other' }
      ],
      intermediate: [
        { word: 'become', englishMeaning: 'to grow to be', difficulty: 'intermediate', frequency: 11, wordType: 'verb' },
        { word: 'through', englishMeaning: 'by way of', difficulty: 'intermediate', frequency: 12, wordType: 'other' },
        { word: 'between', englishMeaning: 'in the middle of', difficulty: 'intermediate', frequency: 13, wordType: 'other' },
        { word: 'important', englishMeaning: 'significant', difficulty: 'intermediate', frequency: 14, wordType: 'adjective' },
        { word: 'different', englishMeaning: 'not the same', difficulty: 'intermediate', frequency: 15, wordType: 'adjective' }
      ],
      advanced: [
        { word: 'sophisticated', englishMeaning: 'complex and refined', difficulty: 'advanced', frequency: 16, wordType: 'adjective' },
        { word: 'consequence', englishMeaning: 'result or effect', difficulty: 'advanced', frequency: 17, wordType: 'noun' },
        { word: 'particularly', englishMeaning: 'especially', difficulty: 'advanced', frequency: 18, wordType: 'other' },
        { word: 'administration', englishMeaning: 'management', difficulty: 'advanced', frequency: 19, wordType: 'noun' },
        { word: 'representative', englishMeaning: 'typical example', difficulty: 'advanced', frequency: 20, wordType: 'adjective' }
      ]
    },
    spanish: {
      beginner: [
        { word: 'el', englishMeaning: 'the (masculine)', difficulty: 'beginner', frequency: 1, wordType: 'other' },
        { word: 'la', englishMeaning: 'the (feminine)', difficulty: 'beginner', frequency: 2, wordType: 'other' },
        { word: 'yo', englishMeaning: 'I', difficulty: 'beginner', frequency: 3, wordType: 'other' },
        { word: 'tú', englishMeaning: 'you', difficulty: 'beginner', frequency: 4, wordType: 'other' },
        { word: 'él', englishMeaning: 'he', difficulty: 'beginner', frequency: 5, wordType: 'other' },
        { word: 'ella', englishMeaning: 'she', difficulty: 'beginner', frequency: 6, wordType: 'other' },
        { word: 'ser', englishMeaning: 'to be (permanent)', difficulty: 'beginner', frequency: 7, wordType: 'verb' },
        { word: 'estar', englishMeaning: 'to be (temporary)', difficulty: 'beginner', frequency: 8, wordType: 'verb' },
        { word: 'tener', englishMeaning: 'to have', difficulty: 'beginner', frequency: 9, wordType: 'verb' },
        { word: 'hacer', englishMeaning: 'to do/make', difficulty: 'beginner', frequency: 10, wordType: 'verb' }
      ],
      intermediate: [
        { word: 'porque', englishMeaning: 'because', difficulty: 'intermediate', frequency: 11, wordType: 'other' },
        { word: 'durante', englishMeaning: 'during', difficulty: 'intermediate', frequency: 12, wordType: 'other' },
        { word: 'después', englishMeaning: 'after', difficulty: 'intermediate', frequency: 13, wordType: 'other' },
        { word: 'antes', englishMeaning: 'before', difficulty: 'intermediate', frequency: 14, wordType: 'other' },
        { word: 'mientras', englishMeaning: 'while', difficulty: 'intermediate', frequency: 15, wordType: 'other' }
      ],
      advanced: [
        { word: 'desarrollar', englishMeaning: 'to develop', difficulty: 'advanced', frequency: 16, wordType: 'verb' },
        { word: 'establecer', englishMeaning: 'to establish', difficulty: 'advanced', frequency: 17, wordType: 'verb' },
        { word: 'representar', englishMeaning: 'to represent', difficulty: 'advanced', frequency: 18, wordType: 'verb' },
        { word: 'caracterizar', englishMeaning: 'to characterize', difficulty: 'advanced', frequency: 19, wordType: 'verb' },
        { word: 'considerar', englishMeaning: 'to consider', difficulty: 'advanced', frequency: 20, wordType: 'verb' }
      ]
    },
    french: {
      beginner: [
        { word: 'le', englishMeaning: 'the (masculine)', difficulty: 'beginner', frequency: 1, wordType: 'other' },
        { word: 'la', englishMeaning: 'the (feminine)', difficulty: 'beginner', frequency: 2, wordType: 'other' },
        { word: 'je', englishMeaning: 'I', difficulty: 'beginner', frequency: 3, wordType: 'other' },
        { word: 'tu', englishMeaning: 'you', difficulty: 'beginner', frequency: 4, wordType: 'other' },
        { word: 'il', englishMeaning: 'he', difficulty: 'beginner', frequency: 5, wordType: 'other' },
        { word: 'elle', englishMeaning: 'she', difficulty: 'beginner', frequency: 6, wordType: 'other' },
        { word: 'être', englishMeaning: 'to be', difficulty: 'beginner', frequency: 7, wordType: 'verb' },
        { word: 'avoir', englishMeaning: 'to have', difficulty: 'beginner', frequency: 8, wordType: 'verb' },
        { word: 'faire', englishMeaning: 'to do/make', difficulty: 'beginner', frequency: 9, wordType: 'verb' },
        { word: 'dire', englishMeaning: 'to say', difficulty: 'beginner', frequency: 10, wordType: 'verb' }
      ],
      intermediate: [
        { word: 'parce que', englishMeaning: 'because', difficulty: 'intermediate', frequency: 11, wordType: 'other' },
        { word: 'pendant', englishMeaning: 'during', difficulty: 'intermediate', frequency: 12, wordType: 'other' },
        { word: 'après', englishMeaning: 'after', difficulty: 'intermediate', frequency: 13, wordType: 'other' },
        { word: 'avant', englishMeaning: 'before', difficulty: 'intermediate', frequency: 14, wordType: 'other' },
        { word: 'tandis que', englishMeaning: 'while', difficulty: 'intermediate', frequency: 15, wordType: 'other' }
      ],
      advanced: [
        { word: 'développer', englishMeaning: 'to develop', difficulty: 'advanced', frequency: 16, wordType: 'verb' },
        { word: 'établir', englishMeaning: 'to establish', difficulty: 'advanced', frequency: 17, wordType: 'verb' },
        { word: 'représenter', englishMeaning: 'to represent', difficulty: 'advanced', frequency: 18, wordType: 'verb' },
        { word: 'caractériser', englishMeaning: 'to characterize', difficulty: 'advanced', frequency: 19, wordType: 'verb' },
        { word: 'considérer', englishMeaning: 'to consider', difficulty: 'advanced', frequency: 20, wordType: 'verb' }
      ]
    }
  };

  static async getWordFrequencyData(language: string): Promise<WordFrequencyData> {
    const normalizedLanguage = language.toLowerCase();
    const languagePool = this.COMPREHENSIVE_WORD_POOLS[normalizedLanguage as keyof typeof this.COMPREHENSIVE_WORD_POOLS];
    
    if (!languagePool) {
      console.warn(`[EnhancedWordFrequency] No word pool for language: ${language}`);
      return {
        top1k: ['the', 'be', 'to', 'of', 'and'],
        top3k: ['the', 'be', 'to', 'of', 'and'],
        top5k: ['the', 'be', 'to', 'of', 'and'],
        top10k: ['the', 'be', 'to', 'of', 'and']
      };
    }

    const allWords = [
      ...(languagePool.beginner || []),
      ...(languagePool.intermediate || []),
      ...(languagePool.advanced || [])
    ];

    const wordList = allWords.map(w => w.word);
    
    return {
      top1k: wordList.slice(0, Math.min(1000, wordList.length)),
      top3k: wordList.slice(0, Math.min(3000, wordList.length)),
      top5k: wordList.slice(0, Math.min(5000, wordList.length)),
      top10k: wordList
    };
  }

  static clearSessionData(language?: string): void {
    if (language) {
      this.sessionStats.delete(language);
      console.log(`[EnhancedWordFrequency] Cleared session data for ${language}`);
    } else {
      this.sessionStats.clear();
      console.log('[EnhancedWordFrequency] Cleared all session data');
    }
  }

  static async selectWordsForDifficulty(options: WordSelectionOptions): Promise<WordSelectionResult> {
    const { language, difficulty, count, excludeWords, maxRepetitions = 2 } = options;
    
    console.log(`[EnhancedWordFrequency] Selecting ${count} ${difficulty} words for ${language}`);
    
    try {
      // Get comprehensive word pool
      const wordPool = this.getComprehensiveWordPool(language, difficulty);
      
      // Filter out excluded words and apply repetition limits
      const availableWords = wordPool
        .filter(wordData => !excludeWords.some(excluded => 
          excluded.toLowerCase() === wordData.word.toLowerCase()
        ))
        .sort(() => Math.random() - 0.5); // Randomize

      // Select words ensuring variety
      const selectedWords = this.selectDiverseWords(availableWords, count, maxRepetitions);

      const selectionQuality = this.calculateSelectionQuality(selectedWords, wordPool);

      return {
        words: selectedWords.map(w => w.word),
        metadata: {
          source: 'enhanced_comprehensive_pool',
          selectionQuality,
          difficultyLevel: difficulty,
          totalAvailable: availableWords.length
        }
      };
    } catch (error) {
      console.error('[EnhancedWordFrequency] Error selecting words:', error);
      return this.getFallbackSelection(language, difficulty, count, excludeWords);
    }
  }

  static getWordMeaning(language: string, word: string): string {
    const normalizedLanguage = language.toLowerCase();
    const languagePool = this.COMPREHENSIVE_WORD_POOLS[normalizedLanguage as keyof typeof this.COMPREHENSIVE_WORD_POOLS];
    
    if (!languagePool) return word;

    // Search across all difficulty levels
    for (const difficulty of ['beginner', 'intermediate', 'advanced'] as const) {
      const wordData = languagePool[difficulty]?.find(w => 
        w.word.toLowerCase() === word.toLowerCase()
      );
      if (wordData) {
        return wordData.englishMeaning;
      }
    }

    return word; // Fallback to word itself if meaning not found
  }

  private static getComprehensiveWordPool(language: string, difficulty: DifficultyLevel): WordWithMeaning[] {
    const normalizedLanguage = language.toLowerCase();
    const languagePool = this.COMPREHENSIVE_WORD_POOLS[normalizedLanguage as keyof typeof this.COMPREHENSIVE_WORD_POOLS];
    
    if (!languagePool) {
      console.warn(`[EnhancedWordFrequency] No word pool for language: ${language}`);
      return [];
    }

    // Include words from current difficulty and below for progressive learning
    let words: WordWithMeaning[] = [];
    
    if (difficulty === 'advanced') {
      words = [
        ...(languagePool.beginner || []).map(w => ({ 
          ...w, 
          difficulty: 'beginner' as DifficultyLevel,
          wordType: w.wordType as 'noun' | 'verb' | 'adjective' | 'other'
        })),
        ...(languagePool.intermediate || []).map(w => ({ 
          ...w, 
          difficulty: 'intermediate' as DifficultyLevel,
          wordType: w.wordType as 'noun' | 'verb' | 'adjective' | 'other'
        })),
        ...(languagePool.advanced || []).map(w => ({ 
          ...w, 
          difficulty: 'advanced' as DifficultyLevel,
          wordType: w.wordType as 'noun' | 'verb' | 'adjective' | 'other'
        }))
      ];
    } else if (difficulty === 'intermediate') {
      words = [
        ...(languagePool.beginner || []).map(w => ({ 
          ...w, 
          difficulty: 'beginner' as DifficultyLevel,
          wordType: w.wordType as 'noun' | 'verb' | 'adjective' | 'other'
        })),
        ...(languagePool.intermediate || []).map(w => ({ 
          ...w, 
          difficulty: 'intermediate' as DifficultyLevel,
          wordType: w.wordType as 'noun' | 'verb' | 'adjective' | 'other'
        }))
      ];
    } else {
      words = (languagePool.beginner || []).map(w => ({ 
        ...w, 
        difficulty: 'beginner' as DifficultyLevel,
        wordType: w.wordType as 'noun' | 'verb' | 'adjective' | 'other'
      }));
    }

    return words;
  }

  private static selectDiverseWords(
    availableWords: WordWithMeaning[], 
    count: number, 
    maxRepetitions: number
  ): WordWithMeaning[] {
    const selected: WordWithMeaning[] = [];
    const typeCount: Record<string, number> = {};

    // First pass: Select diverse word types
    for (const wordData of availableWords) {
      if (selected.length >= count) break;
      
      const currentTypeCount = typeCount[wordData.wordType] || 0;
      if (currentTypeCount < maxRepetitions) {
        selected.push(wordData);
        typeCount[wordData.wordType] = currentTypeCount + 1;
      }
    }

    // Second pass: Fill remaining slots if needed
    if (selected.length < count) {
      for (const wordData of availableWords) {
        if (selected.length >= count) break;
        if (!selected.includes(wordData)) {
          selected.push(wordData);
        }
      }
    }

    return selected.slice(0, count);
  }

  private static calculateSelectionQuality(selected: WordWithMeaning[], pool: WordWithMeaning[]): number {
    if (selected.length === 0) return 0;
    
    const typeVariety = new Set(selected.map(w => w.wordType)).size;
    const maxTypes = Math.min(4, new Set(pool.map(w => w.wordType)).size);
    const varietyScore = (typeVariety / maxTypes) * 50;
    
    const frequencyScore = selected.reduce((sum, word) => sum + (100 - word.frequency), 0) / selected.length;
    
    return Math.min(100, Math.round(varietyScore + frequencyScore * 0.5));
  }

  private static getFallbackSelection(
    language: string, 
    difficulty: DifficultyLevel, 
    count: number, 
    excludeWords: string[]
  ): WordSelectionResult {
    const fallbackWords = ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it'];
    const available = fallbackWords.filter(w => !excludeWords.includes(w));
    
    return {
      words: available.slice(0, count),
      metadata: {
        source: 'fallback_selection',
        selectionQuality: 40,
        difficultyLevel: difficulty,
        totalAvailable: available.length
      }
    };
  }

  static getSessionStats(language: string): any {
    return this.sessionStats.get(language) || {
      wordsUsed: 0,
      typeDistribution: {},
      averageQuality: 0
    };
  }

  static updateSessionStats(language: string, words: string[], quality: number): void {
    const current = this.getSessionStats(language);
    
    this.sessionStats.set(language, {
      wordsUsed: current.wordsUsed + words.length,
      typeDistribution: current.typeDistribution,
      averageQuality: Math.round((current.averageQuality + quality) / 2)
    });
  }
}
