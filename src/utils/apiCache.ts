interface CacheOptions {
  ttl?: number;
  allowStale?: boolean;
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

/**
 * Simple API cache utility to reduce API calls
 */
class ApiCache {
  private cache: Record<string, CacheItem<any>> = {};
  private defaultTTL = 300000; // 5 minutes default TTL

  /**
   * Get data from cache or fetch it
   */
  async get<T>(key: string, fetchFn: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    const now = Date.now();
    const cachedItem = this.cache[key];
    const ttl = options.ttl || this.defaultTTL;
    
    // If we have a cached item that's not expired, return it
    if (cachedItem && now < cachedItem.expiry) {
      return cachedItem.data;
    }
    
    // If we have a stale item and allowStale is true, use it while fetching new data
    if (cachedItem && options.allowStale) {
      // Start fetching new data in the background
      this.refreshCache(key, fetchFn, ttl).catch(console.error);
      // Return the stale data immediately
      return cachedItem.data;
    }
    
    // Otherwise, fetch new data and cache it
    return this.refreshCache(key, fetchFn, ttl);
  }
  
  /**
   * Force refresh of cached data
   */
  async refreshCache<T>(key: string, fetchFn: () => Promise<T>, ttl: number): Promise<T> {
    try {
      const data = await fetchFn();
      this.cache[key] = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + ttl
      };
      return data;
    } catch (error) {
      // If we have a stale version, return it on error
      if (this.cache[key]) {
        console.warn(`Error refreshing ${key}, using stale data:`, error);
        return this.cache[key].data;
      }
      throw error;
    }
  }
  
  /**
   * Invalidate a cached item
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
   * Check if an item is in the cache
   */
  has(key: string): boolean {
    return !!this.cache[key];
  }
}

// Export a singleton instance
export const apiCache = new ApiCache();
