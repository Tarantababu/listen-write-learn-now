
import React, { createContext, useEffect, useState, useCallback } from 'react';
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
import { CurriculumContextType, LanguageLevel, Language } from '@/types';

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

  // Load available curricula based on language
  const loadAvailableCurricula = useCallback(async (language: Language) => {
    try {
      setIsLoading(true);
      const curricula = await getAllCurricula(language);
      setAvailableCurricula(curricula);
      return curricula;
    } catch (error) {
      console.error("Error loading available curricula:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load user's enrolled curricula
  const loadUserCurriculumPaths = useCallback(async (language?: Language) => {
    try {
      setIsLoading(true);
      const userCurrs = await getUserEnrolledCurricula(language || settings.selectedLanguage);
      setUserCurricula(userCurrs);
      return userCurrs;
    } catch (error) {
      console.error("Error loading user curriculum paths:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [settings.selectedLanguage]);

  // Initialize user curriculum path
  const initializeUserCurriculumPath = useCallback(async (level: LanguageLevel, language: Language) => {
    try {
      setIsLoading(true);
      
      // Find curriculum for this level and language
      const curricula = await getAllCurricula(language);
      const matchingCurriculum = curricula.find(c => c.level === level && c.language === language);
      
      if (!matchingCurriculum) {
        throw new Error(`No curriculum found for ${level} level in ${language}`);
      }
      
      // Enroll the user
      await enrollInCurriculum(matchingCurriculum.id);
      
      // Refresh user curricula
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
        
        // Load curriculum nodes
        const allNodes = await getCurriculumNodes(firstCurr.curriculum_id);
        setNodes(allNodes);
        
        // Load user progress
        const progress = await getUserCurriculumProgress(firstCurr.curriculum_id);
        setNodeProgress(progress);
        
        // Get available and completed nodes
        const availNodes = await getAvailableNodes(firstCurr.curriculum_id);
        setAvailableNodes(availNodes.filter(n => n.status === 'available').map(n => n.id));
        setCompletedNodes(availNodes.filter(n => n.status === 'completed').map(n => n.id));
      } else if (userCurriculumPathId) {
        // Find the specified curriculum
        const curr = userCurricula.find(c => c.id === userCurriculumPathId);
        if (curr) {
          setCurrentCurriculum(curr);
          setCurrentNodeId(curr.current_node_id);
          
          // Load curriculum nodes
          const allNodes = await getCurriculumNodes(curr.curriculum_id);
          setNodes(allNodes);
          
          // Load user progress
          const progress = await getUserCurriculumProgress(curr.curriculum_id);
          setNodeProgress(progress);
          
          // Get available and completed nodes
          const availNodes = await getAvailableNodes(curr.curriculum_id);
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
      // For now, let's just reload the curriculum
      await loadUserCurriculumPath(currentCurriculum.id);
    } catch (error) {
      console.error("Error resetting progress:", error);
    }
  }, [currentCurriculum, loadUserCurriculumPath]);

  // Get exercises for a node
  const getNodeExercise = useCallback(async (nodeId: string) => {
    try {
      setNodeLoading(true);
      const exercises = await getNodeExercises(nodeId);
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

  // Increment node completion counter
  const incrementNodeCompletion = useCallback(async (nodeId: string, accuracy: number) => {
    try {
      if (!currentCurriculum || !nodeId) return;
      
      await recordExerciseAttempt({
        exercise_id: '', // This would need to be provided
        node_id: nodeId,
        curriculum_id: currentCurriculum.curriculum_id,
        accuracy_percentage: accuracy
      });
      
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

  // Load curricula when the selected language changes
  useEffect(() => {
    loadAvailableCurricula(settings.selectedLanguage);
    loadUserCurriculumPaths(settings.selectedLanguage);
  }, [settings.selectedLanguage, loadAvailableCurricula, loadUserCurriculumPaths]);

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
    selectCurriculumPath
  };

  return (
    <CurriculumContext.Provider value={contextValue}>
      {children}
    </CurriculumContext.Provider>
  );
};
