
import { EnhancedWordFrequencyService, WordSelectionOptions, WordSelectionResult } from './enhancedWordFrequencyService';
import { DifficultyLevel } from '@/types/sentence-mining';

export interface ImprovedAutoWordSelectionConfig {
  language: string;
  difficulty: DifficultyLevel;
  userId: string;
  sessionId: string;
  previousWords: string[];
  wordCount: number;
  avoidRecentWords?: boolean;
}

export interface ImprovedWordSelectionResult {
  selectedWord: string;
  selectionReason: string;
  wordType: 'new' | 'review' | 'common' | 'frequency_based';
  alternativeWords: string[];
  quality?: number;
}

export interface EnhancedWordSelectionOptions extends WordSelectionOptions {
  userLevel?: string;
  previousWords?: string[];
  sessionContext?: any;
  targetWordCount?: number;
}

export interface EnhancedWordSelectionResult extends WordSelectionResult {
  recommendedNextDifficulty?: DifficultyLevel;
  learningInsights?: {
    strongAreas: string[];
    improvementAreas: string[];
    nextFocus: string;
  };
}

export class ImprovedAutomaticWordSelection {
  private static readonly DIFFICULTY_PROGRESSION = ['beginner', 'intermediate', 'advanced'] as const;
  
  // Add the missing selectAutomaticWord method
  static async selectAutomaticWord(config: ImprovedAutoWordSelectionConfig): Promise<ImprovedWordSelectionResult> {
    console.log(`[ImprovedAutomaticWordSelection] Selecting automatic word for ${config.language}`);
    
    try {
      const options: WordSelectionOptions = {
        language: config.language,
        difficulty: config.difficulty,
        count: config.wordCount || 1,
        excludeWords: config.previousWords || [],
        maxRepetitions: 2
      };

      const result = await EnhancedWordFrequencyService.selectWordsForDifficulty(options);
      
      if (result.words.length === 0) {
        return {
          selectedWord: 'the',
          selectionReason: 'Fallback word - no suitable words found',
          wordType: 'common',
          alternativeWords: ['a', 'an', 'this'],
          quality: 30
        };
      }

      const selectedWord = result.words[0];
      
      return {
        selectedWord,
        selectionReason: `Selected from ${result.metadata.source} with ${result.metadata.selectionQuality}% quality`,
        wordType: result.metadata.selectionQuality > 80 ? 'frequency_based' : 'common',
        alternativeWords: result.words.slice(1, 4),
        quality: result.metadata.selectionQuality
      };
    } catch (error) {
      console.error('[ImprovedAutomaticWordSelection] Error in word selection:', error);
      return {
        selectedWord: 'the',
        selectionReason: 'Error fallback',
        wordType: 'common',
        alternativeWords: ['a', 'an', 'this'],
        quality: 20
      };
    }
  }

  // Add the missing trackWordUsage method
  static async trackWordUsage(
    userId: string,
    word: string,
    language: string,
    sessionId: string,
    isCorrect?: boolean
  ): Promise<void> {
    console.log(`[ImprovedAutomaticWordSelection] Tracking word usage: ${word} (${isCorrect ? 'correct' : 'incorrect'})`);
    
    try {
      // Store word usage in session data for tracking
      const sessionData = EnhancedWordFrequencyService.getSessionData(language);
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
      
      console.log(`[ImprovedAutomaticWordSelection] Word usage tracked for ${word}`);
    } catch (error) {
      console.error('[ImprovedAutomaticWordSelection] Error tracking word usage:', error);
    }
  }
  
  static async selectOptimalWords(options: EnhancedWordSelectionOptions): Promise<EnhancedWordSelectionResult> {
    console.log('[ImprovedAutomaticWordSelection] Starting optimal word selection');
    
    try {
      // Get base word selection from enhanced service
      const baseResult = await EnhancedWordFrequencyService.selectWordsForDifficulty(options);
      
      // Enhance with additional analytics
      const enhancedResult: EnhancedWordSelectionResult = {
        ...baseResult,
        metadata: {
          ...baseResult.metadata,
          difficultyLevel: options.difficulty // Add the missing property
        },
        recommendedNextDifficulty: this.calculateNextDifficulty(options.difficulty, baseResult.metadata.selectionQuality),
        learningInsights: this.generateLearningInsights(options, baseResult)
      };

      console.log('[ImprovedAutomaticWordSelection] Enhanced word selection completed');
      return enhancedResult;
      
    } catch (error) {
      console.error('[ImprovedAutomaticWordSelection] Error in optimal word selection:', error);
      
      // Fallback to basic selection
      const fallbackResult = await EnhancedWordFrequencyService.selectWordsForDifficulty(options);
      return {
        ...fallbackResult,
        metadata: {
          ...fallbackResult.metadata,
          difficultyLevel: options.difficulty
        },
        recommendedNextDifficulty: options.difficulty,
        learningInsights: {
          strongAreas: [],
          improvementAreas: ['Technical difficulties encountered'],
          nextFocus: 'Continue with current difficulty level'
        }
      };
    }
  }

