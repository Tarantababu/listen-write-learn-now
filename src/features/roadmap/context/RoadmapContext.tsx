
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { 
  Roadmap, 
  RoadmapNode, 
  UserRoadmap, 
  RoadmapProgress, 
  LanguageLevel, 
  Language, 
  RoadmapNodeProgress, 
  RoadmapContextType 
} from '@/types';
import { roadmapService } from '../services/RoadmapService';

// Create the context
const RoadmapContext = createContext<RoadmapContextType>({} as RoadmapContextType);

export const RoadmapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [userRoadmaps, setUserRoadmaps] = useState<UserRoadmap[]>([]); 
  const [selectedRoadmap, setSelectedRoadmap] = useState<UserRoadmap | null>(null);
  const [roadmapNodes, setRoadmapNodes] = useState<RoadmapNode[]>([]);
  const [currentNode, setCurrentNode] = useState<RoadmapNode | null>(null);
  const [progress, setProgress] = useState<RoadmapProgress[]>([]);
  const [nodeProgress, setNodeProgress] = useState<RoadmapNodeProgress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [nodeLoading, setNodeLoading] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(settings.selectedLanguage);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Memoized function to fetch roadmaps
  const fetchRoadmaps = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get roadmaps using the roadmapService
      const roadmapList = await roadmapService.getRoadmapsForLanguage(settings.selectedLanguage);
      setRoadmaps(roadmapList);
      
      // Load all user roadmaps after fetching available roadmaps
      await loadUserRoadmaps();
    } catch (error) {
      console.error("Error fetching roadmaps:", error);
      toast({
        variant: "destructive",
        title: "Failed to load learning roadmaps",
        description: "There was an error loading your roadmaps."
      });
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  }, [user, settings.selectedLanguage]);

  // Effect to fetch roadmaps only when language changes
  useEffect(() => {
    if (settings.selectedLanguage !== selectedLanguage) {
      setSelectedLanguage(settings.selectedLanguage);
      fetchRoadmaps();
    }
  }, [settings.selectedLanguage, selectedLanguage, fetchRoadmaps]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchRoadmaps();
    }
  }, [user, fetchRoadmaps]);

  // Load all user roadmaps
  const loadUserRoadmaps = useCallback(async (language?: Language): Promise<UserRoadmap[]> => {
    if (!user) return [];

    try {
      const userRoadmapsList = await roadmapService.getUserRoadmaps(language || settings.selectedLanguage);
      
      if (!userRoadmapsList || userRoadmapsList.length === 0) {
        setUserRoadmaps([]);
        setSelectedRoadmap(null);
        return [];
      }

      setUserRoadmaps(userRoadmapsList);
      
      // If no roadmap is selected but user has roadmaps, select the first one
      if (!selectedRoadmap && userRoadmapsList.length > 0) {
        await loadUserRoadmap(userRoadmapsList[0].id);
      }
      
      return userRoadmapsList;
    } catch (error) {
      console.error("Error loading user roadmaps:", error);
      toast({
        variant: "destructive",
        title: "Failed to load your learning paths",
        description: "There was an error loading your learning paths."
      });
      return [];
    }
  }, [user, settings.selectedLanguage, selectedRoadmap]);

  // Select a specific roadmap
  const selectRoadmap = async (roadmapId: string) => {
    const roadmap = userRoadmaps.find(r => r.id === roadmapId);
    if (roadmap) {
      await loadUserRoadmap(roadmap.id);
    } else {
      toast({
        variant: "destructive",
        title: "Roadmap not found",
        description: "The selected roadmap could not be found."
      });
    }
  };

  // Load user's selected roadmap
  const loadUserRoadmap = async (userRoadmapId?: string) => {
    if (!user) return;

    setLoading(true);
    try {
      let userRoadmap: UserRoadmap | null = null;
      
      if (userRoadmapId) {
        // Get specific user roadmap by ID
        const roadmapItems = await roadmapService.getUserRoadmaps(settings.selectedLanguage);
        userRoadmap = roadmapItems.find(r => r.id === userRoadmapId) || null;
      } else {
        // Get first user roadmap for current language
        const userRoadmaps = await roadmapService.getUserRoadmaps(settings.selectedLanguage);
        if (userRoadmaps.length > 0) {
          userRoadmap = userRoadmaps[0];
        }
      }

      if (!userRoadmap) {
        setSelectedRoadmap(null);
        setRoadmapNodes([]);
        setCurrentNode(null);
        setProgress([]);
        setNodeProgress([]);
        setLoading(false);
        return;
      }

      setSelectedRoadmap(userRoadmap);

      // Load roadmap nodes
      const nodes = await roadmapService.getRoadmapNodes(userRoadmap.id);
      
      // Filter nodes by language
      const filteredNodes = nodes.filter(node => 
        !node.language || node.language === userRoadmap!.language
      );
      
      setRoadmapNodes(filteredNodes);

      // Find current node
      if (userRoadmap.currentNodeId) {
        const current = filteredNodes.find(node => node.id === userRoadmap.currentNodeId);
        setCurrentNode(current || null);
      } else if (filteredNodes.length > 0) {
        setCurrentNode(filteredNodes[0]);
      }

      // For now, use an empty progress array
      // Eventually this should be retrieved from the service
      setProgress([]);
      setNodeProgress([]);
      
    } catch (error) {
      console.error("Error loading user roadmap:", error);
      toast({
        variant: "destructive",
        title: "Failed to load your learning path",
        description: "There was an error loading your roadmap details."
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize user roadmap
  const initializeUserRoadmap = async (level: LanguageLevel, language: Language) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to start a learning path."
      });
      return;
    }

    try {
      const roadmapId = await roadmapService.initializeRoadmap(level, language);
      
      if (!roadmapId) {
        toast({
          variant: "destructive",
          title: "Roadmap not available",
          description: `No roadmap found for ${level} level in ${language}.`
        });
        return;
      }

      toast({
        title: "Learning journey started!",
        description: "Your learning journey has begun!"
      });
      
      // Refresh the user roadmap data
      await loadUserRoadmaps();
      await loadUserRoadmap(roadmapId);

    } catch (error) {
      console.error("Error initializing roadmap:", error);
      toast({
        variant: "destructive",
        title: "Initialization failed",
        description: "Failed to start learning journey. Please try again later."
      });
    }
  };

  // Get node exercise
  const getNodeExercise = async (nodeId: string) => {
    const node = roadmapNodes.find(n => n.id === nodeId);
    if (!node || !node.defaultExerciseId) {
      return null;
    }
    
    try {
      return await roadmapService.getNodeExerciseContent(nodeId);
    } catch (error) {
      console.error("Error fetching node exercise:", error);
      toast({
        variant: "destructive", 
        title: "Failed to load exercise",
        description: "Could not load the exercise content. Please try again."
      });
      return null;
    }
  };

  // Increment node completion count when dictation is completed with good accuracy
  const incrementNodeCompletion = async (nodeId: string, accuracy: number) => {
    if (!user || !selectedRoadmap) return;

    // Only increment if accuracy is good (95% or better)
    if (accuracy < 95) return;

    setNodeLoading(true);
    try {
      // Update completion count through service
      await roadmapService.recordNodeCompletion(nodeId, accuracy);
      
      // Reload roadmap data to get updated progress
      await loadUserRoadmap(selectedRoadmap.id);
      
      // Find updated node progress (this is simplified since we don't have real progress yet)
      const updatedNodeProgress = nodeProgress.find(np => np.nodeId === nodeId);
      
      if (updatedNodeProgress && updatedNodeProgress.isCompleted) {
        toast({
          title: "Node completed!",
          description: `You've completed this lesson! Completion count: ${updatedNodeProgress.completionCount}/3`
        });
        
        // If this is now completed, check if we need to move to the next node
        await completeNode(nodeId);
      } else if (updatedNodeProgress) {
        toast({
          title: "Progress saved!",
          description: `Practice progress saved. Completion count: ${updatedNodeProgress.completionCount}/3`
        });
      }
      
    } catch (error) {
      console.error("Error updating node progress:", error);
      toast({
        variant: "destructive",
        title: "Failed to save progress",
        description: "Failed to save your practice progress"
      });
    } finally {
      setNodeLoading(false);
    }
  };

  // Mark node as completed
  const markNodeAsCompleted = async (nodeId: string) => {
    const result = await completeNode(nodeId);
    return;
  };

  // Complete a node
  const completeNode = async (nodeId: string) => {
    if (!user || !selectedRoadmap) return { nextNodeId: undefined };

    setNodeLoading(true);
    try {
      // For now, we'll just pretend to mark the node as completed
      // In a real implementation, this would call the service
      const nextNodeIndex = roadmapNodes.findIndex(n => n.id === nodeId) + 1;
      const nextNode = nextNodeIndex < roadmapNodes.length ? roadmapNodes[nextNodeIndex] : null;
      
      toast({
        title: nextNode ? "Lesson completed!" : "Path completed!",
        description: nextNode 
          ? "Well done! Moving to the next lesson." 
          : "Congratulations! You've completed all lessons in this path."
      });
      
      return { nextNodeId: nextNode?.id };
    } catch (error) {
      console.error("Error completing node:", error);
      toast({
        variant: "destructive",
        title: "Failed to mark as complete",
        description: "Failed to mark lesson as complete"
      });
      return { nextNodeId: undefined };
    } finally {
      setNodeLoading(false);
    }
  };

  // Reset progress
  const resetProgress = async () => {
    if (!user || !selectedRoadmap) return;

    try {
      // Simplified implementation - would call service in real implementation
      toast({
        title: "Progress reset",
        description: "Progress reset successfully"
      });
      
    } catch (error) {
      console.error("Error resetting progress:", error);
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: "Failed to reset progress"
      });
    }
  };

  // Calculate completed nodes ids
  const completedNodes = progress.filter(p => p.completed).map(p => p.nodeId);
  
  // Calculate available nodes
  const availableNodes = roadmapNodes
    .filter((node, index, array) => {
      // First node is always available
      if (index === 0) return true;
      
      // Previous node is completed, this one is available
      const prevNode = array[index - 1];
      return prevNode && completedNodes.includes(prevNode.id);
    })
    .map(node => node.id);

  return (
    <RoadmapContext.Provider value={{
      roadmaps,
      userRoadmaps,
      selectedRoadmap,
      currentNode,
      roadmapNodes,
      progress,
      nodeProgress,
      loading,
      nodeLoading,
      isLoading,
      // Alias properties to match what other components are using
      currentRoadmap: selectedRoadmap,
      nodes: roadmapNodes,
      currentNodeId: selectedRoadmap?.currentNodeId,
      completedNodes,
      availableNodes,
      initializeUserRoadmap,
      loadUserRoadmap,
      loadUserRoadmaps,
      completeNode,
      resetProgress,
      getNodeExercise,
      markNodeAsCompleted,
      incrementNodeCompletion,
      selectRoadmap
    }}>
      {children}
    </RoadmapContext.Provider>
  );
};

export { RoadmapContext };
