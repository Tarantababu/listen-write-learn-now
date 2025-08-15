
import { DifficultyLevel } from '@/types/sentence-mining';

export interface WordSelectionOptions {
  language: string;
  difficulty: DifficultyLevel;
  count: number;
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
    difficultyLevel?: DifficultyLevel;
  };
}

interface WordFrequencyData {
  top1k: string[];
  top3k: string[];
  top5k: string[];
  top10k: string[];
}

interface SessionData {
  totalExercises: number;
  correctAnswers: number;
  lastAccessed: number;
  wordUsage?: Record<string, { count: number; correct: number; lastUsed: number }>;
}

export class EnhancedWordFrequencyService {
  private static sessionData: Record<string, SessionData> = {};
  private static wordFrequencyCache: Record<string, WordFrequencyData> = {};

  private static generateWordPool(language: string, difficulty: DifficultyLevel): string[] {
    const pools = {
      german: {
        beginner: ['der', 'die', 'das', 'und', 'ich', 'bin', 'haben', 'sein', 'gehen', 'gut', 'neu', 'groß', 'klein', 'Zeit', 'Jahr', 'Tag', 'Haus', 'Mann', 'Frau', 'Kind'],
        intermediate: ['jedoch', 'während', 'dadurch', 'trotzdem', 'beispielsweise', 'möglich', 'wichtig', 'schwierig', 'einfach', 'bekannt', 'verschieden', 'besonders', 'natürlich', 'wahrscheinlich', 'eigentlich'],
        advanced: ['nichtsdestotrotz', 'diesbezüglich', 'hinsichtlich', 'entsprechend', 'ausschließlich', 'gegebenenfalls', 'möglicherweise', 'ausnahmsweise', 'selbstverständlich', 'unverzüglich']
      },
      english: {
        beginner: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this'],
        intermediate: ['however', 'therefore', 'although', 'because', 'through', 'during', 'without', 'between', 'among', 'within', 'toward', 'upon', 'beneath', 'beyond', 'throughout'],
        advanced: ['nevertheless', 'consequently', 'furthermore', 'moreover', 'notwithstanding', 'inadvertently', 'substantiate', 'corroborate', 'exemplify', 'elucidate']
      },
      spanish: {
        beginner: ['el', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al'],
        intermediate: ['aunque', 'mientras', 'durante', 'través', 'además', 'entonces', 'después', 'antes', 'siempre', 'nunca', 'todavía', 'también', 'solamente', 'especialmente'],
        advanced: ['consecuentemente', 'principalmente', 'generalmente', 'particularmente', 'específicamente', 'constantemente', 'frecuentemente', 'simultáneamente', 'excepcionalmente']
      },
      french: {
        beginner: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se'],
        intermediate: ['cependant', 'néanmoins', 'toutefois', 'pourtant', 'alors', 'ensuite', 'puis', 'maintenant', 'toujours', 'jamais', 'souvent', 'parfois', 'quelquefois'],
        advanced: ['néanmoins', 'conséquemment', 'particulièrement', 'spécifiquement', 'généralement', 'habituellement', 'exceptionnellement', 'simultanément', 'consécutivement']
      }
    };

    return pools[language as keyof typeof pools]?.[difficulty] || pools.english[difficulty] || pools.english.beginner;
  }

  static async getWordFrequencyData(language: string): Promise<WordFrequencyData> {
    console.log(`[EnhancedWordFrequencyService] Getting word frequency data for ${language}`);
    
    if (this.wordFrequencyCache[language]) {
      return this.wordFrequencyCache[language];
    }

    try {
      // Generate comprehensive word pools for each tier
      const beginnerWords = this.generateWordPool(language, 'beginner');
      const intermediateWords = this.generateWordPool(language, 'intermediate');
      const advancedWords = this.generateWordPool(language, 'advanced');

      // Create tiered lists with proper overlap
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
      console.log(`[EnhancedWordFrequencyService] Cached word data for ${language}: ${top1k.length}/${top3k.length}/${top5k.length}/${top10k.length} words`);
      
      return wordData;
    } catch (error) {
      console.error(`[EnhancedWordFrequencyService] Error getting word data:`, error);
      
      // Emergency fallback
      const emergency = this.getEmergencyWordPool(language);
      return {
        top1k: emergency,
        top3k: emergency,
        top5k: emergency,
        top10k: emergency
      };
    }
  }

  private static getEmergencyWordPool(language: string): string[] {
    const emergency = {
      german: ['der', 'die', 'das', 'ich', 'und'],
      english: ['the', 'a', 'an', 'this', 'that'],
      spanish: ['el', 'la', 'un', 'una', 'y'],
      french: ['le', 'la', 'un', 'une', 'et']
    };
    
    return emergency[language as keyof typeof emergency] || emergency.english;
  }

  static getEmergencyFallbackWords(language: string): string[] {
    return this.getEmergencyWordPool(language);
  }

  static async selectWordsForDifficulty(options: WordSelectionOptions): Promise<WordSelectionResult> {
    console.log(`[EnhancedWordFrequencyService] Selecting ${options.count} words for ${options.language} (${options.difficulty})`);
    
    try {
      const wordData = await this.getWordFrequencyData(options.language);
      const excludeWords = (options.excludeWords || []).map(w => w.toLowerCase());
      
      // Select appropriate word pool based on difficulty
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

      // Filter out excluded words
      const availableWords = wordPool.filter(word => 
        !excludeWords.includes(word.toLowerCase())
      );

      if (availableWords.length === 0) {
        console.warn('[EnhancedWordFrequencyService] No available words after filtering, using emergency fallback');
        const emergency = this.getEmergencyWordPool(options.language);
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

      // Select words with some randomization for variety
      const selectedWords: string[] = [];
      const shuffled = [...availableWords].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < Math.min(options.count, shuffled.length); i++) {
        selectedWords.push(shuffled[i]);
      }

      // Calculate quality metrics
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
      
      const emergency = this.getEmergencyWordPool(options.language);
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

  static getSessionStats(language: string): SessionData {
    return this.getSessionData(language);
  }

  static clearSessionData(language?: string): void {
    if (language) {
      delete this.sessionData[language];
      delete this.wordFrequencyCache[language];
      console.log(`[EnhancedWordFrequencyService] Cleared session data for ${language}`);
    } else {
      this.sessionData = {};
      this.wordFrequencyCache = {};
      console.log('[EnhancedWordFrequencyService] Cleared all session data');
    }
  }

  static getWordMeaning(language: string, word: string): string {
    // Simple meaning lookup - in production this would be more sophisticated
    const meanings: Record<string, Record<string, string>> = {
      german: {
        'der': 'the (masculine)',
        'die': 'the (feminine)',
        'das': 'the (neuter)',
        'ich': 'I',
        'und': 'and'
      },
      english: {
        'the': 'definite article',
        'a': 'indefinite article',
        'an': 'indefinite article',
        'this': 'demonstrative pronoun',
        'that': 'demonstrative pronoun'
      }
    };

    return meanings[language]?.[word.toLowerCase()] || word;
  }

  static trackWordUsage(
    userId: string,
    word: string,
    language: string,
    sessionId: string,
    isCorrect?: boolean
  ): void {
    console.log(`[EnhancedWordFrequencyService] Tracking word usage: ${word} (${isCorrect ? 'correct' : 'incorrect'})`);
    
    try {
      // Store word usage in session data for tracking
      const sessionData = this.getSessionData(language);
      if (!sessionData.wordUsage) {
        sessionData.wordUsage = {};
      }
      
      if (!sessionData.wordUsage[word]) {
        sessionData.wordUsage[word] = { count: 0, correct: 0, lastUsed: Date.now() };
      }
      
      sessionData.wordUsage[word].count++;
      if (isCorrect) {
        sessionData.wordUsage[word].correct++;
      }
      sessionData.wordUsage[word].lastUsed = Date.now();
      
      // Update session stats
      sessionData.totalExercises = (sessionData.totalExercises || 0) + 1;
      if (isCorrect) {
        sessionData.correctAnswers = (sessionData.correctAnswers || 0) + 1;
      }
      
      console.log(`[EnhancedWordFrequencyService] Word usage tracked for ${word}`);
    } catch (error) {
      console.error('[EnhancedWordFrequencyService] Error tracking word usage:', error);
    }
  }
}
