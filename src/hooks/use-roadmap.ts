
import { useContext } from 'react';
import { RoadmapContext } from '@/features/roadmap/context/RoadmapContext';

/**
 * Custom hook to access the roadmap context
 */
export const useRoadmap = () => {
  const context = useContext(RoadmapContext);
  
  if (context === undefined) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  
  return context;
};
