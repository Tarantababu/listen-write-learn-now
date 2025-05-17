import { useContext } from 'react';
import { RoadmapContext } from '@/contexts/RoadmapContext';

// Re-export the useRoadmap hook from the context file
export { useRoadmap } from '@/contexts/RoadmapContext';

// This is a backup implementation if you want to keep it
export function useRoadmapContext() {
  const context = useContext(RoadmapContext);
  
  if (!context) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  
  return context;
}
