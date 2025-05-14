
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Language } from '@/types';
import { RoadmapItem, RoadmapNode, ExerciseContent, NodeCompletionResult } from '@/features/roadmap/types';
import { roadmapService } from '@/features/roadmap/api/roadmapService';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { toast } from '@/hooks/use-toast';

// Define the shape of our context
interface RoadmapContextType {
  roadmaps: RoadmapItem[];
  userRoadmaps: RoadmapItem[];
  currentRoadmap: RoadmapItem | null;
  nodes: RoadmapNode[];
  currentNodeId?: string;
  completedNodes: string[];
  availableNodes: string[];
  isLoading: boolean;
  hasError: boolean;
  loadRoadmaps: (language: Language) => Promise<void>;
  loadUserRoadmaps: (language: Language) => Promise<RoadmapItem[]>;
  initializeUserRoadmap: (roadmapId: string) => Promise<void>;
  selectRoadmap: (roadmapId: string) => Promise<void>;
  getNodeExercise: (nodeId: string) => Promise<ExerciseContent | null>;
  completeNode: (nodeId: string) => Promise<NodeCompletionResult>;
}

const RoadmapContext = createContext<RoadmapContextType | undefined>(undefined);

export const RoadmapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { settings } = useUserSettingsContext();
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [userRoadmaps, setUserRoadmaps] = useState<RoadmapItem[]>([]);
  const [currentRoadmap, setCurrentRoadmap] = useState<RoadmapItem | null>(null);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Derived state
  const completedNodes = nodes.filter(node => node.status === 'completed').map(node => node.id);
  const availableNodes = nodes.filter(node => node.status === 'available').map(node => node.id);
  const currentNodeId = currentRoadmap?.currentNodeId;

  // Load roadmaps on component mount
  useEffect(() => {
    loadRoadmaps(settings.selectedLanguage);
  }, [settings.selectedLanguage]);

  // Load all roadmaps for a language
  const loadRoadmaps = async (language: Language) => {
    try {
      setIsLoading(true);
      setHasError(false);
      
      const roadmapData = await roadmapService.getRoadmapsForLanguage(language);
      setRoadmaps(roadmapData);
      
      // Also load user roadmaps
      await loadUserRoadmaps(language);
    } catch (error) {
      console.error('Error loading roadmaps:', error);
      setHasError(true);
      toast({
        variant: "destructive",
        title: "Failed to load roadmaps",
        description: "There was an error loading the roadmap data."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load user's roadmaps
  const loadUserRoadmaps = async (language: Language): Promise<RoadmapItem[]> => {
    try {
      const userRoadmapData = await roadmapService.getUserRoadmaps(language);
      setUserRoadmaps(userRoadmapData);
      
      // If we have user roadmaps and no currently selected roadmap,
      // select the first one
      if (userRoadmapData.length > 0 && !currentRoadmap) {
        await selectRoadmap(userRoadmapData[0].id);
      }
      
      return userRoadmapData;
    } catch (error) {
      console.error('Error loading user roadmaps:', error);
      toast({
        variant: "destructive",
        title: "Failed to load your roadmaps",
        description: "There was an error loading your roadmap data."
      });
      return [];
    }
  };

  // Initialize a new roadmap for the user
  const initializeUserRoadmap = async (roadmapId: string) => {
    try {
      setIsLoading(true);
      const newUserRoadmapId = await roadmapService.initializeRoadmap(roadmapId);
      
      // Reload user roadmaps to include the new one
      await loadUserRoadmaps(settings.selectedLanguage);
      
      // Select the newly created roadmap
      await selectRoadmap(newUserRoadmapId);
      
      toast({
        title: "Roadmap initialized",
        description: "Your new learning roadmap is ready to start."
      });
    } catch (error) {
      console.error('Error initializing roadmap:', error);
      toast({
        variant: "destructive",
        title: "Failed to initialize roadmap",
        description: "There was an error setting up your roadmap."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Select a specific roadmap and load its nodes
  const selectRoadmap = async (roadmapId: string) => {
    try {
      setIsLoading(true);
      
      // Find the roadmap in user roadmaps
      const selectedRoadmap = userRoadmaps.find(r => r.id === roadmapId);
      
      if (!selectedRoadmap) {
        throw new Error('Roadmap not found');
      }
      
      setCurrentRoadmap(selectedRoadmap);
      
      // Load nodes for this roadmap
      const nodeData = await roadmapService.getRoadmapNodes(selectedRoadmap.id);
      setNodes(nodeData);
    } catch (error) {
      console.error('Error selecting roadmap:', error);
      toast({
        variant: "destructive",
        title: "Failed to load roadmap",
        description: "There was an error loading the roadmap content."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get exercise content for a node
  const getNodeExercise = async (nodeId: string) => {
    try {
      return await roadmapService.getNodeExercise(nodeId);
    } catch (error) {
      console.error('Error getting node exercise:', error);
      toast({
        variant: "destructive",
        title: "Failed to load exercise",
        description: "There was an error loading the exercise content."
      });
      return null;
    }
  };

  // Mark a node as completed
  const completeNode = async (nodeId: string) => {
    try {
      if (!currentRoadmap) {
        throw new Error('No roadmap selected');
      }
      
      const result = await roadmapService.completeNode(nodeId, currentRoadmap.id);
      
      // Update nodes to reflect completion
      setNodes(prev => 
        prev.map(node => {
          // Mark the completed node
          if (node.id === nodeId) {
            return { ...node, status: 'completed' as const };
          }
          
          // If there's a next node, mark it as available
          if (result.nextNodeId && node.id === result.nextNodeId) {
            return { ...node, status: 'available' as const };
          }
          
          return node;
        })
      );
      
      return result;
    } catch (error) {
      console.error('Error completing node:', error);
      toast({
        variant: "destructive",
        title: "Failed to complete exercise",
        description: "There was an error saving your progress."
      });
      throw error;
    }
  };

  // Context value
  const value: RoadmapContextType = {
    roadmaps,
    userRoadmaps,
    currentRoadmap,
    nodes,
    currentNodeId,
    completedNodes,
    availableNodes,
    isLoading,
    hasError,
    loadRoadmaps,
    loadUserRoadmaps,
    initializeUserRoadmap,
    selectRoadmap,
    getNodeExercise,
    completeNode
  };

  return <RoadmapContext.Provider value={value}>{children}</RoadmapContext.Provider>;
};

// Hook to use the roadmap context
export const useRoadmap = () => {
  const context = useContext(RoadmapContext);
  
  if (context === undefined) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  
  return context;
};
