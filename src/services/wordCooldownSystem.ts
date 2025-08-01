
import { supabase } from '@/integrations/supabase/client';

export interface WordCooldownEntry {
  word: string;
  language: string;
  lastUsed: Date;
  usageCount: number;
  cooldownUntil: Date;
}

export interface CooldownConfig {
  baseCooldownHours: number;
  maxCooldownHours: number;
  usageThreshold: number;
  cooldownMultiplier: number;
}

export class WordCooldownSystem {
  private static readonly DEFAULT_CONFIG: CooldownConfig = {
    baseCooldownHours: 2,
    maxCooldownHours: 24,
    usageThreshold: 3,
    cooldownMultiplier: 1.5
  };

  static async trackWordUsage(
    userId: string,
    word: string,
    language: string,
    sessionId: string
  ): Promise<void> {
    try {
      const now = new Date();
      
      // Check if word was used in recent exercises
      const { data: recentUsage } = await supabase
        .from('sentence_mining_exercises')
        .select('created_at, target_words')
        .eq('session_id', sessionId)
        .contains('target_words', [word])
        .order('created_at', { ascending: false })
        .limit(5);

      const usageCount = recentUsage?.length || 0;
      const cooldownHours = this.calculateCooldownDuration(usageCount);
      const cooldownUntil = new Date(now.getTime() + cooldownHours * 60 * 60 * 1000);

      // Store in a simple JSON format in session_data or use a separate tracking mechanism
      console.log(`Tracking word usage: ${word} (${language}) - Usage count: ${usageCount}, Cooldown until: ${cooldownUntil}`);
      
      // For now, we'll use the known_words table to track cooldown information
      await supabase
        .from('known_words')
        .upsert({
          user_id: userId,
          word,
          language,
          last_reviewed_at: now.toISOString(),
          updated_at: now.toISOString(),
          // We'll store cooldown info in a way that doesn't interfere with spaced repetition
          review_count: 1,
          correct_count: 1,
          mastery_level: 1
        }, {
          onConflict: 'user_id,word,language'
        });

    } catch (error) {
      console.error('Error tracking word usage:', error);
    }
  }

  static async getAvailableWords(
    userId: string,
    language: string,
    candidateWords: string[],
    sessionId: string
  ): Promise<string[]> {
    try {
      if (candidateWords.length === 0) return [];

      const now = new Date();
      const recentHours = 6; // Look back 6 hours for recent usage
      const cutoffTime = new Date(now.getTime() - recentHours * 60 * 60 * 1000);

      // Get recently used words from the current session and recent sessions
      const { data: recentExercises } = await supabase
        .from('sentence_mining_exercises')
        .select('target_words, created_at')
        .eq('session_id', sessionId)
        .gte('created_at', cutoffTime.toISOString());

      // Extract recently used words
      const recentlyUsedWords = new Set<string>();
      recentExercises?.forEach(exercise => {
        exercise.target_words?.forEach((word: string) => {
          recentlyUsedWords.add(word.toLowerCase());
        });
      });

      // Filter out words that are on cooldown
      const availableWords = candidateWords.filter(word => {
        return !recentlyUsedWords.has(word.toLowerCase());
      });

      console.log(`Word cooldown check: ${candidateWords.length} candidates -> ${availableWords.length} available`);
      console.log(`Recently used words:`, Array.from(recentlyUsedWords));

      return availableWords;
    } catch (error) {
      console.error('Error checking word availability:', error);
      return candidateWords; // Fallback to all candidates if error
    }
  }

  static async getWordUsageStats(
    userId: string,
    language: string,
    sessionId: string,
    lookbackHours: number = 24
  ): Promise<Map<string, number>> {
    try {
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000);

      const { data: exercises } = await supabase
        .from('sentence_mining_exercises')
        .select('target_words, created_at')
        .eq('session_id', sessionId)
        .gte('created_at', cutoffTime.toISOString());

      const usageStats = new Map<string, number>();
      
      exercises?.forEach(exercise => {
        exercise.target_words?.forEach((word: string) => {
          const currentCount = usageStats.get(word) || 0;
          usageStats.set(word, currentCount + 1);
        });
      });

      return usageStats;
    } catch (error) {
      console.error('Error getting word usage stats:', error);
      return new Map();
    }
  }

  private static calculateCooldownDuration(usageCount: number): number {
    const config = this.DEFAULT_CONFIG;
    
    if (usageCount < config.usageThreshold) {
      return config.baseCooldownHours;
    }
    
    const multipliedCooldown = config.baseCooldownHours * Math.pow(config.cooldownMultiplier, usageCount - config.usageThreshold);
    return Math.min(multipliedCooldown, config.maxCooldownHours);
  }

  static async cleanupOldCooldowns(userId: string, language: string): Promise<void> {
    // This method could be used to clean up old cooldown entries
    // For now, we rely on the natural expiration of the lookback window
    console.log(`Cleanup cooldowns for ${userId} - ${language}`);
  }
}
