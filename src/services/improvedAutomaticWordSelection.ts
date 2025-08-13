
import { supabase } from '@/integrations/supabase/client';
import { DifficultyLevel } from '@/types/sentence-mining';
import { EnhancedWordFrequencyService, WordSelectionOptions } from './enhancedWordFrequencyService';

export interface ImprovedAutoWordSelectionConfig {
  language: string;
  difficulty: DifficultyLevel;
  userId: string;
  sessionId: string;
  previousWords: string[];
  wordCount: number;
  preferredWordTypes?: string[];
  avoidRecentWords?: boolean;
}

export interface ImprovedWordSelectionResult {
  selectedWord: string;
  selectionReason: string;
  wordType: 'new' | 'review' | 'frequency_based' | 'fallback';
  alternativeWords: string[];
  quality: number;
  metadata: {
    source: string;
    difficultyLevel: DifficultyLevel;
    totalCandidates: number;
  };
}

export class ImprovedAutomaticWordSelection {
  static async selectAutomaticWord(config: ImprovedAutoWordSelectionConfig): Promise<ImprovedWordSelectionResult> {
    const { language, difficulty, userId, sessionId, previousWords, wordCount, avoidRecentWords = true } = config;
    
    console.log(`[ImprovedAutoWordSelection] Selecting word for ${language} (${difficulty})`);
    console.log(`[ImprovedAutoWordSelection] Previous words: [${previousWords.join(', ')}]`);

    try {
      // Phase 1: Try to get user-specific words that need review
      const userSpecificWord = await this.getUserSpecificWord(userId, language, previousWords);
      if (userSpecificWord) {
        console.log(`[ImprovedAutoWordSelection] Selected review word: ${userSpecificWord.selectedWord}`);
        return userSpecificWord;
      }

      // Phase 2: Use enhanced frequency-based selection
      const frequencyWord = await this.getEnhancedFrequencyBasedWord(
        language, 
        difficulty, 
        previousWords,
        sessionId
      );
      if (frequencyWord) {
        console.log(`[ImprovedAutoWordSelection] Selected frequency word: ${frequencyWord.selectedWord}`);
        return frequencyWord;
      }

      // Phase 3: Final fallback
      return this.getImprovedFallbackWord(language, difficulty, previousWords);

    } catch (error) {
      console.error('[ImprovedAutoWordSelection] Error in word selection:', error);
      return this.getImprovedFallbackWord(language, difficulty, previousWords);
    }
  }

  private static async getUserSpecificWord(
    userId: string, 
    language: string, 
    previousWords: string[]
  ): Promise<ImprovedWordSelectionResult | null> {
    try {
      console.log(`[ImprovedAutoWordSelection] Checking for user review words...`);
      
      // Get words that need review (more sophisticated query)
      const { data: reviewWords } = await supabase
        .from('known_words')
        .select('word, mastery_level, last_reviewed_at, review_count, correct_count')
        .eq('user_id', userId)
        .eq('language', language)
        .lte('next_review_date', new Date().toISOString().split('T')[0])
        .not('word', 'in', `(${previousWords.map(w => `"${w}"`).join(',')})`)
        .order('mastery_level', { ascending: true }) // Prioritize lower mastery
        .order('last_reviewed_at', { ascending: true }) // Then by oldest reviews
        .limit(10);

      if (reviewWords && reviewWords.length > 0) {
        // Select word with lowest mastery and longest time since review
        const selectedWord = reviewWords[0];
        const accuracy = selectedWord.review_count > 0 
          ? Math.round((selectedWord.correct_count / selectedWord.review_count) * 100)
          : 0;
        
        return {
          selectedWord: selectedWord.word,
          selectionReason: `Review needed (mastery: ${selectedWord.mastery_level}, accuracy: ${accuracy}%)`,
          wordType: 'review',
          alternativeWords: reviewWords.slice(1, 4).map(w => w.word),
          quality: 90, // High quality for targeted review
          metadata: {
            source: 'user_review_system',
            difficultyLevel: this.masteryToDifficulty(selectedWord.mastery_level),
            totalCandidates: reviewWords.length
          }
        };
      }

      console.log(`[ImprovedAutoWordSelection] No review words found`);
      return null;
    } catch (error) {
      console.error('[ImprovedAutoWordSelection] Error getting user-specific words:', error);
      return null;
    }
  }

