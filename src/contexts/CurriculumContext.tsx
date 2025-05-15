import React, { createContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useUserSettingsContext } from './UserSettingsContext';
import { 
  getAllCurricula, 
  getUserEnrolledCurricula, 
  enrollInCurriculum, 
  getAvailableNodes, 
  getUserCurriculumProgress, 
  getNodeExercises,
  getCurriculumNodes,
  recordExerciseAttempt
} from '@/services/curriculumService';
import { CurriculumContextType, LanguageLevel, Language, UserCurriculumPath } from '@/types';
import { apiCache } from '@/utils/apiCache';
import { debounce } from '@/utils/debounce';

// Create the context with a default value
export const CurriculumContext = createContext<CurriculumContextType | undefined>(undefined);

export const CurriculumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useUserSettingsContext();
  const [isLoading, setIsLoading] = useState(false);
  const [nodeLoading, setNodeLoading] = useState(false);
  const [availableCurricula, setAvailableCurricula] = useState<any[]>([]);
  const [userCurricula, setUserCurricula] = useState<any[]>([]);
  const [currentCurriculum, setCurrentCurriculum] = useState<any | null>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [availableNodes, setAvailableNodes] = useState<string[]>([]);
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [nodeProgress, setNodeProgress] = useState<any[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | undefined>(undefined);
  const [loadingAttempt, setLoadingAttempt] = useState(0);

  // Load available curricula based on language
  const loadAvailableCurricula = useCallback(async (language: Language) => {
    const cacheKey = `curricula:${language}`;
    
    try {
      // Only set loading state if not using cached data
      if (!apiCache.hasData(cacheKey)) {
        setIsLoading(true);
      }
      
      const curricula = await apiCache.get(cacheKey, () => getAllCurricula(language), {
        ttl: 5 * 60 * 1000 // 5 minutes cache
      });
      
      setAvailableCurricula(curricula);
      return curricula;
    } catch (error) {
      console.error("Error loading available curricula:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fix the nested Promise issue with loadUserCurriculumPaths
  const loadUserCurriculumPaths = useCallback(async (language?: Language): Promise<UserCurriculumPath[]> => {
    const cacheKey = `userCurricula:${language || settings.selectedLanguage}`;
    
    try {
      // Only set loading state if not using cached data
      if (!apiCache.hasData(cacheKey)) {
        setIsLoading(true);
      }
      
      const userCurrs = await apiCache.get(cacheKey, 
        () => getUserEnrolledCurricula(language || settings.selectedLanguage),
        { ttl: 60 * 1000 } // 1 minute cache
      );
      
      setUserCurricula(userCurrs);
      return userCurrs;
    } catch (error) {
      console.error("Error loading user curriculum paths:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [settings.selectedLanguage]); // Only recreate when selectedLanguage changes
  
  // Debounced version for use in UI components
  const debouncedLoadUserCurriculumPaths = useMemo(() => {
    return debounce(loadUserCurriculumPaths, 300);
  }, [loadUserCurriculumPaths]);

  // Initialize user curriculum path
  const initializeUserCurriculumPath = useCallback(async (level: LanguageLevel, language: Language) => {
    try {
      setIsLoading(true);
      
      // Find curriculum for this level and language
      const curricula = await apiCache.get(
        `curricula:${language}:${level}`, 
        () => getAllCurricula(language)
      );
      
      const matchingCurriculum = curricula.find(c => c.level === level && c.language === language);
      
      if (!matchingCurriculum) {
        throw new Error(`No curriculum found for ${level} level in ${language}`);
      }
      
      // Enroll the user
      await enrollInCurriculum(matchingCurriculum.id);
      
      // Invalidate user curricula cache and refresh data
      apiCache.invalidate(`userCurricula:${language}`);
      await loadUserCurriculumPaths(language);
    } catch (error) {
      console.error("Error initializing user curriculum path:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadUserCurriculumPaths]);

  // Load a specific user curriculum path
  const loadUserCurriculumPath = useCallback(async (userCurriculumPathId?: string) => {
    try {
      setIsLoading(true);
      
      if (!userCurriculumPathId && userCurricula.length > 0) {
        // Load the first curriculum if no ID is provided
        const firstCurr = userCurricula[0];
        setCurrentCurriculum(firstCurr);
        setCurrentNodeId(firstCurr.current_node_id);
        
        // Load curriculum nodes with caching
        const cacheKey = `curriculumNodes:${firstCurr.curriculum_id}`;
        const allNodes = await apiCache.get(cacheKey, 
          () => getCurriculumNodes(firstCurr.curriculum_id),
          { ttl: 5 * 60 * 1000 } // 5 minutes cache
        );
        setNodes(allNodes);
        
        // Load user progress with caching
        const progressCacheKey = `progress:${firstCurr.curriculum_id}`;
        const progress = await apiCache.get(progressCacheKey, 
          () => getUserCurriculumProgress(firstCurr.curriculum_id),
          { ttl: 60 * 1000 } // 1 minute cache
        );
        setNodeProgress(progress);
        
        // Get available and completed nodes with caching
        const availNodesCacheKey = `availableNodes:${firstCurr.curriculum_id}`;
        const availNodes = await apiCache.get(availNodesCacheKey, 
          () => getAvailableNodes(firstCurr.curriculum_id),
          { ttl: 60 * 1000 } // 1 minute cache
        );
        setAvailableNodes(availNodes.filter(n => n.status === 'available').map(n => n.id));
        setCompletedNodes(availNodes.filter(n => n.status === 'completed').map(n => n.id));
      } else if (userCurriculumPathId) {
        // Find the specified curriculum
        const curr = userCurricula.find(c => c.id === userCurriculumPathId);
        if (curr) {
          setCurrentCurriculum(curr);
          setCurrentNodeId(curr.current_node_id);
          
          // Use the same caching pattern as above
          const cacheKey = `curriculumNodes:${curr.curriculum_id}`;
          const allNodes = await apiCache.get(cacheKey, 
            () => getCurriculumNodes(curr.curriculum_id),
            { ttl: 5 * 60 * 1000 }
          );
          setNodes(allNodes);
          
          const progressCacheKey = `progress:${curr.curriculum_id}`;
          const progress = await apiCache.get(progressCacheKey, 
            () => getUserCurriculumProgress(curr.curriculum_id),
            { ttl: 60 * 1000 }
          );
          setNodeProgress(progress);
          
          const availNodesCacheKey = `availableNodes:${curr.curriculum_id}`;
          const availNodes = await apiCache.get(availNodesCacheKey, 
            () => getAvailableNodes(curr.curriculum_id),
            { ttl: 60 * 1000 }
          );
          setAvailableNodes(availNodes.filter(n => n.status === 'available').map(n => n.id));
          setCompletedNodes(availNodes.filter(n => n.status === 'completed').map(n => n.id));
        }
      }
    } catch (error) {
      console.error("Error loading user curriculum path:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userCurricula]);

  // Complete a node in the curriculum
  const completeNode = useCallback(async (nodeId: string) => {
    try {
      if (!currentCurriculum) return;
      
      // Mark the node as completed
      await markNodeAsCompleted(nodeId);
      
      // Invalidate relevant caches
      apiCache.invalidate(`availableNodes:${currentCurriculum.curriculum_id}`);
      apiCache.invalidate(`progress:${currentCurriculum.curriculum_id}`);
      
      // Refresh the curriculum path
      await loadUserCurriculumPath(currentCurriculum.id);
    } catch (error) {
      console.error("Error completing node:", error);
    }
  }, [currentCurriculum, loadUserCurriculumPath]);

  // Reset progress for the current curriculum
  const resetProgress = useCallback(async () => {
    try {
      if (!currentCurriculum) return;
      
      // We would need to add a function to reset progress in the database
      // For now, let's just reload the curriculum after invalidating caches
      apiCache.invalidate(`availableNodes:${currentCurriculum.curriculum_id}`);
      apiCache.invalidate(`progress:${currentCurriculum.curriculum_id}`);
      
      await loadUserCurriculumPath(currentCurriculum.id);
    } catch (error) {
      console.error("Error resetting progress:", error);
    }
  }, [currentCurriculum, loadUserCurriculumPath]);

  // Get exercises for a node with caching
  const getNodeExercise = useCallback(async (nodeId: string) => {
    try {
      setNodeLoading(true);
      const cacheKey = `nodeExercises:${nodeId}`;
      
      const exercises = await apiCache.get(cacheKey, 
        () => getNodeExercises(nodeId),
        { ttl: 5 * 60 * 1000 } // 5 minutes cache
      );
      
      return exercises.length > 0 ? exercises[0].exercise : null;
    } catch (error) {
      console.error("Error getting node exercise:", error);
      return null;
    } finally {
      setNodeLoading(false);
    }
  }, []);

  // Mark a node as completed
  const markNodeAsCompleted = useCallback(async (nodeId: string) => {
    try {
      if (!currentCurriculum) return;
      
      // This is a simplified version, ideally we'd mark the node as completed in the database
      setCompletedNodes(prev => [...prev, nodeId]);
    } catch (error) {
      console.error("Error marking node as completed:", error);
    }
  }, [currentCurriculum]);

  // Increment node completion counter with cache invalidation
  const incrementNodeCompletion = useCallback(async (nodeId: string, accuracy: number) => {
    try {
      if (!currentCurriculum || !nodeId) return;
      
      await recordExerciseAttempt({
        exercise_id: '', // This would need to be provided
        node_id: nodeId,
        curriculum_id: currentCurriculum.curriculum_id,
        accuracy_percentage: accuracy
      });
      
      // Invalidate the progress cache for this curriculum
      apiCache.invalidate(`progress:${currentCurriculum.curriculum_id}`);
      apiCache.invalidate(`availableNodes:${currentCurriculum.curriculum_id}`);
      
      // Refresh the curriculum to update progress
      await loadUserCurriculumPath(currentCurriculum.id);
    } catch (error) {
      console.error("Error incrementing node completion:", error);
    }
  }, [currentCurriculum, loadUserCurriculumPath]);

  // Select a curriculum path
  const selectCurriculumPath = useCallback(async (curriculumPathId: string) => {
    await loadUserCurriculumPath(curriculumPathId);
  }, [loadUserCurriculumPath]);

  // Load curricula when the selected language changes, but avoid doing it on every render
  useEffect(() => {
    // Only load if not already loading, to prevent loops
    if (!isLoading) {
      // First load available curricula
      loadAvailableCurricula(settings.selectedLanguage);
      
      // Then load user curricula after a small delay
      const timeoutId = setTimeout(() => {
        debouncedLoadUserCurriculumPaths(settings.selectedLanguage);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [settings.selectedLanguage, loadingAttempt]); // Not adding the functions to deps to avoid loops
  
  // Function to manually trigger data refresh
  const refreshData = useCallback(() => {
    // Invalidate relevant caches
    apiCache.invalidate(`curricula:${settings.selectedLanguage}`);
    apiCache.invalidate(`userCurricula:${settings.selectedLanguage}`);
    
    // Trigger a re-fetch by updating loadingAttempt
    setLoadingAttempt(prev => prev + 1);
  }, [settings.selectedLanguage]);

  // The context value that will be provided to consumers
  const contextValue: CurriculumContextType = {
    curriculumPaths: availableCurricula,
    userCurriculumPaths: userCurricula,
    currentCurriculumPath: currentCurriculum,
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
    selectCurriculumPath,
    refreshData
  };

  return (
    <CurriculumContext.Provider value={contextValue}>
      {children}
    </CurriculumContext.Provider>
  );
};
