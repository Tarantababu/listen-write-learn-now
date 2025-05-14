
import { useContext, useCallback, useRef } from 'react';
import { RoadmapContext } from '@/features/roadmap/context/RoadmapContext';
import { Language } from '@/types';

/**
 * Custom hook to access the roadmap context with additional loading control
 */
export const useRoadmap = () => {
  const context = useContext(RoadmapContext);
  const loadingRef = useRef<{[key: string]: boolean}>({});
  
  if (context === undefined) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  
  // Add a memoized wrapper around loadUserRoadmaps to prevent excessive calls
  const loadUserRoadmaps = useCallback(
    async (language: Language) => {
      // Create a cache key based on the language
      const cacheKey = `load_roadmaps_${language}`;
      
      // Prevent duplicate loads for the same language
      if (loadingRef.current[cacheKey]) {
        console.log(`Already loading user roadmaps for ${language}, skipping duplicate request`);
        return context.userRoadmaps; // Return current roadmaps instead of triggering new request
      }
      
      // Only attempt to load if there's actually a context and the loading state isn't active
      if (context && !context.isLoading) {
        console.log(`Loading user roadmaps for ${language}`);
        loadingRef.current[cacheKey] = true;
        
        try {
          const result = await context.loadUserRoadmaps(language);
          return result;
        } finally {
          // Clear the loading flag after a delay to prevent immediate retriggering
          setTimeout(() => {
            loadingRef.current[cacheKey] = false;
          }, 2000); // 2 second cooldown
        }
      }
      
      return Promise.resolve(context.userRoadmaps);
    },
    [context]
  );
  
  return {
    ...context,
    loadUserRoadmaps // Override with our controlled version
  };
};
