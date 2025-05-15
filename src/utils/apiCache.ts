/**
 * Simple in-memory API cache with TTL support
 * Helps reduce the number of API calls and prevents excessive polling
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number;        // Time-to-live in milliseconds
  allowStale?: boolean; // Whether to return stale data while fetching fresh data
}

class ApiCache {
  private cache: Record<string, CacheItem<any>> = {};
  private pendingPromises: Record<string, Promise<any>> = {};
  
  /**
   * Get data from cache or fetch from API
   * @param key Cache key
   * @param fetchFn Function to fetch data if not in cache
   * @param options Cache options
   */
  async get<T>(key: string, fetchFn: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    const now = Date.now();
    const cachedItem = this.cache[key];
    const ttl = options.ttl || 60000; // Default 1 minute TTL
    
    // If we have pending promise for this key, return that to prevent duplicate requests
    if (this.pendingPromises[key]) {
      return this.pendingPromises[key];
    }
    
    // If we have valid cached data, return it
    if (cachedItem && (now - cachedItem.timestamp < cachedItem.ttl)) {
      return cachedItem.data;
    }
    
    // If we allow stale data and have it, return it but also fetch fresh data
    if (options.allowStale && cachedItem) {
      // Fetch fresh data in background but don't wait for it
      this.fetchAndUpdateCache(key, fetchFn, ttl);
      return cachedItem.data;
    }
    
    // Otherwise fetch fresh data and wait for it
    return this.fetchAndUpdateCache(key, fetchFn, ttl);
  }
  
  /**
   * Invalidate a specific cache key
   * @param key Cache key to invalidate
   */
  invalidate(key: string): void {
    delete this.cache[key];
  }
  
  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache = {};
  }
  
  /**
   * Fetch data and update cache
   */
  private async fetchAndUpdateCache<T>(key: string, fetchFn: () => Promise<T>, ttl: number): Promise<T> {
    try {
      // Store the promise to prevent duplicate requests
      this.pendingPromises[key] = fetchFn();
      const data = await this.pendingPromises[key];
      
      // Update cache with fresh data
      this.cache[key] = {
        data,
        timestamp: Date.now(),
        ttl
      };
      
      return data;
    } catch (error) {
      // If fetch fails, remove from cache to allow retry
      delete this.cache[key];
      throw error;
    } finally {
      // Clean up pending promise
      delete this.pendingPromises[key];
    }
  }
}

// Create singleton instance
export const apiCache = new ApiCache();
