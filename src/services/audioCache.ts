
interface CachedAudio {
  url: string;
  timestamp: number;
  text: string;
  language: string;
}

interface AudioCacheEntry {
  versions: CachedAudio[];
  currentIndex: number;
}

class AudioCacheService {
  private cache = new Map<string, AudioCacheEntry>();
  private readonly MAX_VERSIONS_PER_SENTENCE = 3;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  private generateCacheKey(text: string, language: string): string {
    // Create a stable key based on normalized text and language
    const normalizedText = text.trim().toLowerCase().replace(/\s+/g, ' ');
    return `${language}:${btoa(normalizedText)}`;
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.CACHE_DURATION;
  }

  getCachedAudio(text: string, language: string): string | null {
    const key = this.generateCacheKey(text, language);
    const entry = this.cache.get(key);

    if (!entry || entry.versions.length === 0) {
      return null;
    }

    // Clean up expired versions
    entry.versions = entry.versions.filter(version => !this.isExpired(version.timestamp));

    if (entry.versions.length === 0) {
      this.cache.delete(key);
      return null;
    }

    // Return the current version (cycling through available versions)
    const currentVersion = entry.versions[entry.currentIndex % entry.versions.length];
    
    // Move to next version for future requests (provides natural variation)
    entry.currentIndex = (entry.currentIndex + 1) % entry.versions.length;

    return currentVersion.url;
  }

  cacheAudio(text: string, language: string, audioUrl: string): void {
    const key = this.generateCacheKey(text, language);
    const timestamp = Date.now();

    let entry = this.cache.get(key);

    if (!entry) {
      entry = {
        versions: [],
        currentIndex: 0
      };
      this.cache.set(key, entry);
    }

    // Check if this exact URL is already cached
    const existingVersion = entry.versions.find(version => version.url === audioUrl);
    if (existingVersion) {
      // Update timestamp for existing version
      existingVersion.timestamp = timestamp;
      return;
    }

    // Add new version
    const newVersion: CachedAudio = {
      url: audioUrl,
      timestamp,
      text,
      language
    };

    entry.versions.push(newVersion);

    // Limit the number of versions per sentence
    if (entry.versions.length > this.MAX_VERSIONS_PER_SENTENCE) {
      // Remove the oldest version
      entry.versions.shift();
      // Adjust current index if needed
      if (entry.currentIndex > 0) {
        entry.currentIndex--;
      }
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  clearExpiredEntries(): void {
    for (const [key, entry] of this.cache.entries()) {
      entry.versions = entry.versions.filter(version => !this.isExpired(version.timestamp));
      
      if (entry.versions.length === 0) {
        this.cache.delete(key);
      } else {
        // Reset current index if it's out of bounds
        entry.currentIndex = entry.currentIndex % entry.versions.length;
      }
    }
  }

  getCacheStats(): { totalEntries: number; totalVersions: number } {
    let totalVersions = 0;
    for (const entry of this.cache.values()) {
      totalVersions += entry.versions.length;
    }

    return {
      totalEntries: this.cache.size,
      totalVersions
    };
  }
}

export const audioCache = new AudioCacheService();

// Periodically clean up expired entries
if (typeof window !== 'undefined') {
  setInterval(() => {
    audioCache.clearExpiredEntries();
  }, 60 * 60 * 1000); // Clean up every hour
}
