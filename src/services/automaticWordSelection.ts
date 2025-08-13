
import { supabase } from '@/integrations/supabase/client';
import { DifficultyLevel } from '@/types/sentence-mining';

export interface AutoWordSelectionConfig {
  language: string;
  difficulty: DifficultyLevel;
  userId: string;
  sessionId: string;
  previousWords: string[];
  wordCount: number;
}

export interface WordSelectionResult {
  selectedWord: string;
  selectionReason: string;
  wordType: 'new' | 'review' | 'common' | 'frequency_based';
  alternativeWords: string[];
}

export class AutomaticWordSelection {
  private static readonly WORD_POOLS = {
    beginner: {
      german: [
        'der', 'die', 'das', 'und', 'ich', 'sein', 'haben', 'werden', 'können', 'müssen',
        'sagen', 'machen', 'geben', 'kommen', 'sollen', 'wollen', 'gehen', 'wissen', 'sehen', 'lassen',
        'stehen', 'finden', 'bleiben', 'liegen', 'heißen', 'denken', 'nehmen', 'tun', 'dürfen', 'glauben',
        'halten', 'nennen', 'mögen', 'zeigen', 'führen', 'sprechen', 'bringen', 'leben', 'fahren', 'meinen'
      ],
      spanish: [
        'el', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no',
        'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al',
        'estar', 'tener', 'hacer', 'todo', 'ir', 'sobre', 'decir', 'uno', 'tiempo', 'muy',
        'cuando', 'él', 'donde', 'dar', 'más', 'sin', 'me', 'ya', 'saber', 'qué'
      ],
      french: [
        'le', 'de', 'un', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans',
        'ce', 'il', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'pouvoir',
        'son', 'une', 'su', 'nous', 'comme', 'vous', 'ils', 'bien', 'autre', 'après',
        'venir', 'savoir', 'temps', 'prendre', 'me', 'aller', 'petit', 'état', 'français', 'grand'
      ],
      italian: [
        'il', 'di', 'che', 'e', 'un', 'a', 'essere', 'da', 'in', 'per',
        'avere', 'tu', 'io', 'un', 'con', 'fare', 'su', 'dire', 'lei', 'mio',
        'quello', 'tutto', 'lei', 'ci', 'da', 'grande', 'work', 'state', 'well', 'may',
        'bene', 'dove', 'molto', 'bello', 'più', 'cosa', 'sapere', 'fare', 'tempo', 'vita'
      ]
    },
    intermediate: {
      german: [
        'jedoch', 'während', 'dadurch', 'trotzdem', 'beispielsweise', 'möglich', 'wichtig', 'verschieden',
        'besonders', 'einfach', 'wahrscheinlich', 'gesellschaftlich', 'allerdings', 'tatsächlich', 'schließlich',
        'außerdem', 'deswegen', 'normalerweise', 'eigentlich', 'natürlich', 'öffentlich', 'persönlich',
        'plötzlich', 'regelmäßig', 'zusätzlich', 'hauptsächlich', 'ursprünglich', 'offensichtlich', 'gelegentlich', 'ausschließlich'
      ],
      spanish: [
        'aunque', 'durante', 'mediante', 'embargo', 'ejemplo', 'posible', 'importante', 'diferente',
        'especial', 'sencillo', 'probable', 'social', 'realidad', 'general', 'además',
        'entonces', 'normalmente', 'realmente', 'naturalmente', 'público', 'personal',
        'repente', 'regular', 'adicional', 'principal', 'original', 'obvio', 'ocasional', 'exclusivo'
      ],
      french: [
        'cependant', 'pendant', 'grâce', 'pourtant', 'exemple', 'possible', 'important', 'différent',
        'spécial', 'simple', 'probable', 'social', 'réellement', 'général', 'ensuite',
        'puis', 'normalement', 'vraiment', 'naturellement', 'public', 'personnel',
        'soudain', 'régulier', 'supplémentaire', 'principal', 'original', 'évident', 'occasionnel', 'exclusif'
      ],
      italian: [
        'tuttavia', 'durante', 'tramite', 'però', 'esempio', 'possibile', 'importante', 'diverso',
        'speciale', 'semplice', 'probabile', 'sociale', 'davvero', 'generale', 'inoltre',
        'allora', 'normalmente', 'veramente', 'naturalmente', 'pubblico', 'personale',
        'improvviso', 'regolare', 'aggiuntivo', 'principale', 'originale', 'ovvio', 'occasionale', 'esclusivo'
      ]
    },
    advanced: {
      german: [
        'nichtsdestotrotz', 'diesbezüglich', 'hinsichtlich', 'entsprechend', 'beziehungsweise', 'gegebenenfalls',
        'dementsprechend', 'infolgedessen', 'gleichwohl', 'indessen', 'hingegen', 'inzwischen',
        'überdies', 'ferner', 'mithin', 'folglich', 'somit', 'demzufolge', 'demnach', 'daher',
        'zudem', 'außerdem', 'darüber', 'hinaus', 'gleichzeitig', 'währenddessen', 'indes', 'unterdessen'
      ],
      spanish: [
        'obstante', 'respecto', 'mediante', 'conforme', 'respectivamente', 'caso',
        'consecuencia', 'resultado', 'embargo', 'mientras', 'cambio', 'tanto',
        'además', 'asimismo', 'tanto', 'consiguiente', 'consecuencia', 'resultado', 'tanto', 'pues',
        'también', 'igualmente', 'encima', 'adelante', 'simultáneamente', 'mientras', 'tanto', 'entretanto'
      ],
      french: [
        'néanmoins', 'concernant', 'moyennant', 'conformément', 'respectivement', 'éventuellement',
        'conséquemment', 'suite', 'néanmoins', 'tandis', 'revanche', 'tant',
        'outre', 'également', 'tant', 'conséquent', 'conséquence', 'suite', 'tant', 'donc',
        'aussi', 'pareillement', 'dessus', 'avant', 'simultanément', 'pendant', 'tant', 'entretant'
      ],
      italian: [
        'nondimeno', 'riguardo', 'mediante', 'conformemente', 'rispettivamente', 'eventualmente',
        'conseguentemente', 'seguito', 'tuttavia', 'mentre', 'invece', 'tanto',
        'oltre', 'inoltre', 'tanto', 'conseguente', 'conseguenza', 'seguito', 'tanto', 'dunque',
        'anche', 'ugualmente', 'sopra', 'avanti', 'simultaneamente', 'durante', 'tanto', 'frattanto'
      ]
    }
  };