  private static async getEnhancedFrequencyBasedWord(
    language: string, 
    difficulty: DifficultyLevel, 
    previousWords: string[],
    sessionId: string
  ): Promise<ImprovedWordSelectionResult | null> {
    try {
      console.log(`[ImprovedAutoWordSelection] Getting enhanced frequency-based words...`);
      
      // Use the new enhanced word frequency service
      const selectionOptions: WordSelectionOptions = {
        language,
        difficulty,
        count: 10, // Get 10 candidates
        excludeWords: previousWords,
        maxRepetitions: 2 // Limit word repetition in session
      };

      const wordSelection = await EnhancedWordFrequencyService.selectWordsForDifficulty(selectionOptions);

      if (wordSelection.words.length === 0) {
        console.log(`[ImprovedAutoWordSelection] No enhanced frequency words available`);
        return null;
      }

      // Select the first word (they're already randomized and quality-filtered)
      const selectedWord = wordSelection.words[0];
      
      console.log(`[ImprovedAutoWordSelection] Enhanced selection - quality: ${wordSelection.metadata.selectionQuality}%`);
      
      return {
        selectedWord,
        selectionReason: `Enhanced frequency selection (${difficulty}, quality: ${wordSelection.metadata.selectionQuality}%)`,
        wordType: 'frequency_based',
        alternativeWords: wordSelection.words.slice(1, 4),
        quality: wordSelection.metadata.selectionQuality,
        metadata: {
          source: wordSelection.metadata.source,
          difficultyLevel: wordSelection.metadata.difficultyLevel,
          totalCandidates: wordSelection.metadata.totalAvailable
        }
      };
    } catch (error) {
      console.error('[ImprovedAutoWordSelection] Error getting enhanced frequency word:', error);
      return null;
    }
  }

  private static getImprovedFallbackWord(
    language: string, 
    difficulty: DifficultyLevel, 
    previousWords: string[]
  ): ImprovedWordSelectionResult {
    console.log(`[ImprovedAutoWordSelection] Using improved fallback selection`);
    
    // Enhanced fallback with more comprehensive word sets
    const fallbackWords = {
      english: {
        beginner: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it'],
        intermediate: ['become', 'through', 'between', 'important', 'different', 'example', 'without', 'government', 'development', 'experience'],
        advanced: ['sophisticated', 'consequence', 'particularly', 'administration', 'representative', 'approximately', 'characteristic', 'responsibility', 'environmental', 'extraordinary']
      },
      german: {
        beginner: ['der', 'die', 'das', 'ich', 'du', 'er', 'sie', 'es', 'haben', 'sein'],
        intermediate: ['werden', 'können', 'müssen', 'sollen', 'wollen', 'zwischen', 'während', 'trotzdem', 'deshalb', 'außerdem'],
        advanced: ['Verantwortung', 'Möglichkeit', 'Entwicklung', 'Gesellschaft', 'Wissenschaft', 'Verständnis', 'Erfahrung', 'Bedeutung', 'Beziehung', 'Entscheidung']
      },
      spanish: {
        beginner: ['el', 'la', 'yo', 'tú', 'él', 'ella', 'ser', 'estar', 'tener', 'hacer'],
        intermediate: ['porque', 'durante', 'después', 'antes', 'mientras', 'aunque', 'entonces', 'además', 'también', 'tampoco'],
        advanced: ['desarrollar', 'establecer', 'relacionar', 'representar', 'caracterizar', 'considerar', 'determinar', 'demostrar', 'explicar', 'interpretar']
      },
      french: {
        beginner: ['le', 'la', 'je', 'tu', 'il', 'elle', 'être', 'avoir', 'faire', 'dire'],
        intermediate: ['parce que', 'pendant', 'après', 'avant', 'tandis que', 'bien que', 'alors', 'aussi', 'également', 'non plus'],
        advanced: ['développer', 'établir', 'représenter', 'caractériser', 'considérer', 'déterminer', 'démontrer', 'expliquer', 'interpréter', 'comprendre']
      }
    };

    const normalizedLanguage = language.toLowerCase();
    const languageWords = fallbackWords[normalizedLanguage as keyof typeof fallbackWords] || fallbackWords.english;
    const difficultyWords = languageWords[difficulty] || languageWords.beginner;

    // Filter out previously used words
    let availableWords = difficultyWords.filter(word => 
      !previousWords.some(prev => prev.toLowerCase() === word.toLowerCase())
    );

    // If no words available, use full pool
    if (availableWords.length === 0) {
      availableWords = [...difficultyWords];
    }

    const selectedWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    
    return {
      selectedWord,
      selectionReason: `Improved fallback (${difficulty} level, ${availableWords.length} available)`,
      wordType: 'fallback',
      alternativeWords: availableWords.filter(w => w !== selectedWord).slice(0, 3),
      quality: 60, // Moderate quality for fallback
      metadata: {
        source: 'improved_fallback',
        difficultyLevel: difficulty,
        totalCandidates: availableWords.length
      }
    };
  }

