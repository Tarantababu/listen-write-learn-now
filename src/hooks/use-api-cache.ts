
import { useState } from 'react';
import { apiCache } from '@/utils/apiCache';

/**
 * React hook that leverages the API cache to prevent duplicate requests
 * and provides loading state management
 */
export function useApiCache() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  /**
   * Fetch data with caching and loading state management
   */
  async function fetchWithCache<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    options: { 
      ttl?: number; 
      allowStale?: boolean;
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<T> {
    try {
      // Set loading state for this key
      setLoadingStates(prev => ({ ...prev, [key]: true }));
      
      // Get data with cache
      const data = await apiCache.get<T>(key, fetchFn, {
        ttl: options.ttl || 60000, // 1 minute default
        allowStale: options.allowStale || false
      });
      
      // Handle success callback
      if (options.onSuccess) {
        options.onSuccess(data);
      }
      
      return data;
    } catch (error) {
      // Handle error callback
      if (options.onError) {
        options.onError(error as Error);
      }
      throw error;
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  }

  /**
   * Invalidate a specific cache key
   */
  function invalidateCache(key: string) {
    apiCache.invalidate(key);
  }

  /**
   * Clear the entire cache
   */
  function clearCache() {
    apiCache.clear();
  }

  return {
    fetchWithCache,
    invalidateCache,
    clearCache,
    isLoading: (key: string) => loadingStates[key] || false,
    loadingStates
  };
}
