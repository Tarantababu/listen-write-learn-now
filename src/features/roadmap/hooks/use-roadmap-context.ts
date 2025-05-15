
import { useContext } from 'react';
import { RoadmapContext } from '@/features/roadmap/context/RoadmapContext';

export const useRoadmapContext = () => {
  const context = useContext(RoadmapContext);
  
  if (context === undefined) {
    throw new Error('useRoadmapContext must be used within a RoadmapProvider');
  }
  
  return context;
};

export default useRoadmapContext;
