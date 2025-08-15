import { supabase } from '@/integrations/supabase/client';

interface WordUsageEntry {
  word: string;
  sessionId: string;
  timestamp: Date;
  isCorrect?: boolean;
  userId: string;
  language: string;
}

export class SessionWordTracker {
  private static sessionWordUsage = new Map<string, Set<string>>();
  private static crossSessionCooldown = new Map<string, Map<string, Date>>();
  private static readonly COOLDOWN_HOURS = 24; // Words can't repeat for 24 hours
  private static readonly SESSION_WORD_LIMIT = 15; // Max words to track per session

  // Track word usage in current session
  static addWordToSession(sessionId: string, word: string): void {
    if (!this.sessionWordUsage.has(sessionId)) {
      this.sessionWordUsage.set(sessionId, new Set());
    }
    
    const sessionWords = this.sessionWordUsage.get(sessionId)!;
    sessionWords.add(word.toLowerCase());
    
    // Keep only recent words to prevent memory issues
    if (sessionWords.size > this.SESSION_WORD_LIMIT) {
      const wordsArray = Array.from(sessionWords);
      const recentWords = wordsArray.slice(-this.SESSION_WORD_LIMIT);
      this.sessionWordUsage.set(sessionId, new Set(recentWords));
    }
    
    console.log(`[SessionWordTracker] Added "${word}" to session ${sessionId}. Total: ${sessionWords.size}`);
  }

  // Check if word was used in current session
  static isWordUsedInSession(sessionId: string, word: string): boolean {
    const sessionWords = this.sessionWordUsage.get(sessionId);
    return sessionWords ? sessionWords.has(word.toLowerCase()) : false;
  }

  // Get words used in current session
  static getSessionWords(sessionId: string): string[] {
    const sessionWords = this.sessionWordUsage.get(sessionId);
    return sessionWords ? Array.from(sessionWords) : [];
  }

  // Load previous session words to avoid immediate repetition
  static async loadRecentWords(userId: string, language: string): Promise<string[]> {
    try {
      console.log(`[SessionWordTracker] Loading recent words for ${language}`);
      
      // Get words from last 3 sessions
      const { data: recentSessions } = await supabase
        .from('sentence_mining_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('language', language)
        .order('created_at', { ascending: false })
        .limit(3);

      if (!recentSessions || recentSessions.length === 0) {
        return [];
      }

      const sessionIds = recentSessions.map(s => s.id);
      
      // Get exercises from these sessions
      const { data: recentExercises } = await supabase
        .from('sentence_mining_exercises')
        .select('target_words')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: false })
        .limit(30); // Last 30 exercises

      const recentWords: string[] = [];
      recentExercises?.forEach(exercise => {
        if (exercise.target_words && Array.isArray(exercise.target_words)) {
          recentWords.push(...exercise.target_words.map(w => w.toLowerCase()));
        }
      });

      const uniqueWords = [...new Set(recentWords)];
      console.log(`[SessionWordTracker] Loaded ${uniqueWords.length} recent words: [${uniqueWords.slice(0, 5).join(', ')}...]`);
      
      return uniqueWords;
    } catch (error) {
      console.error('[SessionWordTracker] Error loading recent words:', error);
      return [];
    }
  }

  // Set cooldown for a word
  static setCooldown(userId: string, word: string): void {
    const userKey = `${userId}`;
    if (!this.crossSessionCooldown.has(userKey)) {
      this.crossSessionCooldown.set(userKey, new Map());
    }
    
    const userCooldowns = this.crossSessionCooldown.get(userKey)!;
    const cooldownUntil = new Date();
    cooldownUntil.setHours(cooldownUntil.getHours() + this.COOLDOWN_HOURS);
    
    userCooldowns.set(word.toLowerCase(), cooldownUntil);
    
    console.log(`[SessionWordTracker] Set cooldown for "${word}" until ${cooldownUntil.toLocaleString()}`);
  }

  // Check if word is in cooldown
  static isWordInCooldown(userId: string, word: string): boolean {
    const userKey = `${userId}`;
    const userCooldowns = this.crossSessionCooldown.get(userKey);
    
    if (!userCooldowns) return false;
    
    const cooldownUntil = userCooldowns.get(word.toLowerCase());
    if (!cooldownUntil) return false;
    
    const isInCooldown = new Date() < cooldownUntil;
    
    // Clean up expired cooldowns
    if (!isInCooldown) {
      userCooldowns.delete(word.toLowerCase());
    }
    
    return isInCooldown;
  }

  // Get comprehensive avoidance list
  static getAvoidanceList(sessionId: string, userId: string, recentWords: string[] = []): string[] {
    const sessionWords = this.getSessionWords(sessionId);
    const cooldownWords = this.getCooldownWords(userId);
    
    const allAvoidWords = [
      ...sessionWords,
      ...cooldownWords,
      ...recentWords.map(w => w.toLowerCase())
    ];
    
    const uniqueAvoidWords = [...new Set(allAvoidWords)];
    
    console.log(`[SessionWordTracker] Avoiding ${uniqueAvoidWords.length} words: session(${sessionWords.length}) + cooldown(${cooldownWords.length}) + recent(${recentWords.length})`);
    
    return uniqueAvoidWords;
  }

  // Get words currently in cooldown
  private static getCooldownWords(userId: string): string[] {
    const userKey = `${userId}`;
    const userCooldowns = this.crossSessionCooldown.get(userKey);
    
    if (!userCooldowns) return [];
    
    const now = new Date();
    const activeCooldowns: string[] = [];
    
    // Check each cooldown and clean up expired ones
    for (const [word, cooldownUntil] of userCooldowns.entries()) {
      if (now < cooldownUntil) {
        activeCooldowns.push(word);
      } else {
        userCooldowns.delete(word); // Clean up expired
      }
    }
    
    return activeCooldowns;
  }

  // Clear session data
  static clearSession(sessionId: string): void {
    this.sessionWordUsage.delete(sessionId);
    console.log(`[SessionWordTracker] Cleared session ${sessionId}`);
  }

  // Get stats for debugging
  static getStats(): { activeSessions: number; totalCooldowns: number } {
    const activeSessions = this.sessionWordUsage.size;
    const totalCooldowns = Array.from(this.crossSessionCooldown.values())
      .reduce((sum, userMap) => sum + userMap.size, 0);
    
    return { activeSessions, totalCooldowns };
  }
}
