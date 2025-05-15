
import { useContext } from 'react';
import { RoadmapContext } from '@/contexts/RoadmapContext';
import { RoadmapContextType } from '@/types';

export function useRoadmap(): RoadmapContextType {
  const context = useContext(RoadmapContext);
  
  if (!context) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  
  return context;
}

export default useRoadmap;
