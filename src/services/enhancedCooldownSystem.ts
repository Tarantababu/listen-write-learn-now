import { supabase } from '@/integrations/supabase/client';

export interface EnhancedCooldownEntry {
  word: string;
  language: string;
  userId: string;
  sessionId: string;
  lastUsed: Date;
  usageCount: number;
  cooldownUntil: Date;
  contextPattern: string;
  difficultyLevel: string;
}

export interface CooldownStats {
  totalTrackedWords: number;
  activeCooldowns: number;
  averageCooldownHours: number;
  recentUsageRate: number;
}

export class EnhancedCooldownSystem {
  private static readonly cooldownCache = new Map<string, EnhancedCooldownEntry[]>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  private static readonly COOLDOWN_CONFIG = {
    baseCooldownHours: 8,
    maxCooldownHours: 168, // 7 days
    usageMultiplier: 1.8,
    contextSimilarityPenalty: 6, // hours
    difficultyBonus: {
      beginner: 0.8,
      intermediate: 1.0,
      advanced: 1.2
    }
  };

  static async trackWordUsage(
    userId: string,
    word: string,
    language: string,
    sessionId: string,
    sentence: string,
    contextPattern: string,
    difficultyLevel: string = 'intermediate'
  ): Promise<void> {
    try {
      const now = new Date();
      
      // Get recent usage count for this word
      const recentUsage = await this.getWordUsageCount(userId, word, language, 168); // 7 days
      
      // Calculate enhanced cooldown duration
      const cooldownHours = this.calculateEnhancedCooldown(
        recentUsage,
        contextPattern,
        difficultyLevel as keyof typeof this.COOLDOWN_CONFIG.difficultyBonus,
        sentence
      );
      
      const cooldownUntil = new Date(now.getTime() + cooldownHours * 60 * 60 * 1000);

      // Store enhanced tracking data in session metadata
      const trackingData: EnhancedCooldownEntry = {
        word,
        language,
        userId,
        sessionId,
        lastUsed: now,
        usageCount: recentUsage + 1,
        cooldownUntil,
        contextPattern,
        difficultyLevel
      };

      // Update cache
      const cacheKey = `${userId}_${language}`;
      const cached = this.cooldownCache.get(cacheKey) || [];
      const existingIndex = cached.findIndex(entry => entry.word === word);
      
      if (existingIndex >= 0) {
        cached[existingIndex] = trackingData;
      } else {
        cached.push(trackingData);
      }
      
      // Keep only recent entries
      const validEntries = cached.filter(entry => 
        entry.cooldownUntil.getTime() > now.getTime() - 24 * 60 * 60 * 1000
      );
      
      this.cooldownCache.set(cacheKey, validEntries);

      // Store in database for persistence
      await this.persistWordUsage(trackingData, sentence);

      console.log(`[EnhancedCooldownSystem] Tracked "${word}" - Cooldown: ${cooldownHours.toFixed(1)}h, Usage: ${recentUsage + 1}, Pattern: ${contextPattern}`);
    } catch (error) {
      console.error('[EnhancedCooldownSystem] Error tracking word usage:', error);
    }
  }

  static async getAvailableWords(
    userId: string,
    language: string,
    candidateWords: string[],
    sessionId: string,
    contextPattern?: string
  ): Promise<{
    available: string[];
    cooldownInfo: Map<string, { cooldownUntil: Date; reason: string }>;
  }> {
    try {
      const now = new Date();
      const cooldownInfo = new Map<string, { cooldownUntil: Date; reason: string }>();
      
      // Get current cooldown data
      const cooldowns = await this.getCurrentCooldowns(userId, language);
      
      const available = candidateWords.filter(word => {
        const wordCooldown = cooldowns.find(cd => cd.word.toLowerCase() === word.toLowerCase());
        
        if (!wordCooldown) {
          return true; // No cooldown data, word is available
        }
        
        if (wordCooldown.cooldownUntil.getTime() <= now.getTime()) {
          return true; // Cooldown expired
        }
        
        // Word is on cooldown
        const remainingHours = (wordCooldown.cooldownUntil.getTime() - now.getTime()) / (1000 * 60 * 60);
        let reason = `Used ${wordCooldown.usageCount} times recently`;
        
        if (contextPattern && wordCooldown.contextPattern === contextPattern) {
          reason += ', same context pattern';
        }
        
        cooldownInfo.set(word, {
          cooldownUntil: wordCooldown.cooldownUntil,
          reason
        });
        
        return false;
      });

      console.log(`[EnhancedCooldownSystem] ${available.length}/${candidateWords.length} words available after cooldown filtering`);
      
      return { available, cooldownInfo };
    } catch (error) {
      console.error('[EnhancedCooldownSystem] Error checking word availability:', error);
      return { 
        available: candidateWords, 
        cooldownInfo: new Map() 
      };
    }
  }

