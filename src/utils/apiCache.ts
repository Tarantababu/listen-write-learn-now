
interface CacheOptions {
  ttl?: number;      // Time to live in milliseconds
  allowStale?: boolean; // Allow serving stale data while refreshing
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

class ApiCache {
  private cache: Record<string, CacheEntry<any>> = {};
  private DEFAULT_TTL = 60000; // 1 minute default
  
  /**
   * Get data from cache or fetch it if not available/expired
   */
  async get<T>(
    key: string, 
    fetchFn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const ttl = options?.ttl || this.DEFAULT_TTL;
    const allowStale = options?.allowStale || false;
    const entry = this.cache[key];
    const now = Date.now();
    
    // If we have a valid cache entry that's not expired
    if (entry && (now - entry.timestamp < ttl)) {
      return entry.data;
    }
    
    // If we allow stale data and have a stale entry
    if (allowStale && entry) {
      // Mark as stale and refresh in background
      this.cache[key] = {
        ...entry,
        isStale: true
      };
      
      // Fetch new data in background without blocking
      this.refreshInBackground(key, fetchFn, ttl);
      
      // Return stale data immediately
      return entry.data;
    }
    
    // No cache or expired and we don't allow stale - fetch new data
    return this.fetchAndCache(key, fetchFn, ttl);
  }
  
  /**
   * Fetch and cache data
   */
  private async fetchAndCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    try {
      const data = await fetchFn();
      this.cache[key] = {
        data,
        timestamp: Date.now(),
        isStale: false
      };
      return data;
    } catch (error) {
      // If fetch fails and we have stale data, return that as fallback
      if (this.cache[key]) {
        console.warn(`Failed to fetch fresh data for ${key}, using stale data`);
        return this.cache[key].data;
      }
      throw error;
    }
  }
  
  /**
   * Refresh data in background without blocking
   */
  private refreshInBackground<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number
  ): void {
    // Use setTimeout to avoid blocking the main thread
    setTimeout(() => {
      this.fetchAndCache(key, fetchFn, ttl)
        .catch(err => console.error(`Background refresh failed for ${key}:`, err));
    }, 0);
  }
  
  /**
   * Invalidate a cache entry
   */
  invalidate(key: string): void {
    delete this.cache[key];
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache = {};
  }
}

export const apiCache = new ApiCache();
