
import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { curriculumPathService } from '@/features/roadmap/api/curriculumPathService';
import { CurriculumContextType, Language, LanguageLevel, UserCurriculumPath, CurriculumPath, CurriculumNode, CurriculumNodeProgress, CurriculumPathItem } from '@/types';
import { useUserSettingsContext } from './UserSettingsContext';
import { toast } from '@/components/ui/use-toast';

// Create context with initial empty values
export const CurriculumPathContext = createContext<CurriculumContextType | undefined>(undefined);

interface CurriculumPathProviderProps {
  children: ReactNode;
}

export const CurriculumPathProvider: React.FC<CurriculumPathProviderProps> = ({ children }) => {
  const { settings } = useUserSettingsContext();
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [nodeLoading, setNodeLoading] = useState<boolean>(false);
  const [curriculumPaths, setCurriculumPaths] = useState<CurriculumPath[]>([]);
  const [userCurriculumPaths, setUserCurriculumPaths] = useState<UserCurriculumPath[]>([]);
  const [currentCurriculumPath, setCurrentCurriculumPath] = useState<UserCurriculumPath | null>(null);
  const [nodes, setNodes] = useState<CurriculumNode[]>([]);
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [availableNodes, setAvailableNodes] = useState<string[]>([]);
  const [nodeProgress, setNodeProgress] = useState<CurriculumNodeProgress[]>([]);

  // Load available curriculum paths
  const loadCurriculumPaths = useCallback(async (language: Language) => {
    try {
      setIsLoading(true);
      const paths = await curriculumPathService.getCurriculumPathsForLanguage(language);
      setCurriculumPaths(paths);
    } catch (error) {
      console.error('Error loading curriculum paths:', error);
      toast({
        title: "Failed to load curriculum paths",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load user's curriculum paths for the current language
  const loadUserCurriculumPaths = useCallback(async (language?: Language): Promise<UserCurriculumPath[]> => {
    try {
      setIsLoading(true);
      const userLanguage = language || settings.selectedLanguage;
      const userPathItems = await curriculumPathService.getUserCurriculumPaths(userLanguage);
      
      // Convert CurriculumPathItems to UserCurriculumPaths
      const userPaths: UserCurriculumPath[] = userPathItems.map(item => ({
        id: item.id,
        userId: "", // This will be filled in by the backend
        curriculumPathId: item.curriculumPathId || item.id,
        language: item.language || userLanguage,
        currentNodeId: item.currentNodeId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
      
      setUserCurriculumPaths(userPaths);
      
      // If there's a curriculum path, select the first one by default
      if (userPaths.length > 0 && !currentCurriculumPath) {
        await selectCurriculumPath(userPaths[0].id);
      }
      
      return userPaths;
    } catch (error) {
      console.error('Error loading user curriculum paths:', error);
      toast({
        title: "Failed to load your curriculum paths",
        description: "Please try again later.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [settings.selectedLanguage, currentCurriculumPath]);

  // Initialize a new curriculum path for the user
  const initializeUserCurriculumPath = useCallback(async (level: LanguageLevel, language: Language) => {
    try {
      setIsLoading(true);
      const pathId = await curriculumPathService.initializeCurriculumPath(level, language);
      await loadUserCurriculumPaths(language);
      await selectCurriculumPath(pathId);
      
      toast({
        title: "Learning path created",
        description: "Your new learning path is ready!",
      });
    } catch (error) {
      console.error('Error initializing curriculum path:', error);
      toast({
        title: "Failed to create learning path",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadUserCurriculumPaths]);

  // Load a specific user curriculum path with its nodes
  const loadUserCurriculumPath = useCallback(async (userPathId?: string) => {
    try {
      setIsLoading(true);
      
      if (!userPathId && userCurriculumPaths.length > 0) {
        userPathId = userCurriculumPaths[0].id;
      }
      
      if (!userPathId) {
        console.warn('No curriculum path ID provided and no user curriculum paths available');
        setIsLoading(false);
        return;
      }
      
      await selectCurriculumPath(userPathId);
    } catch (error) {
      console.error('Error loading user curriculum path:', error);
      toast({
        title: "Failed to load learning path",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userCurriculumPaths]);

  // Select a curriculum path to view
  const selectCurriculumPath = useCallback(async (pathId: string) => {
    try {
      setIsLoading(true);
      
      // Find the path in our list of user curriculum paths
      const path = userCurriculumPaths.find(p => p.id === pathId);
      if (!path) {
        throw new Error('Curriculum path not found in user curriculum paths');
      }
      
      setCurrentCurriculumPath(path);
      
      // Load nodes for this curriculum path
      const fetchedNodes = await curriculumPathService.getCurriculumNodes(pathId);
      setNodes(fetchedNodes);
      
      // Analyze nodes to determine completed and available nodes
      const completed = fetchedNodes
        .filter(node => node.status === 'completed')
        .map(node => node.id);
      
      const available = fetchedNodes
        .filter(node => node.status === 'available')
        .map(node => node.id);
      
      // Update state with new node info
      setCompletedNodes(completed);
      setAvailableNodes(available);
      
      // Extract node progress from nodes
      const progress = fetchedNodes
        .map(node => {
          return {
            id: `progress-${node.id}`,
            userId: '', // This will be filled in by the backend
            curriculumPathId: node.curriculumPathId,
            nodeId: node.id,
            language: node.language || settings.selectedLanguage,
            completionCount: node.progressCount || 0,
            isCompleted: completed.includes(node.id),
            createdAt: new Date(),
            updatedAt: new Date()
          } as CurriculumNodeProgress;
        });
      
      setNodeProgress(progress);
      
    } catch (error) {
      console.error('Error selecting curriculum path:', error);
      toast({
        title: "Failed to load curriculum path",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userCurriculumPaths, settings.selectedLanguage]);

  // Mark a node as completed
  const completeNode = useCallback(async (nodeId: string) => {
    try {
      setNodeLoading(true);
      await curriculumPathService.markNodeCompleted(nodeId);
      
      // Refresh the curriculum path to update node statuses
      if (currentCurriculumPath) {
        await selectCurriculumPath(currentCurriculumPath.id);
      }
      
      toast({
        title: "Node completed",
        description: "You've completed this lesson.",
      });
    } catch (error) {
      console.error('Error completing node:', error);
      toast({
        title: "Failed to complete lesson",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setNodeLoading(false);
    }
  }, [currentCurriculumPath, selectCurriculumPath]);

  // Reset progress for the current curriculum path
  const resetProgress = useCallback(async () => {
    // Implementation pending
    toast({
      title: "Not implemented",
      description: "This feature is not implemented yet.",
    });
  }, []);

  // Get exercise content for a node
  const getNodeExercise = useCallback(async (nodeId: string) => {
    try {
      setNodeLoading(true);
      const exercise = await curriculumPathService.getNodeExerciseContent(nodeId);
      return exercise;
    } catch (error) {
      console.error('Error getting node exercise:', error);
      toast({
        title: "Failed to load exercise",
        description: "Please try again later.",
        variant: "destructive",
      });
      return null;
    } finally {
      setNodeLoading(false);
    }
  }, []);

  // Mark a node as completed
  const markNodeAsCompleted = useCallback(async (nodeId: string) => {
    await completeNode(nodeId);
  }, [completeNode]);

  // Record node completion with accuracy
  const incrementNodeCompletion = useCallback(async (nodeId: string, accuracy: number) => {
    try {
      setNodeLoading(true);
      const result = await curriculumPathService.recordNodeCompletion(nodeId, accuracy);
      
      if (result.isCompleted) {
        toast({
          title: "Node completed",
          description: "You've reached the completion threshold for this node.",
        });
        
        // Refresh the curriculum path to update node statuses
        if (currentCurriculumPath) {
          await selectCurriculumPath(currentCurriculumPath.id);
        }
      }
    } catch (error) {
      console.error('Error recording node completion:', error);
      toast({
        title: "Failed to save progress",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setNodeLoading(false);
    }
  }, [currentCurriculumPath, selectCurriculumPath]);

  // Load curriculum paths and user curriculum paths on init
  useEffect(() => {
    const loadData = async () => {
      await loadCurriculumPaths(settings.selectedLanguage);
      await loadUserCurriculumPaths();
    };
    
    loadData();
  }, [loadCurriculumPaths, loadUserCurriculumPaths, settings.selectedLanguage]);

  // Derived values
  const currentNodeId = currentCurriculumPath?.currentNodeId;

  // Provide context value
  const contextValue: CurriculumContextType = {
    curriculumPaths,
    userCurriculumPaths,
    currentCurriculumPath,
    nodes,
    currentNodeId,
    completedNodes,
    availableNodes,
    nodeProgress,
    isLoading,
    nodeLoading,
    initializeUserCurriculumPath,
    loadUserCurriculumPath,
    loadUserCurriculumPaths,
    completeNode,
    resetProgress,
    getNodeExercise,
    markNodeAsCompleted,
    incrementNodeCompletion,
    selectCurriculumPath
  };

  return (
    <CurriculumPathContext.Provider value={contextValue}>
      {children}
    </CurriculumPathContext.Provider>
  );
};

// Hook to use the curriculum path context
export const useCurriculumPath = () => {
  const context = React.useContext(CurriculumPathContext);
  if (context === undefined) {
    throw new Error('useCurriculumPath must be used within a CurriculumPathProvider');
  }
  return context;
};