  static async getCooldownStats(
    userId: string,
    language: string,
    sessionId: string
  ): Promise<CooldownStats> {
    try {
      const cooldowns = await this.getCurrentCooldowns(userId, language);
      const now = new Date();
      
      const activeCooldowns = cooldowns.filter(cd => cd.cooldownUntil.getTime() > now.getTime()).length;
      
      const averageCooldownHours = cooldowns.length > 0
        ? cooldowns.reduce((sum, cd) => {
            const hours = (cd.cooldownUntil.getTime() - cd.lastUsed.getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }, 0) / cooldowns.length
        : 0;

      // Calculate recent usage rate (words used per hour in last 24h)
      const recentUsage = await this.getRecentUsageCount(userId, language, 24);
      const recentUsageRate = recentUsage / 24;

      return {
        totalTrackedWords: cooldowns.length,
        activeCooldowns,
        averageCooldownHours: Math.round(averageCooldownHours * 10) / 10,
        recentUsageRate: Math.round(recentUsageRate * 100) / 100
      };
    } catch (error) {
      console.error('[EnhancedCooldownSystem] Error getting cooldown stats:', error);
      return {
        totalTrackedWords: 0,
        activeCooldowns: 0,
        averageCooldownHours: 0,
        recentUsageRate: 0
      };
    }
  }

  static clearSessionCache(sessionId: string): void {
    // Clear cache entries related to specific session
    for (const [key, entries] of this.cooldownCache) {
      const filteredEntries = entries.filter(entry => entry.sessionId !== sessionId);
      this.cooldownCache.set(key, filteredEntries);
    }
    console.log(`[EnhancedCooldownSystem] Cleared cache for session ${sessionId}`);
  }

  private static calculateEnhancedCooldown(
    usageCount: number,
    contextPattern: string,
    difficultyLevel: keyof typeof EnhancedCooldownSystem.COOLDOWN_CONFIG.difficultyBonus,
    sentence: string
  ): number {
    const config = this.COOLDOWN_CONFIG;
    let cooldownHours = config.baseCooldownHours;

    // Apply usage-based multiplier
    if (usageCount > 1) {
      cooldownHours *= Math.pow(config.usageMultiplier, usageCount - 1);
    }

    // Apply difficulty modifier
    const difficultyMultiplier = config.difficultyBonus[difficultyLevel] || 1.0;
    cooldownHours *= difficultyMultiplier;

    // Add context similarity penalty
    if (contextPattern && this.isSimplePattern(contextPattern)) {
      cooldownHours += config.contextSimilarityPenalty;
    }

    // Sentence complexity adjustment
    const complexity = this.calculateSentenceComplexity(sentence);
    if (complexity < 0.3) {
      cooldownHours *= 1.2; // Longer cooldown for simple sentences
    } else if (complexity > 0.7) {
      cooldownHours *= 0.8; // Shorter cooldown for complex sentences
    }

    return Math.min(cooldownHours, config.maxCooldownHours);
  }

  private static async getCurrentCooldowns(
    userId: string,
    language: string
  ): Promise<EnhancedCooldownEntry[]> {
    const cacheKey = `${userId}_${language}`;
    const cached = this.cooldownCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Load from database if not in cache
    try {
      const { data: exercises } = await supabase
        .from('sentence_mining_exercises')
        .select('target_words, created_at, session_id, sentence')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      const cooldowns: EnhancedCooldownEntry[] = [];
      const wordUsage = new Map<string, any[]>();

      // Group exercises by word
      exercises?.forEach(exercise => {
        exercise.target_words?.forEach((word: string) => {
          const normalizedWord = word.toLowerCase();
          if (!wordUsage.has(normalizedWord)) {
            wordUsage.set(normalizedWord, []);
          }
          wordUsage.get(normalizedWord)!.push({
            word,
            created_at: exercise.created_at,
            session_id: exercise.session_id,
            sentence: exercise.sentence
          });
        });
      });

      // Create cooldown entries
      for (const [word, usages] of wordUsage) {
        const mostRecent = usages[0];
        const usageCount = usages.length;
        const lastUsed = new Date(mostRecent.created_at);
        
        // Calculate cooldown
        const cooldownHours = this.calculateEnhancedCooldown(
          usageCount,
          'unknown_pattern',
          'intermediate',
          mostRecent.sentence || ''
        );
        
        const cooldownUntil = new Date(lastUsed.getTime() + cooldownHours * 60 * 60 * 1000);

        cooldowns.push({
          word: mostRecent.word,
          language,
          userId,
          sessionId: mostRecent.session_id,
          lastUsed,
          usageCount,
          cooldownUntil,
          contextPattern: 'loaded_pattern',
          difficultyLevel: 'intermediate'
        });
      }

      this.cooldownCache.set(cacheKey, cooldowns);
      return cooldowns;
    } catch (error) {
      console.error('[EnhancedCooldownSystem] Error loading cooldowns:', error);
      return [];
    }
  }

  private static async getWordUsageCount(
    userId: string,
    word: string,
    language: string,
    lookbackHours: number
  ): Promise<number> {
    try {
      const cutoffTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

      const { data: exercises } = await supabase
        .from('sentence_mining_exercises')
        .select('target_words')
        .gte('created_at', cutoffTime.toISOString())
        .contains('target_words', [word]);

      return exercises?.length || 0;
    } catch (error) {
      console.error('[EnhancedCooldownSystem] Error counting word usage:', error);
      return 0;
    }
  }

  private static async getRecentUsageCount(
    userId: string,
    language: string,
    lookbackHours: number
  ): Promise<number> {
    try {
      const cutoffTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

      const { data: exercises } = await supabase
        .from('sentence_mining_exercises')
        .select('target_words')
        .gte('created_at', cutoffTime.toISOString());

      return exercises?.reduce((sum, ex) => sum + (ex.target_words?.length || 0), 0) || 0;
    } catch (error) {
      console.error('[EnhancedCooldownSystem] Error counting recent usage:', error);
      return 0;
    }
  }

  private static async persistWordUsage(
    trackingData: EnhancedCooldownEntry,
    sentence: string
  ): Promise<void> {
    try {
      // Update known_words table with enhanced tracking
      await supabase
        .from('known_words')
        .upsert({
          user_id: trackingData.userId,
          word: trackingData.word,
          language: trackingData.language,
          last_reviewed_at: trackingData.lastUsed.toISOString(),
          updated_at: trackingData.lastUsed.toISOString(),
          review_count: trackingData.usageCount,
          correct_count: trackingData.usageCount,
          mastery_level: Math.min(trackingData.usageCount, 5)
        }, {
          onConflict: 'user_id,word,language'
        });
    } catch (error) {
      console.error('[EnhancedCooldownSystem] Error persisting word usage:', error);
    }
  }

  private static isSimplePattern(pattern: string): boolean {
    const simplePatterns = ['short_simple', 'medium_simple', 'basic'];
    return simplePatterns.some(simple => pattern.includes(simple));
  }

  private static calculateSentenceComplexity(sentence: string): number {
    if (!sentence) return 0;
    
    let complexity = 0;
    const features = [
      sentence.includes(','),
      sentence.includes(';'),
      sentence.includes('?'),
      sentence.includes('!'),
      sentence.split(' ').length > 10,
      /\b(because|although|while|since|unless|whereas)\b/i.test(sentence),
      /\b(and|or|but|yet|so)\b/i.test(sentence)
    ];
    
    complexity = features.filter(Boolean).length / features.length;
    return complexity;
  }
}
