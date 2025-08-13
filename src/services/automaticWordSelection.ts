
import { supabase } from '@/integrations/supabase/client';
import { DifficultyLevel } from '@/types/sentence-mining';
import { WordFrequencyService } from './wordFrequencyService';

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
  static async selectAutomaticWord(config: AutoWordSelectionConfig): Promise<WordSelectionResult> {
    const { language, difficulty, userId, sessionId, previousWords, wordCount } = config;
    
    console.log(`[AutoWordSelection] Selecting word for ${language} (${difficulty}), avoiding: [${previousWords.join(', ')}]`);

    try {
      // Try to get user-specific words first (words that need review)
      const userSpecificWord = await this.getUserSpecificWord(userId, language, previousWords);
      if (userSpecificWord) {
        return userSpecificWord;
      }

      // Fall back to frequency-based selection using the new word frequency service
      const frequencyWord = await this.getFrequencyBasedWord(language, difficulty, previousWords);
      if (frequencyWord) {
        return frequencyWord;
      }

      // Final fallback to simple random selection
      return this.getFallbackWord(language, difficulty, previousWords);

    } catch (error) {
      console.error('[AutoWordSelection] Error in word selection:', error);
      return this.getFallbackWord(language, difficulty, previousWords);
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
    try {
      console.log(`[AutoWordSelection] Getting frequency-based words for ${language} (${difficulty})`);
      
      // Use the word frequency service to get appropriate words
      const words = await WordFrequencyService.getWordsForDifficulty(
        language, 
        difficulty, 
        10, // Get 10 candidates
        previousWords
      );

      if (words.length === 0) {
        console.log(`[AutoWordSelection] No frequency-based words available`);
        return null;
      }

      // Select the first word (they're already randomized)
      const selectedWord = words[0];
      
      console.log(`[AutoWordSelection] Selected frequency-based word: ${selectedWord}`);
      
      return {
        selectedWord,
        selectionReason: `Frequency-based selection (${difficulty} level, ${words.length} candidates)`,
        wordType: 'frequency_based',
        alternativeWords: words.slice(1, 4)
      };
    } catch (error) {
      console.error('[AutoWordSelection] Error getting frequency-based word:', error);
      return null;
    }
  }

  private static getFallbackWord(
    language: string, 
    difficulty: DifficultyLevel, 
    previousWords: string[]
  ): WordSelectionResult {
    // Simple fallback words by language
    const fallbackWords = {
      german: ['der', 'die', 'das', 'ich', 'du', 'er', 'sie', 'es', 'haben', 'sein'],
      spanish: ['el', 'la', 'yo', 'tú', 'él', 'ella', 'ser', 'estar', 'tener', 'hacer'],
      french: ['le', 'la', 'je', 'tu', 'il', 'elle', 'être', 'avoir', 'faire', 'aller'],
      italian: ['il', 'la', 'io', 'tu', 'lui', 'lei', 'essere', 'avere', 'fare', 'andare'],
      portuguese: ['o', 'a', 'eu', 'tu', 'ele', 'ela', 'ser', 'estar', 'ter', 'fazer']
    };

    const normalizedLanguage = language.toLowerCase();
    const wordPool = fallbackWords[normalizedLanguage as keyof typeof fallbackWords] || 
                     fallbackWords.german;

    // Filter out previously used words
    let availableWords = wordPool.filter(word => 
      !previousWords.some(prev => prev.toLowerCase() === word.toLowerCase())
    );

    // If no words available, use full pool
    if (availableWords.length === 0) {
      availableWords = [...wordPool];
    }

    const selectedWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    
    console.log(`[AutoWordSelection] Using fallback word: ${selectedWord}`);
    
    return {
      selectedWord,
      selectionReason: `Fallback selection (${availableWords.length} available)`,
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