  private static calculateNextDifficulty(currentDifficulty: DifficultyLevel, selectionQuality: number): DifficultyLevel {
    const currentIndex = this.DIFFICULTY_PROGRESSION.indexOf(currentDifficulty);
    
    if (selectionQuality > 85 && currentIndex < this.DIFFICULTY_PROGRESSION.length - 1) {
      return this.DIFFICULTY_PROGRESSION[currentIndex + 1];
    }
    
    if (selectionQuality < 60 && currentIndex > 0) {
      return this.DIFFICULTY_PROGRESSION[currentIndex - 1];
    }
    
    return currentDifficulty;
  }

  private static generateLearningInsights(
    options: EnhancedWordSelectionOptions, 
    result: WordSelectionResult
  ): EnhancedWordSelectionResult['learningInsights'] {
    const strongAreas: string[] = [];
    const improvementAreas: string[] = [];
    let nextFocus = 'Continue practicing current level';

    // Analyze selection quality
    if (result.metadata.selectionQuality > 80) {
      strongAreas.push('Good word variety available');
    } else {
      improvementAreas.push('Limited word pool - consider expanding vocabulary');
    }

    // Analyze diversity
    if (result.metadata.diversityScore > 70) {
      strongAreas.push('High vocabulary diversity');
    } else {
      improvementAreas.push('Word patterns could be more diverse');
    }

    // Provide next focus based on difficulty and performance
    if (result.metadata.selectionQuality > 85) {
      nextFocus = 'Ready to advance to next difficulty level';
    } else if (result.metadata.selectionQuality < 60) {
      nextFocus = 'Focus on mastering current level words';
    }

    return {
      strongAreas,
      improvementAreas,
      nextFocus
    };
  }

  static async getAdaptiveWordSelection(
    language: string,
    difficulty: DifficultyLevel,
    sessionHistory?: any[]
  ): Promise<EnhancedWordSelectionResult> {
    console.log('[ImprovedAutomaticWordSelection] Getting adaptive word selection');
    
    // Analyze session history for patterns
    const excludeWords = sessionHistory 
      ? sessionHistory.flatMap(session => session.words || [])
      : [];

    // Get session statistics
    const sessionStats = EnhancedWordFrequencyService.getSessionStats(language);
    
    // Adjust count based on performance
    let wordCount = 10;
    if (sessionStats.correctAnswers / Math.max(sessionStats.totalExercises, 1) > 0.8) {
      wordCount = 12; // Increase challenge for high performers
    } else if (sessionStats.correctAnswers / Math.max(sessionStats.totalExercises, 1) < 0.6) {
      wordCount = 8; // Reduce load for struggling learners
    }

    const options: EnhancedWordSelectionOptions = {
      language,
      difficulty,
      count: wordCount,
      excludeWords: excludeWords.slice(-50), // Only recent exclusions to allow word recycling
      maxRepetitions: 2,
      sessionContext: sessionStats
    };

    return this.selectOptimalWords(options);
  }

  static getWordDifficultyScore(word: string, language: string): number {
    // Simple heuristic based on word length and character complexity
    let score = Math.min(word.length * 10, 100);
    
    // Adjust for language-specific complexity
    if (language === 'german' && word.includes('ß')) score += 10;
    if (language === 'french' && /[àáâäèéêëìíîïòóôöùúûü]/.test(word)) score += 5;
    if (language === 'spanish' && /[ñáéíóúü]/.test(word)) score += 5;
    
    return Math.min(score, 100);
  }

  static analyzeWordPatterns(words: string[]): {
    averageLength: number;
    commonPrefixes: string[];
    commonSuffixes: string[];
    complexityDistribution: { simple: number; medium: number; complex: number };
  } {
    if (words.length === 0) {
      return {
        averageLength: 0,
        commonPrefixes: [],
        commonSuffixes: [],
        complexityDistribution: { simple: 0, medium: 0, complex: 0 }
      };
    }

    const averageLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    // Analyze prefixes and suffixes
    const prefixes = words.map(word => word.substring(0, 2)).filter(p => p.length === 2);
    const suffixes = words.map(word => word.substring(word.length - 2)).filter(s => s.length === 2);
    
    const prefixCounts = prefixes.reduce((acc, prefix) => {
      acc[prefix] = (acc[prefix] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const suffixCounts = suffixes.reduce((acc, suffix) => {
      acc[suffix] = (suffix[suffix] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const commonPrefixes = Object.entries(prefixCounts)
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([prefix]) => prefix);
      
    const commonSuffixes = Object.entries(suffixCounts)
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([suffix]) => suffix);

    // Complexity distribution
    let simple = 0, medium = 0, complex = 0;
    words.forEach(word => {
      if (word.length <= 4) simple++;
      else if (word.length <= 7) medium++;
      else complex++;
    });

    return {
      averageLength: Math.round(averageLength * 10) / 10,
      commonPrefixes,
      commonSuffixes,
      complexityDistribution: { simple, medium, complex }
    };
  }
}
