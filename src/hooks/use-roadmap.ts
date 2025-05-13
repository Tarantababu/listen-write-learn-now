
import { useContext } from 'react';
import { RoadmapContext } from '@/contexts/RoadmapContext';
import { RoadmapContext as NewRoadmapContext } from '@/features/roadmap/context/RoadmapContext';

// Check if we should use the new context implementation
const useNewImplementation = () => {
  try {
    const context = useContext(NewRoadmapContext);
    // If the new context is available and initialized, use it
    if (context && context.roadmaps) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
};

export const useRoadmap = () => {
  const oldContext = useContext(RoadmapContext);
  const newContext = useContext(NewRoadmapContext);
  
  // Use the new implementation if it's available
  if (useNewImplementation()) {
    return newContext;
  }
  
  // Fall back to the old implementation
  if (!oldContext) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  
  return oldContext;
};
