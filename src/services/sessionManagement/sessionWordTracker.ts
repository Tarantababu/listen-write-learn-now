
export class SessionWordTracker {
  private static sessionWords: Map<string, Set<string>> = new Map();
  private static wordCooldowns: Map<string, number> = new Map();
  private static recentWordsCache: Map<string, string[]> = new Map();

  static initializeSession(sessionId: string): void {
    if (!this.sessionWords.has(sessionId)) {
      this.sessionWords.set(sessionId, new Set());
      console.log(`[SessionWordTracker] Initialized session: ${sessionId}`);
    }
  }

  static addWordToSession(sessionId: string, word: string): void {
    if (!this.sessionWords.has(sessionId)) {
      this.initializeSession(sessionId);
    }
    
    this.sessionWords.get(sessionId)!.add(word.toLowerCase());
    console.log(`[SessionWordTracker] Added word '${word}' to session ${sessionId}`);
  }

  static getSessionWords(sessionId: string): string[] {
    const sessionSet = this.sessionWords.get(sessionId);
    return sessionSet ? Array.from(sessionSet) : [];
  }

  static setCooldown(userId: string, word: string, durationMs: number = 300000): void {
    const key = `${userId}:${word.toLowerCase()}`;
    this.wordCooldowns.set(key, Date.now() + durationMs);
    console.log(`[SessionWordTracker] Set cooldown for word '${word}' (user: ${userId})`);
  }

  static isWordOnCooldown(userId: string, word: string): boolean {
    const key = `${userId}:${word.toLowerCase()}`;
    const cooldownEnd = this.wordCooldowns.get(key);
    
    if (!cooldownEnd) return false;
    
    if (Date.now() > cooldownEnd) {
      this.wordCooldowns.delete(key);
      return false;
    }
    
    return true;
  }

  static async loadRecentWords(userId: string, language: string, limit: number = 20): Promise<string[]> {
    const cacheKey = `${userId}:${language}`;
    
    if (this.recentWordsCache.has(cacheKey)) {
      return this.recentWordsCache.get(cacheKey)!;
    }

    try {
      // In a real implementation, this would query the database
      // For now, return empty array as placeholder
      const recentWords: string[] = [];
      
      this.recentWordsCache.set(cacheKey, recentWords);
      return recentWords;
    } catch (error) {
      console.error('[SessionWordTracker] Error loading recent words:', error);
      return [];
    }
  }

  static clearSession(sessionId: string): void {
    this.sessionWords.delete(sessionId);
    console.log(`[SessionWordTracker] Cleared session: ${sessionId}`);
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [key, cooldownEnd] of this.wordCooldowns.entries()) {
      if (now > cooldownEnd) {
        this.wordCooldowns.delete(key);
      }
    }
    
    // Clear old cache entries (older than 1 hour)
    // This is a simple cleanup strategy
    if (this.recentWordsCache.size > 100) {
      this.recentWordsCache.clear();
    }
  }
}
