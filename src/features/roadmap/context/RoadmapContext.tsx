
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { roadmapService } from '../services/RoadmapService';
import { RoadmapItem, RoadmapNode, ExerciseContent, NodeCompletionResult } from '../types';
import { Language, LanguageLevel } from '@/types';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { toast } from '@/components/ui/use-toast';

// Define the context type
interface RoadmapContextType {
  // State
  isLoading: boolean;
  nodeLoading: boolean;
  roadmaps: RoadmapItem[];
  userRoadmaps: RoadmapItem[];
  currentRoadmap: RoadmapItem | null;
  nodes: RoadmapNode[];
  // Derived state
  currentNodeId: string | undefined;
  currentNode: RoadmapNode | null;
  completedNodes: string[];
  availableNodes: string[];
  nodeProgress: Array<{ nodeId: string, completionCount: number, isCompleted: boolean }>;
  // Actions
  loadRoadmaps: (language: Language) => Promise<void>;
  loadUserRoadmaps: (language: Language) => Promise<RoadmapItem[]>;
  initializeRoadmap: (level: LanguageLevel, language: Language) => Promise<string>;
  initializeUserRoadmap: (level: LanguageLevel, language: Language) => Promise<string>; // Alias for backward compatibility
  selectRoadmap: (roadmapId: string) => Promise<RoadmapNode[]>;
  getNodeExercise: (nodeId: string) => Promise<ExerciseContent | null>;
  recordNodeCompletion: (nodeId: string, accuracy: number) => Promise<NodeCompletionResult>;
  incrementNodeCompletion: (nodeId: string, accuracy: number) => Promise<NodeCompletionResult>; // Alias for backward compatibility
  markNodeAsCompleted: (nodeId: string) => Promise<void>;
}

// Create the context with default values
export const RoadmapContext = createContext<RoadmapContextType>({
  isLoading: false,
  nodeLoading: false,
  roadmaps: [],
  userRoadmaps: [],
  currentRoadmap: null,
  nodes: [],
  currentNodeId: undefined,
  currentNode: null,
  completedNodes: [],
  availableNodes: [],
  nodeProgress: [],
  loadRoadmaps: async () => {},
  loadUserRoadmaps: async () => [],
  initializeRoadmap: async () => '',
  initializeUserRoadmap: async () => '',
  selectRoadmap: async () => [],
  getNodeExercise: async () => null,
  recordNodeCompletion: async () => ({ isCompleted: false, completionCount: 0 }),
  incrementNodeCompletion: async () => ({ isCompleted: false, completionCount: 0 }),
  markNodeAsCompleted: async () => {},
});

// Create the provider component
interface RoadmapProviderProps {
  children: ReactNode;
}

