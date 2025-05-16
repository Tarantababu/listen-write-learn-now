
import { useContext } from 'react';
import { RoadmapContext } from '@/features/roadmap/context/RoadmapContext';

/**
 * Custom hook to access the curriculum context
 * Note: This was previously called "roadmap" but refers to the same feature
 */
export const useRoadmap = () => {
  const context = useContext(RoadmapContext);
  
  if (context === undefined) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  
  return context;
};

/**
 * Alias for useRoadmap to support new terminology
 */
export const useCurriculum = useRoadmap;
