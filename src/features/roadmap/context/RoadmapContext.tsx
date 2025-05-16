
import React, { createContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useRoadmapData } from '../hooks/useRoadmapData';
import { RoadmapItem, RoadmapNode } from '../types';
import { Language, LanguageLevel } from '@/types';
import { NodeProgressDetails } from '../types/service-types';
import { roadmapService } from '../api/roadmapService';
import { ProgressService } from '../services';

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
  initializeUserRoadmap: (level: LanguageLevel, language: Language) => Promise<string>;
  loadUserRoadmaps: (language: Language) => Promise<RoadmapItem[]>;
  loadRoadmaps: (language: Language) => Promise<RoadmapItem[]>;
  selectRoadmap: (roadmapId: string) => Promise<RoadmapNode[]>;
  resetProgress: (roadmapId: string) => Promise<void>;
  getNodeExercise: (nodeId: string) => Promise<any>;
  markNodeAsCompleted: (nodeId: string) => Promise<void>;
  recordNodeCompletion: (nodeId: string, accuracy: number) => Promise<any>;
}

export const RoadmapContext = createContext<RoadmapContextType | undefined>(undefined);

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
    loadRoadmaps,
    loadUserRoadmaps,
    initializeRoadmap,
    selectRoadmap,
    getNodeExercise,
    markNodeAsCompleted,
    recordNodeCompletion,
  } = useRoadmapData();
  
  const [nodeProgress, setNodeProgress] = useState<NodeProgressDetails[]>([]);
  
  // Load all roadmaps and user roadmaps when the selected language changes
  useEffect(() => {
    const loadData = async () => {
      console.log(`Loading roadmap data for language: ${settings.selectedLanguage}`);
      await loadRoadmaps(settings.selectedLanguage);
      await loadUserRoadmaps(settings.selectedLanguage);
    };
    
    loadData();
  }, [settings.selectedLanguage, loadRoadmaps, loadUserRoadmaps]);
  
  // Auto-select first user roadmap if none is selected
  useEffect(() => {
    const autoSelectRoadmap = async () => {
      if (!selectedRoadmap && userRoadmaps.length > 0 && !isLoading) {
        console.log(`Auto-selecting first user roadmap: ${userRoadmaps[0].id}`);
        try {
          await selectRoadmap(userRoadmaps[0].id);
        } catch (error) {
          console.error('Error auto-selecting roadmap:', error);
        }
      }
    };
    
    autoSelectRoadmap();
  }, [userRoadmaps, selectedRoadmap, selectRoadmap, isLoading]);
  
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
    initializeUserRoadmap: initializeRoadmap,
    loadUserRoadmaps,
    loadRoadmaps,
    selectRoadmap,
    resetProgress,
    getNodeExercise,
    markNodeAsCompleted,
    recordNodeCompletion,
  };

  return (
    <RoadmapContext.Provider value={contextValue}>
      {children}
    </RoadmapContext.Provider>
  );
};
