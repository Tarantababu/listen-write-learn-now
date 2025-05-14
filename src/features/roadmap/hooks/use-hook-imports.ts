
// Re-export the hook from the main codebase
import { useRoadmap } from '@/hooks/use-roadmap';
import { Language, LanguageLevel } from '@/types';
import { RoadmapNode, RoadmapItem } from '../types';

// Define the UnifiedRoadmapContextType to match both old and new context types
export type UnifiedRoadmapContextType = {
  // Core properties
  isLoading?: boolean;
  loading?: boolean;
  hasError?: boolean;
  
  // Data properties
  roadmaps?: RoadmapItem[];
  userRoadmaps?: RoadmapItem[];
  nodes?: RoadmapNode[];
  currentRoadmap?: RoadmapItem | RoadmapNode[];
  availableNodes?: string[];
  completedNodes?: string[];
  nodeProgress?: any[];
  
  // ID references
  currentNodeId?: string;
  currentNode?: RoadmapNode | null;
  
  // Methods
  initializeRoadmap?: (level: LanguageLevel, language: Language) => Promise<string>;
  initializeUserRoadmap?: (level: LanguageLevel, language: Language) => Promise<string>;
  loadRoadmaps?: (language: Language) => Promise<void>;
  loadUserRoadmaps?: (language: Language) => Promise<any[]>;
  selectRoadmap?: (roadmapId: string) => Promise<RoadmapNode[]>;
  recordNodeCompletion?: (nodeId: string, accuracy: number) => Promise<any>;
  fetchRoadmap?: () => Promise<void>;
  fetchNodeProgress?: () => Promise<void>;
  fetchCompletedNodes?: () => Promise<void>;
  nodeLoading?: boolean;
  getNodeExercise?: (nodeId: string) => Promise<any>;
  markNodeAsCompleted?: (nodeId: string) => Promise<void>;
  incrementNodeCompletion?: (nodeId: string, accuracy: number) => Promise<{
    isCompleted: boolean;
    nextNodeId?: string;
  }>;
  currentLanguage?: Language;
  setCurrentLanguage?: (language: Language) => void;
};

export { 
  useRoadmap,
  type Language
};