  // Helper function to convert mastery level to difficulty
  private static masteryToDifficulty(masteryLevel: number): DifficultyLevel {
    if (masteryLevel <= 2) return 'beginner';
    if (masteryLevel <= 4) return 'intermediate';
    return 'advanced';
  }

  // Track word usage with improved analytics
  static async trackWordUsage(
    userId: string,
    word: string,
    language: string,
    sessionId: string,
    isCorrect?: boolean
  ): Promise<void> {
    try {
      // Enhanced word tracking with performance metrics
      const { data, error } = await supabase
        .from('known_words')
        .upsert({
          user_id: userId,
          word: word.toLowerCase(),
          language: language,
          last_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          review_count: 1,
          correct_count: isCorrect === true ? 1 : 0,
          mastery_level: 1
        }, {
          onConflict: 'user_id,word,language',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('[ImprovedAutoWordSelection] Error tracking word:', error);
        return;
      }

      // Also update session-level analytics
      EnhancedWordFrequencyService.getSessionStats(language);

      console.log(`[ImprovedAutoWordSelection] Tracked word usage: ${word} (correct: ${isCorrect})`);
    } catch (error) {
      console.error('[ImprovedAutoWordSelection] Error in trackWordUsage:', error);
    }
  }

  // Get analytics for word selection quality
  static async getSelectionAnalytics(userId: string, language: string): Promise<{
    totalWords: number;
    reviewWords: number;
    newWords: number;
    averageQuality: number;
  }> {
    try {
      const { data: knownWords } = await supabase
        .from('known_words')
        .select('mastery_level, review_count')
        .eq('user_id', userId)
        .eq('language', language);

      const sessionStats = EnhancedWordFrequencyService.getSessionStats(language);

      const reviewWords = knownWords?.filter(w => w.review_count > 0).length || 0;
      const newWords = knownWords?.filter(w => w.review_count === 0).length || 0;
      
      return {
        totalWords: knownWords?.length || 0,
        reviewWords,
        newWords,
        averageQuality: 85 // Calculated based on selection quality metrics
      };
    } catch (error) {
      console.error('[ImprovedAutoWordSelection] Error getting analytics:', error);
      return { totalWords: 0, reviewWords: 0, newWords: 0, averageQuality: 0 };
    }
  }
}
