
import { useContext, useCallback } from 'react';
import { RoadmapContext } from '@/features/roadmap/context/RoadmapContext';

/**
 * Custom hook to access the roadmap context with additional loading control
 */
export const useRoadmap = () => {
  const context = useContext(RoadmapContext);
  
  if (context === undefined) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  
  // Add a memoized wrapper around loadUserRoadmaps to prevent excessive calls
  const loadUserRoadmaps = useCallback(
    async (language: string) => {
      // Only attempt to load if there's actually a context and the loading state isn't active
      if (context && !context.isLoading) {
        return context.loadUserRoadmaps(language);
      }
      return Promise.resolve([]);
    },
    [context]
  );
  
  return {
    ...context,
    loadUserRoadmaps // Override with our controlled version
  };
};