  static async selectAutomaticWord(config: AutoWordSelectionConfig): Promise<WordSelectionResult> {
    const { language, difficulty, userId, sessionId, previousWords, wordCount } = config;
    
    console.log(`[AutoWordSelection] Selecting word for ${language} (${difficulty}), avoiding: [${previousWords.join(', ')}]`);

    try {
      // Try to get user-specific words first
      const userSpecificWord = await this.getUserSpecificWord(userId, language, previousWords);
      if (userSpecificWord) {
        return userSpecificWord;
      }

      // Fall back to frequency-based selection
      const frequencyWord = await this.getFrequencyBasedWord(language, difficulty, previousWords);
      if (frequencyWord) {
        return frequencyWord;
      }

      // Final fallback to word pools
      return this.getPoolBasedWord(language, difficulty, previousWords);

    } catch (error) {
      console.error('[AutoWordSelection] Error in word selection:', error);
      return this.getPoolBasedWord(language, difficulty, previousWords);
    }
  }

  private static async getUserSpecificWord(
    userId: string, 
    language: string, 
    previousWords: string[]
  ): Promise<WordSelectionResult | null> {
    try {
      // Get words that need review
      const { data: reviewWords } = await supabase
        .from('known_words')
        .select('word, mastery_level, last_reviewed_at')
        .eq('user_id', userId)
        .eq('language', language)
        .lte('next_review_date', new Date().toISOString().split('T')[0])
        .not('word', 'in', `(${previousWords.map(w => `"${w}"`).join(',')})`)
        .order('mastery_level', { ascending: true })
        .order('last_reviewed_at', { ascending: true })
        .limit(5);

      if (reviewWords && reviewWords.length > 0) {
        const selectedWord = reviewWords[0];
        return {
          selectedWord: selectedWord.word,
          selectionReason: `Review word (mastery level ${selectedWord.mastery_level})`,
          wordType: 'review',
          alternativeWords: reviewWords.slice(1, 4).map(w => w.word)
        };
      }

      return null;
    } catch (error) {
      console.error('[AutoWordSelection] Error getting user-specific words:', error);
      return null;
    }
  }

