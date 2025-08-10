
import { supabase } from '@/integrations/supabase/client';
import { DifficultyLevel } from '@/types/sentence-mining';
import { IntelligentWordPoolManager, WordPoolEntry } from './intelligentWordPoolManager';

export interface WordSelectionResult {
  selectedWords: string[];
  selectionReason: string;
  diversityScore: number;
  alternativeWords: string[];
}

export interface SelectionCriteria {
  maxRecentUsage: number;
  minCooldownHours: number;
  preferredDifficulty: number;
  diversityWeight: number;
  noveltyWeight: number;
}

export class IntelligentWordSelection {
  private static readonly DEFAULT_CRITERIA: SelectionCriteria = {
    maxRecentUsage: 2,
    minCooldownHours: 8,
    preferredDifficulty: 50,
    diversityWeight: 0.4,
    noveltyWeight: 0.3
  };

  static async selectOptimalWords(
    userId: string,
    language: string,
    difficulty: DifficultyLevel,
    sessionId: string,
    wordCount: number = 1,
    criteria: Partial<SelectionCriteria> = {}
  ): Promise<WordSelectionResult> {
    try {
      const finalCriteria = { ...this.DEFAULT_CRITERIA, ...criteria };
      
      console.log(`[IntelligentWordSelection] Selecting ${wordCount} words for ${language} (${difficulty})`);

      // Get intelligent word pool
      const wordPool = await IntelligentWordPoolManager.getIntelligentWordPool(
        userId,
        language,
        difficulty,
        true, // exclude recent
        50   // target size
      );

      if (wordPool.length === 0) {
        return {
          selectedWords: [],
          selectionReason: 'No words available in pool',
          diversityScore: 0,
          alternativeWords: []
        };
      }

      // Get recent word usage for additional filtering
      const recentUsage = await this.getRecentWordUsage(userId, language, sessionId, 24);

      // Score and rank words
      const scoredWords = await this.scoreWords(
        wordPool,
        recentUsage,
        finalCriteria,
        difficulty
      );

      // Select best words with diversity consideration
      const selectedWords = this.selectDiverseWords(scoredWords, wordCount, finalCriteria.diversityWeight);
      
      const averageScore = selectedWords.length > 0 
        ? selectedWords.reduce((sum, w) => sum + w.score, 0) / selectedWords.length
        : 0;

      const selectionReason = this.generateSelectionReason(selectedWords, finalCriteria);
      const alternativeWords = scoredWords
        .filter(w => !selectedWords.find(s => s.word === w.word))
        .slice(0, 5)
        .map(w => w.word);

      console.log(`[IntelligentWordSelection] Selected ${selectedWords.length} words with average score ${Math.round(averageScore)}`);

      return {
        selectedWords: selectedWords.map(w => w.word),
        selectionReason,
        diversityScore: Math.round(averageScore),
        alternativeWords
      };
    } catch (error) {
      console.error('[IntelligentWordSelection] Error in word selection:', error);
      return {
        selectedWords: [],
        selectionReason: 'Error in word selection',
        diversityScore: 0,
        alternativeWords: []
      };
    }
  }

  private static async scoreWords(
    wordPool: WordPoolEntry[],
    recentUsage: Map<string, number>,
    criteria: SelectionCriteria,
    difficulty: DifficultyLevel
  ) {
    const difficultyTargets = {
      beginner: 30,
      intermediate: 50,
      advanced: 70
    };

    const targetDifficulty = difficultyTargets[difficulty];

    return wordPool.map(entry => {
      let score = 50; // Base score

      // Penalize recent usage
      const usageCount = recentUsage.get(entry.word.toLowerCase()) || 0;
      if (usageCount > 0) {
        score -= Math.min(usageCount * 15, 40);
      }

      // Penalize very recent usage
      if (entry.lastUsed) {
        const hoursSinceUse = (Date.now() - entry.lastUsed.getTime()) / (1000 * 60 * 60);
        if (hoursSinceUse < criteria.minCooldownHours) {
          score -= Math.max(20 - hoursSinceUse * 2, 0);
        }
      }

      // Reward appropriate difficulty
      const difficultyMatch = 100 - Math.abs(entry.difficulty - targetDifficulty);
      score += (difficultyMatch - 50) * 0.3;

      // Reward low mastery (needs practice)
      if (entry.masteryLevel < 3) {
        score += (3 - entry.masteryLevel) * 10;
      }

      // Add frequency consideration
      score += (entry.frequency - 50) * 0.2;

      // Add some randomness for natural variety
      score += (Math.random() - 0.5) * 8;

      return {
        ...entry,
        score: Math.max(0, Math.min(100, score))
      };
    }).sort((a, b) => b.score - a.score);
  }