export const RoadmapProvider: React.FC<RoadmapProviderProps> = ({ children }) => {
  // State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [nodeLoading, setNodeLoading] = useState<boolean>(false);
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [userRoadmaps, setUserRoadmaps] = useState<RoadmapItem[]>([]);
  const [currentRoadmap, setCurrentRoadmap] = useState<RoadmapItem | null>(null);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [nodeProgress, setNodeProgress] = useState<Array<{ nodeId: string, completionCount: number, isCompleted: boolean }>>([]);
  
  // Get user's selected language
  const { settings } = useUserSettingsContext();
  
  // Load roadmaps on language change
  useEffect(() => {
    if (settings.selectedLanguage) {
      loadUserRoadmaps(settings.selectedLanguage);
      loadRoadmaps(settings.selectedLanguage);
    }
  }, [settings.selectedLanguage]);
  
  // Load all roadmaps for the selected language
  const loadRoadmaps = useCallback(async (language: Language) => {
    setIsLoading(true);
    try {
      const result = await roadmapService.getRoadmapsByLanguage(language);
      if (result.success) {
        setRoadmaps(result.data);
      } else {
        console.error('Error loading roadmaps:', result.message);
        toast({
          variant: "destructive",
          title: "Failed to load roadmaps",
          description: "There was an error loading available roadmaps."
        });
      }
    } catch (error) {
      console.error('Error loading roadmaps:', error);
      toast({
        variant: "destructive",
        title: "Failed to load roadmaps",
        description: "There was an error loading available roadmaps."
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load user's roadmaps for the selected language
  const loadUserRoadmaps = useCallback(async (language: Language): Promise<RoadmapItem[]> => {
    setIsLoading(true);
    try {
      const result = await roadmapService.getUserRoadmaps(language);
      if (result.success) {
        const userRoadmapsData = result.data;
        setUserRoadmaps(userRoadmapsData);
        
        // If we have user roadmaps and none is currently selected, select the first one
        if (userRoadmapsData.length > 0 && !currentRoadmap) {
          await selectRoadmap(userRoadmapsData[0].id);
        }
        
        return userRoadmapsData;
      } else {
        console.error('Error loading user roadmaps:', result.message);
        toast({
          variant: "destructive",
          title: "Failed to load your roadmaps",
          description: "There was an error loading your roadmaps."
        });
        return [];
      }
    } catch (error) {
      console.error('Error loading user roadmaps:', error);
      toast({
        variant: "destructive",
        title: "Failed to load your roadmaps",
        description: "There was an error loading your roadmaps."
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentRoadmap]);

  // Initialize a new roadmap for the user based on level
  const initializeRoadmap = useCallback(async (level: LanguageLevel, language: Language): Promise<string> => {
    setIsLoading(true);
    try {
      const result = await roadmapService.initializeRoadmap(level, language);
      if (result.success) {
        // Reload user roadmaps to include the new one
        await loadUserRoadmaps(language);
        
        // Return the ID of the newly created roadmap
        return result.data;
      } else {
        console.error('Error initializing roadmap:', result.message);
        toast({
          variant: "destructive",
          title: "Failed to create roadmap",
          description: "There was an error creating your roadmap."
        });
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error initializing roadmap:', error);
      toast({
        variant: "destructive",
        title: "Failed to create roadmap",
        description: "There was an error creating your roadmap."
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadUserRoadmaps]);
  
  // Create an alias for initializeRoadmap for backward compatibility
  const initializeUserRoadmap = initializeRoadmap;

  // Select a roadmap and load its nodes
  const selectRoadmap = useCallback(async (roadmapId: string): Promise<RoadmapNode[]> => {
    setIsLoading(true);
    try {
      console.log('Selecting roadmap with ID:', roadmapId);
      console.log('Available user roadmaps:', userRoadmaps);
      
      // Find the roadmap in user roadmaps
      const roadmap = userRoadmaps.find(r => r.id === roadmapId);
      if (!roadmap) {
        console.error('Roadmap not found with ID:', roadmapId);
        console.error('Available roadmap IDs:', userRoadmaps.map(r => r.id));
        
        // If the roadmap is not found, try to refresh the user roadmaps first
        await loadUserRoadmaps(settings.selectedLanguage);
        
        // Try again after refreshing
        const updatedRoadmap = userRoadmaps.find(r => r.id === roadmapId);
        if (!updatedRoadmap) {
          throw new Error('Roadmap not found');
        }
        
        setCurrentRoadmap(updatedRoadmap);
      } else {
        setCurrentRoadmap(roadmap);
      }
      
      // Load the nodes for this roadmap
      const result = await roadmapService.getRoadmapNodes(roadmapId);
      if (result.success) {
        const nodesData = result.data;
        setNodes(nodesData);
        
        // Extract node progress information
        const progressData = nodesData.map(node => ({
          nodeId: node.id,
          completionCount: node.progressCount || 0,
          isCompleted: node.status === 'completed'
        }));
        setNodeProgress(progressData);
        
        return nodesData;
      } else {
        console.error('Error loading nodes:', result.message);
        toast({
          variant: "destructive",
          title: "Failed to load roadmap details",
          description: "There was an error loading the roadmap nodes."
        });
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error selecting roadmap:', error);
      toast({
        variant: "destructive",
        title: "Failed to load roadmap",
        description: "There was an error loading the roadmap details."
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userRoadmaps, settings.selectedLanguage, loadUserRoadmaps]);

  // Get exercise content for a roadmap node
  const getNodeExercise = useCallback(async (nodeId: string): Promise<ExerciseContent | null> => {
    try {
      // Implementation would call the appropriate service method
      // For now, just return null
      return null;
    } catch (error) {
      console.error('Error getting node exercise:', error);
      toast({
        variant: "destructive",
        title: "Failed to load exercise",
        description: "There was an error loading the exercise content."
      });
      return null;
    }
  }, []);

  // Record completion of a node with accuracy score
  const recordNodeCompletion = useCallback(async (nodeId: string, accuracy: number): Promise<NodeCompletionResult> => {
    setNodeLoading(true);
    try {
      // Implementation would call the appropriate service method
      // For now, simulate a successful completion
      
      // Refresh nodes to update status after completion
      if (currentRoadmap) {
        await selectRoadmap(currentRoadmap.id);
      }
      
      // Simulate a result
      return { isCompleted: true, completionCount: 1 };
    } catch (error) {
      console.error('Error recording completion:', error);
      toast({
        variant: "destructive",
        title: "Failed to save progress",
        description: "There was an error saving your progress."
      });
      throw error;
    } finally {
      setNodeLoading(false);
    }
  }, [currentRoadmap, selectRoadmap]);
  
  // Create an alias for recordNodeCompletion for backward compatibility
  const incrementNodeCompletion = recordNodeCompletion;

  // Mark a node as completed manually
  const markNodeAsCompleted = useCallback(async (nodeId: string): Promise<void> => {
    setNodeLoading(true);
    try {
      // Implementation would call the appropriate service method
      
      // Refresh nodes after completion
      if (currentRoadmap) {
        await selectRoadmap(currentRoadmap.id);
      }
    } catch (error) {
      console.error('Error marking node as completed:', error);
      toast({
        variant: "destructive",
        title: "Failed to complete lesson",
        description: "There was an error marking the lesson as completed."
      });
      throw error;
    } finally {
      setNodeLoading(false);
    }
  }, [currentRoadmap, selectRoadmap]);

  // Derived values from state
  const currentNodeId = currentRoadmap?.currentNodeId;
  const currentNode = nodes.find(n => n.id === currentNodeId) || null;
  const completedNodes = nodes.filter(n => n.status === 'completed').map(n => n.id);
  const availableNodes = nodes.filter(n => n.status === 'available').map(n => n.id);

  // Context provider value
  const value: RoadmapContextType = {
    isLoading,
    nodeLoading,
    roadmaps,
    userRoadmaps,
    currentRoadmap,
    nodes,
    currentNodeId,
    currentNode,
    completedNodes,
    availableNodes,
    nodeProgress,
    loadRoadmaps,
    loadUserRoadmaps,
    initializeRoadmap,
    initializeUserRoadmap,
    selectRoadmap,
    getNodeExercise,
    recordNodeCompletion,
    incrementNodeCompletion,
    markNodeAsCompleted,
  };

  return (
    <RoadmapContext.Provider value={value}>
      {children}
    </RoadmapContext.Provider>
  );
};

// Custom hook to use the roadmap context
export const useRoadmap = () => {
  const context = useContext(RoadmapContext);
  if (context === undefined) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  return context;
};
