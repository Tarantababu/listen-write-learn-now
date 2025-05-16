
import React, { createContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useRoadmapData } from '../features/roadmap/hooks/useRoadmapData';
import { RoadmapItem, RoadmapNode } from '../features/roadmap/types';
import { Language, LanguageLevel } from '@/types';
import { NodeProgressDetails } from '../features/roadmap/types/service-types';
import { roadmapService } from '../features/roadmap/api/roadmapService';
import { ProgressService } from '../features/roadmap/services';

interface RoadmapContextType {
  roadmaps: RoadmapItem[];
  userRoadmaps: RoadmapItem[];
  currentRoadmap: RoadmapItem | null;
  nodes: RoadmapNode[];
  currentNodeId: string | undefined;
  currentNode: RoadmapNode | null;
  completedNodes: string[];
  availableNodes: string[];
  nodeProgress: NodeProgressDetails[];
  isLoading: boolean;
  nodeLoading: boolean;
  initializeUserRoadmap: (level: LanguageLevel, language: Language) => Promise<string>;
  loadUserRoadmaps: (language: Language) => Promise<RoadmapItem[]>;
  loadRoadmaps: (language: Language) => Promise<RoadmapItem[]>;
  selectRoadmap: (roadmapId: string) => Promise<RoadmapNode[]>;
  resetProgress: (roadmapId: string) => Promise<void>;
  getNodeExercise: (nodeId: string) => Promise<any>;
  markNodeAsCompleted: (nodeId: string) => Promise<void>;
  recordNodeCompletion: (nodeId: string, accuracy: number) => Promise<any>;
  incrementNodeCompletion: (nodeId: string, accuracy: number) => Promise<any>;
}

export const RoadmapContext = createContext<RoadmapContextType | null>(null);

// Track initial load to prevent duplicate API calls
let initialLoadComplete = false;

export const RoadmapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { settings } = useUserSettingsContext();
  const {
    isLoading,
    roadmaps,
    userRoadmaps,
    selectedRoadmap,
    nodes,
    currentNodeId,
    currentNode,
    completedNodes,
    availableNodes,
    loadRoadmaps: loadRoadmapsData,
    loadUserRoadmaps: loadUserRoadmapsData,
    initializeRoadmap,
    selectRoadmap,
    getNodeExercise,
    markNodeAsCompleted,
    recordNodeCompletion,
    nodeLoading,
  } = useRoadmapData();
  
  const [nodeProgress, setNodeProgress] = useState<NodeProgressDetails[]>([]);
  const [prevLanguage, setPrevLanguage] = useState<string>(settings.selectedLanguage);
  const [loadingTriggered, setLoadingTriggered] = useState<boolean>(false);
  
  // Define these functions before they're referenced
  const loadRoadmaps = useCallback(async (language: Language): Promise<RoadmapItem[]> => {
    return await loadRoadmapsData(language);
  }, [loadRoadmapsData]);
  
  const loadUserRoadmaps = useCallback(async (language: Language): Promise<RoadmapItem[]> => {
    return await loadUserRoadmapsData(language);
  }, [loadUserRoadmapsData]);

  // Add incrementNodeCompletion method
  const incrementNodeCompletion = async (nodeId: string, accuracy: number) => {
    return await recordNodeCompletion(nodeId, accuracy);
  };
  
  // Load all roadmaps and user roadmaps when the selected language changes
  useEffect(() => {
    // Skip if we're already loading or if the language hasn't changed
    if (loadingTriggered && prevLanguage === settings.selectedLanguage) {
      return;
    }

    const loadData = async () => {
      console.log(`Loading roadmap data for language: ${settings.selectedLanguage}`);
      // Set loading triggered flag to prevent duplicate calls
      setLoadingTriggered(true);
      
      try {
        // First load all roadmaps
        await loadRoadmaps(settings.selectedLanguage);
        // Then load user roadmaps
        await loadUserRoadmaps(settings.selectedLanguage);
      } catch (error) {
        console.error(`Error loading roadmap data: ${error}`);
      } finally {
        // Update the previous language
        setPrevLanguage(settings.selectedLanguage);
        // Set initial load complete
        initialLoadComplete = true;
      }
    };
    
    loadData();
  }, [settings.selectedLanguage, loadRoadmaps, loadUserRoadmaps, loadingTriggered, prevLanguage]);
  
  // Auto-select first user roadmap if none is selected
  useEffect(() => {
    // Only run this if we have user roadmaps and no selected roadmap and we're not loading
    if (!selectedRoadmap && userRoadmaps.length > 0 && !isLoading && initialLoadComplete) {
      console.log(`Auto-selecting first user roadmap: ${userRoadmaps[0].id}`);
      try {
        // Check if the roadmap is for the current language
        const roadmapToSelect = userRoadmaps.find(
          roadmap => roadmap.language.toLowerCase() === settings.selectedLanguage.toLowerCase()
        );
        
        if (roadmapToSelect) {
          selectRoadmap(roadmapToSelect.id);
        }
      } catch (error) {
        console.error('Error auto-selecting roadmap:', error);
      }
    }
  }, [userRoadmaps, selectedRoadmap, selectRoadmap, isLoading, settings.selectedLanguage]);
  
  // Load node progress whenever selected roadmap changes
  useEffect(() => {
    const loadNodeProgress = async () => {
      if (selectedRoadmap) {
        try {
          console.log(`Loading node progress for roadmap: ${selectedRoadmap.id}`);
          const progressService = new ProgressService();
          const { data } = await progressService.getRoadmapProgress(selectedRoadmap.id);
          if (data && data.nodeProgress) {
            // Convert from record to array
            const progressArray: NodeProgressDetails[] = Object.values(data.nodeProgress);
            console.log(`Loaded progress for ${progressArray.length} nodes`);
            setNodeProgress(progressArray);
          }
        } catch (error) {
          console.error('Error loading node progress:', error);
        }
      }
    };
    
    loadNodeProgress();
  }, [selectedRoadmap]);
  
  const resetProgress = useCallback(async (roadmapId: string) => {
    try {
      const progressService = new ProgressService();
      await progressService.resetProgress(roadmapId);
      
      // Reload the roadmap to reflect the reset
      if (selectedRoadmap && selectedRoadmap.id === roadmapId) {
        await selectRoadmap(roadmapId);
      }
    } catch (error) {
      console.error('Error resetting roadmap progress:', error);
      throw error;
    }
  }, [selectRoadmap, selectedRoadmap]);
  
  const initializeUserRoadmap = useCallback(async (level: LanguageLevel, language: Language): Promise<string> => {
    return await initializeRoadmap(level, language);
  }, [initializeRoadmap]);

  // Context value
  const contextValue: RoadmapContextType = {
    roadmaps,
    userRoadmaps,
    currentRoadmap: selectedRoadmap,
    nodes,
    currentNodeId,
    currentNode,
    completedNodes,
    availableNodes,
    nodeProgress,
    isLoading,
    nodeLoading,
    initializeUserRoadmap: initializeRoadmap,
    loadUserRoadmaps,
    loadRoadmaps,
    selectRoadmap,
    resetProgress,
    getNodeExercise,
    markNodeAsCompleted,
    recordNodeCompletion,
    incrementNodeCompletion,
  };

  return (
    <RoadmapContext.Provider value={contextValue}>
      {children}
    </RoadmapContext.Provider>
  );
};
