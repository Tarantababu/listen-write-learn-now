
import { useContext } from 'react';
import { RoadmapContext } from '@/contexts/RoadmapContext';

/**
 * Custom hook to access the roadmap context
 */
export const useRoadmap = () => {
  const context = useContext(RoadmapContext);
  
  if (context === undefined) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  
  return {
    ...context,
    isLoading: context.loading,
    hasError: context.loading === false && context.currentRoadmap === null
  };
};
