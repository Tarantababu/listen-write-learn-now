import { useContext } from 'react';
import { FeatureRoadmapContext } from '@/features/roadmap/context/RoadmapContext';

// Re-export the useRoadmap hook from the context file
export const useRoadmap = () => {
  const context = useContext(FeatureRoadmapContext);
  
  if (!context) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  
  return context;
};

// This is a backup implementation if you want to keep it
export function useRoadmapContext() {
  const context = useContext(FeatureRoadmapContext);
  
  if (!context) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  
  return context;
}
