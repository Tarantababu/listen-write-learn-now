
import { supabase } from '@/integrations/supabase/client';

export interface CooldownEntry {
  word: string;
  language: string;
  userId: string;
  sessionId: string;
  lastUsed: Date;
  usageCount: number;
  cooldownUntil: Date;
  penalty: number;
  contextHash: string;
}

export interface CooldownConfig {
  baseCooldownMinutes: number;
  maxCooldownHours: number;
  usageThreshold: number;
  penaltyMultiplier: number;
  contextSimilarityThreshold: number;
  patternRepetitionPenalty: number;
}

export class EnhancedCooldownSystem {
  private static readonly DEFAULT_CONFIG: CooldownConfig = {
    baseCooldownMinutes: 30,
    maxCooldownHours: 12,
    usageThreshold: 2,
    penaltyMultiplier: 2.0,
    contextSimilarityThreshold: 0.7,
    patternRepetitionPenalty: 1.5
  };

  // In-memory cache for session-based tracking
  private static sessionCache: Map<string, Map<string, CooldownEntry>> = new Map();

  static async trackWordUsage(
    userId: string,
    word: string,
    language: string,
    sessionId: string,
    sentence: string,
    pattern: string
  ): Promise<void> {
    try {
      const now = new Date();
      const contextHash = this.generateContextHash(sentence, pattern);
      
      // Get or create session cache
      if (!this.sessionCache.has(sessionId)) {
        this.sessionCache.set(sessionId, new Map());
      }
      const sessionWords = this.sessionCache.get(sessionId)!;

      // Check existing usage
      const existing = sessionWords.get(word);
      let usageCount = 1;
      let penalty = 1;

      if (existing) {
        usageCount = existing.usageCount + 1;
        
        // Calculate enhanced penalty
        penalty = this.calculateEnhancedPenalty(existing, contextHash, usageCount);
      } else {
        // Check recent usage across sessions
        const recentUsage = await this.getRecentWordUsage(userId, word, language, 24);
        if (recentUsage.length > 0) {
          usageCount += recentUsage.length;
          penalty = Math.min(3, 1 + (recentUsage.length * 0.5));
        }
      }

      // Calculate cooldown duration
      const cooldownMinutes = this.calculateCooldownDuration(usageCount, penalty);
      const cooldownUntil = new Date(now.getTime() + cooldownMinutes * 60 * 1000);

      // Create cooldown entry
      const cooldownEntry: CooldownEntry = {
        word,
        language,
        userId,
        sessionId,
        lastUsed: now,
        usageCount,
        cooldownUntil,
        penalty,
        contextHash
      };

      // Update session cache
      sessionWords.set(word, cooldownEntry);

      // Also update database for persistence
      await this.persistCooldownEntry(cooldownEntry);

      console.log(`[EnhancedCooldown] ${word} used ${usageCount} times, penalty: ${penalty}, cooldown until: ${cooldownUntil.toISOString()}`);

    } catch (error) {
      console.error('[EnhancedCooldown] Error tracking word usage:', error);
    }
  }

