
import { useContext } from 'react';
import { RoadmapContext, RoadmapContextType } from '@/contexts/RoadmapContext';
import { RoadmapContext as NewRoadmapContext, RoadmapContextType as NewRoadmapContextType } from '@/features/roadmap/context/RoadmapContext';
import { Language, LanguageLevel } from '@/types';
import { RoadmapItem, RoadmapNode, ExerciseContent, NodeCompletionResult } from '@/features/roadmap/types';

/**
 * Type definition that combines both old and new context types
 * This ensures that all required properties are available regardless of which context is used
 */
export interface UnifiedRoadmapContextType {
  // Common state properties
  isLoading?: boolean;
  loading?: boolean;
  nodeLoading?: boolean;
  hasError?: boolean;
  
  // Data properties
  roadmaps?: RoadmapItem[];
  userRoadmaps?: RoadmapItem[];
  currentRoadmap?: RoadmapItem | RoadmapNode[] | null;
  nodes?: RoadmapNode[];
  completedNodes?: string[];
  availableNodes?: string[];
  currentNodeId?: string;
  currentNode?: RoadmapNode | null;
  nodeProgress?: any[];
  
  // Methods common to both contexts
  initializeRoadmap?: (level: LanguageLevel, language: Language) => Promise<string>;
  initializeUserRoadmap?: (level: LanguageLevel, language: Language) => Promise<string>;
  loadRoadmaps?: (language: Language) => Promise<void>;
  loadUserRoadmaps?: (language: Language) => Promise<RoadmapItem[]>;
  selectRoadmap?: (roadmapId: string) => Promise<RoadmapNode[]>;
  getNodeExercise?: (nodeId: string) => Promise<ExerciseContent | null>;
  recordNodeCompletion?: (nodeId: string, accuracy: number) => Promise<NodeCompletionResult>;
  incrementNodeCompletion?: (nodeId: string, accuracy: number) => Promise<NodeCompletionResult>;
  markNodeAsCompleted?: (nodeId: string) => Promise<void>;
}

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

/**
 * Custom hook that provides access to the roadmap context.
 * It first tries to use the new implementation, and falls back to the old one.
 * Returns a unified context type that works with both implementations.
 */
export const useRoadmap = (): UnifiedRoadmapContextType => {
  const oldContext = useContext(RoadmapContext);
  const newContext = useContext(NewRoadmapContext);
  
  // Use the new implementation if it's available
  if (useNewImplementation()) {
    return newContext as unknown as UnifiedRoadmapContextType;
  }
  
  // Fall back to the old implementation
  if (!oldContext) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  
  return oldContext as unknown as UnifiedRoadmapContextType;
};
