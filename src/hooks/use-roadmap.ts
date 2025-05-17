
import { useContext } from 'react';
import { FeatureRoadmapContext } from '@/features/roadmap/context/RoadmapContext';
import { RoadmapContext } from '@/contexts/RoadmapContext';

/**
 * This hook merges access to both roadmap contexts in the application.
 * It first tries to use the feature-specific roadmap context, and falls back to the global one.
 */
export const useRoadmap = () => {
  // First try the feature-specific context
  const featureContext = useContext(FeatureRoadmapContext);
  // Then try the global context
  const globalContext = useContext(RoadmapContext);
  
  // Use feature context if available, otherwise fall back to global context
  const context = featureContext || globalContext;
  
  if (!context) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  
  return context;
};

// This is a backup implementation if you want to keep it
export function useRoadmapContext() {
  return useRoadmap();
}
