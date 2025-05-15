/**
 * Simple cache utility to prevent redundant API calls
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  stale: boolean;
}

interface CacheConfig {
  defaultTTL: number;  // Time to live in milliseconds
  staleTTL: number;    // Time after which data is considered stale but still usable
}

class ApiCache {
  private cache: Record<string, CacheItem<any>> = {};
  private config: CacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    staleTTL: 30 * 60 * 1000   // 30 minutes
  };

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Get data from cache or fetch it with the provided function
   */
  async get<T>(
    key: string, 
    fetchFn: () => Promise<T>,
    options?: { 
      ttl?: number;
      forceRefresh?: boolean;
      allowStale?: boolean;
    }
  ): Promise<T> {
    const now = Date.now();
    const ttl = options?.ttl || this.config.defaultTTL;
    const allowStale = options?.allowStale !== false;
    
    // Check if we have valid cache
    const cacheItem = this.cache[key];
    const hasValidCache = cacheItem && (now - cacheItem.timestamp < ttl);
    const hasStaleCache = allowStale && cacheItem && (now - cacheItem.timestamp < this.config.staleTTL);
    
    // Use cache if valid and not forced to refresh
    if (!options?.forceRefresh && (hasValidCache || hasStaleCache)) {
      // Mark data as stale if it's past TTL but within staleTTL
      if (!hasValidCache && hasStaleCache) {
        cacheItem.stale = true;
      }
      return cacheItem.data;
    }

    try {
      // Fetch fresh data
      const data = await fetchFn();
      
      // Store in cache
      this.cache[key] = {
        data,
        timestamp: now,
        stale: false
      };
      
      return data;
    } catch (error) {
      // If we have stale data, return it on error
      if (cacheItem && allowStale) {
        console.warn(`Error fetching fresh data for ${key}, using stale data:`, error);
        cacheItem.stale = true;
        return cacheItem.data;
      }
      
      // Otherwise, propagate the error
      throw error;
    }
  }

  /**
   * Manually set data in the cache
   */
  set<T>(key: string, data: T): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
      stale: false
    };
  }

  /**
   * Check if data is cached and fresh
   */
  isFresh(key: string): boolean {
    const cacheItem = this.cache[key];
    return cacheItem && (Date.now() - cacheItem.timestamp < this.config.defaultTTL);
  }

  /**
   * Check if data exists in cache (fresh or stale)
   */
  has(key: string): boolean {
    return !!this.cache[key];
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(key: string): void {
    delete this.cache[key];
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache = {};
  }
}

// Create a singleton instance
export const apiCache = new ApiCache();
