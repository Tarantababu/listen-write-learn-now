
import { useContext } from 'react';
import { RoadmapContext as OldRoadmapContext } from '@/contexts/RoadmapContext';
import { RoadmapContext as NewRoadmapContext } from '@/features/roadmap/context/RoadmapContext';

/**
 * Type definition that combines both old and new context types
 * This ensures that all required properties are available regardless of which context is used
 */
export type UnifiedRoadmapContextType = {
  // Common state properties
  isLoading?: boolean;
  loading?: boolean;
  nodeLoading?: boolean;
  hasError?: boolean;
  
  // Data properties
  roadmaps?: any[];
  userRoadmaps?: any[];
  currentRoadmap?: any;
  nodes?: any[];
  completedNodes?: string[];
  availableNodes?: string[];
  currentNodeId?: string;
  currentNode?: any;
  nodeProgress?: any[];
  
  // Methods common to both contexts
  initializeRoadmap?: (level: any, language: any) => Promise<string>;
  initializeUserRoadmap?: (level: any, language: any) => Promise<string>;
  loadRoadmaps?: (language: any) => Promise<void>;
  loadUserRoadmaps?: (language: any) => Promise<any[]>;
  selectRoadmap?: (roadmapId: string) => Promise<any[]>;
  getNodeExercise?: (nodeId: string) => Promise<any>;
  recordNodeCompletion?: (nodeId: string, accuracy: number) => Promise<any>;
  incrementNodeCompletion?: (nodeId: string, accuracy: number) => Promise<any>;
  markNodeAsCompleted?: (nodeId: string) => Promise<void>;
};

/**
 * Custom hook that provides access to the roadmap context.
 * It first tries to use the new implementation, and falls back to the old one.
 * Returns a unified context type that works with both implementations.
 */
export function useRoadmap(): UnifiedRoadmapContextType {
  // Try using the new context first
  const newContext = useContext(NewRoadmapContext);
  
  // Fall back to old context if needed
  const oldContext = useContext(OldRoadmapContext);
  
  // We prefer to use the new context, but fall back to the old one 
  const context = newContext || oldContext;
  
  if (!context) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  
  return context as UnifiedRoadmapContextType;
}

// Re-export from components/ui/use-toast.ts for easier imports
export { toast } from '@/components/ui/use-toast';