  private static selectDiverseWords(
    scoredWords: any[],
    count: number,
    diversityWeight: number
  ) {
    if (scoredWords.length === 0) return [];
    
    const selected: any[] = [];
    const remaining = [...scoredWords];

    for (let i = 0; i < count && remaining.length > 0; i++) {
      if (i === 0) {
        // First word: just take the highest scored
        const best = remaining.shift()!;
        selected.push(best);
        continue;
      }

      // Subsequent words: consider diversity
      const diverseScored = remaining.map(word => {
        let diversityBonus = 0;

        // Calculate diversity bonus based on differences with selected words
        for (const selectedWord of selected) {
          const lengthDiff = Math.abs(word.word.length - selectedWord.word.length);
          const startDiff = word.word[0] !== selectedWord.word[0] ? 1 : 0;
          const difficultyDiff = Math.abs(word.difficulty - selectedWord.difficulty);

          diversityBonus += (lengthDiff + startDiff * 3 + difficultyDiff * 0.2) * diversityWeight;
        }

        return {
          ...word,
          finalScore: word.score + diversityBonus
        };
      });

      // Select word with highest final score
      diverseScored.sort((a, b) => b.finalScore - a.finalScore);
      const selectedWord = diverseScored[0];
      
      selected.push(selectedWord);
      
      // Remove from remaining
      const index = remaining.findIndex(w => w.word === selectedWord.word);
      if (index >= 0) {
        remaining.splice(index, 1);
      }
    }

    return selected;
  }

  private static async getRecentWordUsage(
    userId: string,
    language: string,
    sessionId: string,
    lookbackHours: number
  ): Promise<Map<string, number>> {
    const usageMap = new Map<string, number>();
    const cutoffTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

    try {
      const { data: exercises } = await supabase
        .from('sentence_mining_exercises')
        .select('target_words')
        .gte('created_at', cutoffTime.toISOString());

      exercises?.forEach(exercise => {
        exercise.target_words?.forEach((word: string) => {
          const normalizedWord = word.toLowerCase();
          usageMap.set(normalizedWord, (usageMap.get(normalizedWord) || 0) + 1);
        });
      });
    } catch (error) {
      console.error('[IntelligentWordSelection] Error getting recent usage:', error);
    }

    return usageMap;
  }

  private static generateSelectionReason(selectedWords: any[], criteria: SelectionCriteria): string {
    if (selectedWords.length === 0) return 'No suitable words found';

    const reasons = [];
    const averageScore = selectedWords.reduce((sum, w) => sum + w.score, 0) / selectedWords.length;

    if (averageScore > 80) {
      reasons.push('high quality selection');
    } else if (averageScore > 60) {
      reasons.push('good quality selection');
    } else {
      reasons.push('moderate quality selection');
    }

    const newWords = selectedWords.filter(w => !w.lastUsed);
    if (newWords.length > 0) {
      reasons.push(`${newWords.length} new word${newWords.length > 1 ? 's' : ''}`);
    }

    const reviewWords = selectedWords.filter(w => w.masteryLevel < 3);
    if (reviewWords.length > 0) {
      reasons.push(`${reviewWords.length} review word${reviewWords.length > 1 ? 's' : ''}`);
    }

    return reasons.join(', ') || 'intelligent selection';
  }

  static async getWordSelectionStats(
    userId: string,
    language: string,
    sessionId: string
  ) {
    try {
      const wordPool = await IntelligentWordPoolManager.getIntelligentWordPool(
        userId,
        language,
        'intermediate',
        false,
        100
      );

      const recentUsage = await this.getRecentWordUsage(userId, language, sessionId, 24);
      
      return {
        totalWords: wordPool.length,
        availableWords: wordPool.filter(w => !recentUsage.has(w.word.toLowerCase())).length,
        newWords: wordPool.filter(w => !w.lastUsed).length,
        reviewWords: wordPool.filter(w => w.masteryLevel < 3).length,
        masteredWords: wordPool.filter(w => w.masteryLevel >= 4).length
      };
    } catch (error) {
      console.error('[IntelligentWordSelection] Error getting stats:', error);
      return {
        totalWords: 0,
        availableWords: 0,
        newWords: 0,
        reviewWords: 0,
        masteredWords: 0
      };
    }
  }
}
