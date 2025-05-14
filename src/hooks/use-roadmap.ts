
import { useContext } from 'react';
import { RoadmapContext } from '@/contexts/RoadmapContext';
import type { RoadmapContextType } from '@/types';

/**
 * Custom hook to access the roadmap context
 */
export const useRoadmap = (): RoadmapContextType => {
  const context = useContext(RoadmapContext);
  
  if (context === undefined) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  
  return context;
};
