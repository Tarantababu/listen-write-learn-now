import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { 
  CurriculumContextType, 
  CurriculumPath, 
  CurriculumNode, 
  UserCurriculumPath, 
  CurriculumNodeProgress, 
  Language,
  LanguageLevel 
} from '@/types';
import {
  getCurriculumPaths,
  getCurriculumNodes,
  getUserCurriculumPaths,
  getCurriculumNodesProgress as getNodeProgress,
  initializeUserCurriculumPath as initPath,
  resetProgress as resetPathProgress,
  incrementNodeCompletion,
  markNodeAsCompleted as markCompleted,
  getNodeExercise as getExercise
} from '@/services/curriculumService';
import { toast } from '@/hooks/use-toast';

// Create the context and export it
export const CurriculumContext = createContext<CurriculumContextType | undefined>(undefined);

export const CurriculumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  
  const [curriculumPaths, setCurriculumPaths] = useState<CurriculumPath[]>([]);
  const [userCurriculumPaths, setUserCurriculumPaths] = useState<UserCurriculumPath[]>([]);
  const [currentCurriculumPath, setCurrentCurriculumPath] = useState<UserCurriculumPath | null>(null);
  const [nodes, setNodes] = useState<CurriculumNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nodeLoading, setNodeLoading] = useState(false);
  const [nodeProgress, setNodeProgress] = useState<CurriculumNodeProgress[]>([]);
  
  // Computed properties
  const currentNodeId = currentCurriculumPath?.currentNodeId;
  const completedNodes = nodeProgress
    .filter(progress => progress.isCompleted)
    .map(progress => progress.nodeId);
  
  const availableNodes = nodes
    .filter(node => {
      // First node is always available
      if (node.position === 1) return true;
      
      // For other nodes, check if previous node is completed
      const previousNode = nodes.find(n => n.position === node.position - 1);
      return previousNode && completedNodes.includes(previousNode.id);
    })
    .map(node => node.id);

  // Load the user's curriculum paths when the selected language changes
  useEffect(() => {
    if (user && settings.selectedLanguage) {
      loadUserCurriculumPaths(settings.selectedLanguage)
        .catch(error => {
          console.error('Error loading user curriculum paths:', error);
        });
    }
  }, [user, settings.selectedLanguage]);

  // Load curriculum paths for the selected language
  useEffect(() => {
    if (settings.selectedLanguage) {
      getCurriculumPaths(settings.selectedLanguage)
        .then(paths => {
          setCurriculumPaths(paths);
        })
        .catch(error => {
          console.error('Error fetching curriculum paths:', error);
        });
    }
  }, [settings.selectedLanguage]);

  // Load nodes and progress when current curriculum path changes
  useEffect(() => {
    if (currentCurriculumPath) {
      Promise.all([
        getCurriculumNodes(currentCurriculumPath.curriculumPathId),
        getNodeProgress(user!.id, currentCurriculumPath.curriculumPathId)
      ])
        .then(([nodesData, progressData]) => {
          setNodes(nodesData);
          setNodeProgress(progressData);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error loading curriculum data:', error);
          setIsLoading(false);
        });
    }
  }, [currentCurriculumPath, user]);

  /**
   * Load user curriculum paths for a specific language
   */
  const loadUserCurriculumPaths = async (language?: Language): Promise<UserCurriculumPath[] | undefined> => {
    if (!user) return undefined;
    
    setIsLoading(true);
    try {
      const paths = await getUserCurriculumPaths(language);
      
      // Make sure we only set UserCurriculumPath objects, not strings
      const typedPaths = paths.filter(path => typeof path !== 'string') as UserCurriculumPath[];
      setUserCurriculumPaths(typedPaths);
      
      // If we have paths and no current path, set the first one as current
      if (typedPaths.length > 0 && !currentCurriculumPath) {
        setCurrentCurriculumPath(typedPaths[0]);
      }
      
      setIsLoading(false);
      return typedPaths;
    } catch (error) {
      console.error('Error loading user curriculum paths:', error);
      setIsLoading(false);
      throw error;
    }
  };

  /**
   * Initialize a new user curriculum path
   */
  const initializeUserCurriculumPath = async (level: LanguageLevel, language: Language): Promise<void> => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to start a curriculum path",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const newPathId = await initPath(level, language);
      if (!newPathId) {
        throw new Error('Failed to initialize curriculum path');
      }
      
      // Load the paths again to get the new path
      const updatedPaths = await loadUserCurriculumPaths(language);
      if (!updatedPaths) {
        throw new Error('Failed to load updated paths');
      }
      
      // Find the new path in the updated paths
      const newPath = updatedPaths.find(p => p.id === newPathId);
      if (!newPath) {
        throw new Error('New path not found in updated paths');
      }
      
      // Set it as the current path
      setCurrentCurriculumPath(newPath);
      
      toast({
        title: "Curriculum started",
        description: `You have started the ${level} curriculum for ${language}`,
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing curriculum path:', error);
      setIsLoading(false);
      
      toast({
        title: "Failed to start curriculum",
        description: "There was an error starting the curriculum. Please try again.",
        variant: "destructive"
      });
    }
  };

  /**
   * Load a specific user curriculum path
   */
  const loadUserCurriculumPath = async (userCurriculumPathId?: string): Promise<void> => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // If no ID provided, try to load the first one for the selected language
      if (!userCurriculumPathId) {
        const paths = await loadUserCurriculumPaths(settings.selectedLanguage);
        if (paths && paths.length > 0) {
          setCurrentCurriculumPath(paths[0]);
        }
      } else {
        // Find the path in the current list
        const path = userCurriculumPaths.find(p => p.id === userCurriculumPathId);
        if (path) {
          setCurrentCurriculumPath(path);
        } else {
          // If not found, reload all paths and try to find it
          const paths = await loadUserCurriculumPaths();
          const path = paths?.find(p => p.id === userCurriculumPathId);
          if (path) {
            setCurrentCurriculumPath(path);
          }
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading user curriculum path:', error);
      setIsLoading(false);
    }
  };

  /**
   * Mark a node as completed
   */
  const completeNode = async (nodeId: string): Promise<void> => {
    if (!user || !currentCurriculumPath) return;
    
    setNodeLoading(true);
    try {
      await markCompleted(user.id, nodeId, currentCurriculumPath.curriculumPathId);
      
      // Update the progress list
      setNodeProgress(prev => [
        ...prev.filter(p => p.nodeId !== nodeId),
        {
          id: `temp-${Date.now()}`, // Temporary ID until refresh
          userId: user.id,
          curriculumPathId: currentCurriculumPath.curriculumPathId,
          nodeId,
          language: currentCurriculumPath.language,
          completionCount: 3, // Directly completed
          isCompleted: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      
      setNodeLoading(false);
      
      toast({
        title: "Node completed",
        description: "You have completed this exercise",
      });
    } catch (error) {
      console.error('Error completing node:', error);
      setNodeLoading(false);
      
      toast({
        title: "Error",
        description: "Failed to mark exercise as completed",
        variant: "destructive"
      });
    }
  };

  /**
   * Reset all progress for the current curriculum path
   */
  const resetProgress = async (): Promise<void> => {
    if (!user || !currentCurriculumPath) return;
    
    setNodeLoading(true);
    try {
      await resetPathProgress(user.id, currentCurriculumPath.curriculumPathId);
      
      // Clear the progress list
      setNodeProgress([]);
      
      setNodeLoading(false);
      
      toast({
        title: "Progress reset",
        description: "Your progress has been reset",
      });
    } catch (error) {
      console.error('Error resetting progress:', error);
      setNodeLoading(false);
      
      toast({
        title: "Error",
        description: "Failed to reset progress",
        variant: "destructive"
      });
    }
  };

  /**
   * Get the exercise for a node
   */
  const getNodeExercise = async (nodeId: string): Promise<any> => {
    setNodeLoading(true);
    try {
      const exercise = await getExercise(nodeId);
      setNodeLoading(false);
      return exercise;
    } catch (error) {
      console.error('Error getting node exercise:', error);
      setNodeLoading(false);
      
      toast({
        title: "Error",
        description: "Failed to load exercise",
        variant: "destructive"
      });
      
      throw error;
    }
  };

  /**
   * Mark node as completed
   */
  const markNodeAsCompleted = async (nodeId: string): Promise<void> => {
    if (!user || !currentCurriculumPath) return;
    await completeNode(nodeId);
  };

  /**
   * Increment node completion count
   */
  const incrementNodeCompletionHandler = async (nodeId: string, accuracy: number): Promise<void> => {
    if (!user || !currentCurriculumPath) return;
    
    setNodeLoading(true);
    try {
      await incrementNodeCompletion(
        user.id,
        nodeId,
        currentCurriculumPath.curriculumPathId,
        currentCurriculumPath.language
      );
      
      // Refetch the node progress to get the updated counts
      const updatedProgress = await getNodeProgress(user.id, currentCurriculumPath.curriculumPathId);
      setNodeProgress(updatedProgress);
      
      setNodeLoading(false);
      
      // Notify if accuracy was high enough
      if (accuracy >= 0.8) {
        toast({
          title: "Great job!",
          description: "You're making excellent progress",
        });
      }
    } catch (error) {
      console.error('Error incrementing node completion:', error);
      setNodeLoading(false);
    }
  };

  /**
   * Select a curriculum path
   */
  const selectCurriculumPath = async (curriculumPathId: string): Promise<void> => {
    const path = userCurriculumPaths.find(p => p.id === curriculumPathId);
    if (path) {
      setCurrentCurriculumPath(path);
    } else {
      throw new Error('Curriculum path not found');
    }
  };

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
    incrementNodeCompletion: incrementNodeCompletionHandler,
    selectCurriculumPath
  };

  return (
    <CurriculumContext.Provider value={contextValue}>
      {children}
    </CurriculumContext.Provider>
  );
};

// Custom hook for using the curriculum context
export const useCurriculum = (): CurriculumContextType => {
  const context = useContext(CurriculumContext);
  if (context === undefined) {
    throw new Error('useCurriculum must be used within a CurriculumProvider');
  }
  return context;
};