  static async getAvailableWords(
    userId: string,
    language: string,
    candidateWords: string[],
    sessionId: string,
    avoidPatterns: string[] = []
  ): Promise<{
    availableWords: string[];
    cooldownWords: string[];
    penalizedWords: string[];
  }> {
    try {
      const now = new Date();
      const availableWords: string[] = [];
      const cooldownWords: string[] = [];
      const penalizedWords: string[] = [];

      // Get session cache
      const sessionWords = this.sessionCache.get(sessionId) || new Map();

      // Get recent cross-session usage
      const recentUsage = await this.getBulkRecentUsage(userId, language, candidateWords, 168); // 1 week

      for (const word of candidateWords) {
        let isAvailable = true;
        let reasonBlocked = '';

        // Check session cache first
        const sessionEntry = sessionWords.get(word);
        if (sessionEntry && sessionEntry.cooldownUntil > now) {
          isAvailable = false;
          reasonBlocked = `Session cooldown (${sessionEntry.usageCount} times, penalty: ${sessionEntry.penalty})`;
        }

        // Check recent cross-session usage
        if (isAvailable) {
          const recentCount = recentUsage.get(word) || 0;
          if (recentCount >= this.DEFAULT_CONFIG.usageThreshold) {
            const hoursSinceLastUse = this.getHoursSinceLastUse(userId, word, sessionId);
            const requiredCooldown = this.calculateCooldownDuration(recentCount, 1.5);
            
            if (hoursSinceLastUse < requiredCooldown / 60) {
              isAvailable = false;
              reasonBlocked = `Recent overuse (${recentCount} times in past week)`;
            }
          }
        }

        // Check pattern avoidance
        if (isAvailable && avoidPatterns.length > 0) {
          // This would require more context about how the word fits into patterns
          // For now, we'll use a simple heuristic
          const wordPatternScore = this.calculateWordPatternScore(word, avoidPatterns);
          if (wordPatternScore > 0.7) {
            penalizedWords.push(word);
            reasonBlocked = 'Pattern repetition risk';
          }
        }

        if (isAvailable) {
          availableWords.push(word);
        } else {
          cooldownWords.push(word);
          console.log(`[EnhancedCooldown] Word "${word}" blocked: ${reasonBlocked}`);
        }
      }

      console.log(`[EnhancedCooldown] Available: ${availableWords.length}/${candidateWords.length} words`);

      return {
        availableWords,
        cooldownWords,
        penalizedWords
      };

    } catch (error) {
      console.error('[EnhancedCooldown] Error checking word availability:', error);
      return {
        availableWords: candidateWords,
        cooldownWords: [],
        penalizedWords: []
      };
    }
  }

