
import { useContext } from 'react';
import { RoadmapContext as OldRoadmapContext } from '@/contexts/RoadmapContext';
import { RoadmapContext as NewRoadmapContext } from '@/features/roadmap/context/RoadmapContext';

/**
 * Custom hook that provides access to the roadmap context.
 * It first tries to use the new implementation, and falls back to the old one.
 */
export function useRoadmap() {
  // Try using the new context first
  const newContext = useContext(NewRoadmapContext);
  
  // Fall back to old context if needed
  const oldContext = useContext(OldRoadmapContext);
  
  // We prefer to use the new context, but fall back to the old one 
  const context = newContext || oldContext;
  
  if (!context) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  
  return context;
}

// Re-export from components/ui/use-toast.ts for easier imports
export { toast } from '@/components/ui/use-toast';