  private static async getFrequencyBasedWord(
    language: string, 
    difficulty: DifficultyLevel, 
    previousWords: string[]
  ): Promise<WordSelectionResult | null> {
    const normalizedLanguage = language.toLowerCase();
    const wordPool = this.WORD_POOLS[difficulty]?.[normalizedLanguage as keyof typeof this.WORD_POOLS['beginner']];
    
    if (!wordPool) return null;

    // Filter out previously used words
    const availableWords = wordPool.filter(word => 
      !previousWords.some(prev => prev.toLowerCase() === word.toLowerCase())
    );

    if (availableWords.length === 0) {
      // If all words used, reset and use full pool
      const randomWord = wordPool[Math.floor(Math.random() * wordPool.length)];
      return {
        selectedWord: randomWord,
        selectionReason: 'Frequency-based selection (pool reset)',
        wordType: 'frequency_based',
        alternativeWords: wordPool.filter(w => w !== randomWord).slice(0, 3)
      };
    }

    // Select from available words
    const selectedWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    
    return {
      selectedWord,
      selectionReason: `Frequency-based selection from ${difficulty} pool`,
      wordType: 'frequency_based',
      alternativeWords: availableWords.filter(w => w !== selectedWord).slice(0, 3)
    };
  }

  private static getPoolBasedWord(
    language: string, 
    difficulty: DifficultyLevel, 
    previousWords: string[]
  ): WordSelectionResult {
    const normalizedLanguage = language.toLowerCase();
    let wordPool = this.WORD_POOLS[difficulty]?.[normalizedLanguage as keyof typeof this.WORD_POOLS['beginner']];
    
    // Fallback to beginner if difficulty not found
    if (!wordPool) {
      wordPool = this.WORD_POOLS.beginner[normalizedLanguage as keyof typeof this.WORD_POOLS['beginner']] || 
                 this.WORD_POOLS.beginner.german; // Ultimate fallback
    }

    // Filter out previously used words
    let availableWords = wordPool.filter(word => 
      !previousWords.some(prev => prev.toLowerCase() === word.toLowerCase())
    );

    // If no words available, use full pool
    if (availableWords.length === 0) {
      availableWords = [...wordPool];
    }

    const selectedWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    
    return {
      selectedWord,
      selectionReason: `Pool-based selection (${availableWords.length} available)`,
      wordType: 'common',
      alternativeWords: availableWords.filter(w => w !== selectedWord).slice(0, 3)
    };
  }

  static async trackWordUsage(
    userId: string,
    word: string,
    language: string,
    sessionId: string
  ): Promise<void> {
    try {
      // Track the word in known_words table
      await supabase
        .from('known_words')
        .upsert({
          user_id: userId,
          word: word.toLowerCase(),
          language: language,
          last_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          review_count: 1,
          correct_count: 0,
          mastery_level: 1
        }, {
          onConflict: 'user_id,word,language'
        });

      console.log(`[AutoWordSelection] Tracked word usage: ${word} for ${language}`);
    } catch (error) {
      console.error('[AutoWordSelection] Error tracking word usage:', error);
    }
  }
}