  static async getWordUsageIntensity(
    userId: string,
    language: string,
    sessionId: string,
    lookbackHours: number = 24
  ): Promise<Map<string, {
    count: number;
    intensity: number;
    lastUsed: Date;
    patterns: string[];
  }>> {
    try {
      const cutoffTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);
      
      // Get session cache data
      const sessionWords = this.sessionCache.get(sessionId) || new Map();
      const intensityMap = new Map();

      // Check database for cross-session data
      const { data: exercises } = await supabase
        .from('sentence_mining_exercises')
        .select('target_words, created_at, sentence')
        .gte('created_at', cutoffTime.toISOString())
        .order('created_at', { ascending: false });

      if (exercises) {
        exercises.forEach(exercise => {
          exercise.target_words?.forEach((word: string) => {
            const existing = intensityMap.get(word) || {
              count: 0,
              intensity: 0,
              lastUsed: new Date(exercise.created_at),
              patterns: []
            };
            
            existing.count++;
            existing.intensity = this.calculateIntensityScore(existing.count, lookbackHours);
            
            if (new Date(exercise.created_at) > existing.lastUsed) {
              existing.lastUsed = new Date(exercise.created_at);
            }

            intensityMap.set(word, existing);
          });
        });
      }

      return intensityMap;
    } catch (error) {
      console.error('[EnhancedCooldown] Error getting usage intensity:', error);
      return new Map();
    }
  }

  static clearSessionCache(sessionId: string): void {
    this.sessionCache.delete(sessionId);
    console.log(`[EnhancedCooldown] Cleared session cache for ${sessionId}`);
  }

  private static calculateEnhancedPenalty(
    existing: CooldownEntry,
    newContextHash: string,
    usageCount: number
  ): number {
    let penalty = existing.penalty;

    // Increase penalty for repeated usage
    penalty *= this.DEFAULT_CONFIG.penaltyMultiplier;

    // Additional penalty for similar contexts
    if (this.calculateContextSimilarity(existing.contextHash, newContextHash) > this.DEFAULT_CONFIG.contextSimilarityThreshold) {
      penalty *= this.DEFAULT_CONFIG.patternRepetitionPenalty;
    }

    // Progressive penalty for excessive usage
    if (usageCount > 3) {
      penalty *= 1.5;
    }
    if (usageCount > 5) {
      penalty *= 2;
    }

    return Math.min(5, penalty); // Cap at 5x penalty
  }

  private static calculateCooldownDuration(usageCount: number, penalty: number): number {
    const config = this.DEFAULT_CONFIG;
    const baseDuration = config.baseCooldownMinutes * Math.pow(config.penaltyMultiplier, usageCount - 1) * penalty;
    return Math.min(baseDuration, config.maxCooldownHours * 60);
  }

  private static generateContextHash(sentence: string, pattern: string): string {
    // Simple hash based on sentence structure and key words
    const keyWords = sentence.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 3)
      .sort()
      .join('');
    
    return `${pattern}:${keyWords}`;
  }

  private static calculateContextSimilarity(hash1: string, hash2: string): number {
    const [pattern1, words1] = hash1.split(':');
    const [pattern2, words2] = hash2.split(':');
    
    let similarity = 0;
    
    // Pattern similarity
    if (pattern1 === pattern2) {
      similarity += 0.5;
    }
    
    // Word similarity (basic intersection)
    if (words1 && words2) {
      const set1 = new Set(words1.split(''));
      const set2 = new Set(words2.split(''));
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      const union = new Set([...set1, ...set2]);
      
      similarity += 0.5 * (intersection.size / union.size);
    }
    
    return similarity;
  }

  private static async getRecentWordUsage(
    userId: string,
    word: string,
    language: string,
    lookbackHours: number
  ): Promise<any[]> {
    const cutoffTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);
    
    const { data } = await supabase
      .from('sentence_mining_exercises')
      .select('created_at, target_words')
      .gte('created_at', cutoffTime.toISOString())
      .contains('target_words', [word]);

    return data || [];
  }

  private static async getBulkRecentUsage(
    userId: string,
    language: string,
    words: string[],
    lookbackHours: number
  ): Promise<Map<string, number>> {
    const cutoffTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);
    const usageMap = new Map<string, number>();

    const { data } = await supabase
      .from('sentence_mining_exercises')
      .select('target_words')
      .gte('created_at', cutoffTime.toISOString());

    if (data) {
      data.forEach(exercise => {
        exercise.target_words?.forEach((word: string) => {
          if (words.includes(word)) {
            usageMap.set(word, (usageMap.get(word) || 0) + 1);
          }
        });
      });
    }

    return usageMap;
  }

  private static getHoursSinceLastUse(userId: string, word: string, sessionId: string): number {
    // Check session cache first
    const sessionWords = this.sessionCache.get(sessionId);
    if (sessionWords?.has(word)) {
      const entry = sessionWords.get(word)!;
      return (Date.now() - entry.lastUsed.getTime()) / (1000 * 60 * 60);
    }
    
    // Default to a high number if not found
    return 999;
  }

  private static calculateWordPatternScore(word: string, avoidPatterns: string[]): number {
    // Simple heuristic - in a real implementation, this would be more sophisticated
    return avoidPatterns.some(pattern => pattern.toLowerCase().includes(word.toLowerCase())) ? 0.8 : 0;
  }

  private static calculateIntensityScore(count: number, timespan: number): number {
    // Calculate intensity as usage per hour with decay
    const usage_per_hour = count / timespan;
    return Math.min(1, usage_per_hour * 10); // Scale to 0-1
  }

  private static async persistCooldownEntry(entry: CooldownEntry): Promise<void> {
    try {
      // Store in a simple format in the known_words table
      await supabase
        .from('known_words')
        .upsert({
          user_id: entry.userId,
          word: entry.word,
          language: entry.language,
          last_reviewed_at: entry.lastUsed.toISOString(),
          updated_at: entry.lastUsed.toISOString(),
          review_count: entry.usageCount,
          correct_count: 1,
          mastery_level: 1
        }, {
          onConflict: 'user_id,word,language'
        });
    } catch (error) {
      console.error('[EnhancedCooldown] Error persisting cooldown entry:', error);
    }
  }
}
