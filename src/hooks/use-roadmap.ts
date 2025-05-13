
import { useContext } from 'react';
import { RoadmapContext, RoadmapContextType } from '@/contexts/RoadmapContext';

export const useRoadmap = (): RoadmapContextType => {
  const context = useContext(RoadmapContext);
  
  if (!context) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  
  return context;
};
