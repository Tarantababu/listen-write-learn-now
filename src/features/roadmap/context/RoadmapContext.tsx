
import React, { createContext, useContext, useEffect, ReactNode, useState, useRef } from 'react';
import { useRoadmapData } from '../hooks/useRoadmapData';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { ExerciseContent, NodeCompletionResult, RoadmapItem, RoadmapNode } from '../types';
import { Language, LanguageLevel } from '@/types';

interface RoadmapContextType {
  // State
  isLoading: boolean;
  nodeLoading: boolean;
  roadmaps: RoadmapItem[];
  userRoadmaps: RoadmapItem[];
  currentRoadmap: RoadmapItem | null;
  nodes: RoadmapNode[];
  currentNodeId?: string;
  currentNode: RoadmapNode | null;
  completedNodes: string[];
  availableNodes: string[];
  
  // Methods
  loadRoadmaps: (language: Language) => Promise<void>;
  loadUserRoadmaps: (language: Language) => Promise<RoadmapItem[]>;
  initializeUserRoadmap: (level: LanguageLevel, language: Language) => Promise<string>;
  selectRoadmap: (roadmapId: string) => Promise<RoadmapNode[]>;
  getNodeExercise: (nodeId: string) => Promise<ExerciseContent | null>;
  incrementNodeCompletion: (nodeId: string, accuracy: number) => Promise<NodeCompletionResult>;
  markNodeAsCompleted: (nodeId: string) => Promise<void>;
}

const RoadmapContext = createContext<RoadmapContextType | undefined>(undefined);

export const RoadmapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
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
    recordNodeCompletion,
    markNodeAsCompleted,
  } = useRoadmapData();

  const [nodeLoading, setNodeLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(settings.selectedLanguage);
  const initializedRef = useRef<boolean>(false);

  // Load roadmaps when language changes
  useEffect(() => {
    if (!user || !initializedRef.current) return;
    
    if (settings.selectedLanguage !== selectedLanguage) {
      setSelectedLanguage(settings.selectedLanguage);
      
      const initialize = async () => {
        await loadRoadmaps(settings.selectedLanguage);
        const updatedRoadmaps = await loadUserRoadmaps(settings.selectedLanguage);
        
        // If user has roadmaps for this language, select the first one
        if (updatedRoadmaps.length > 0) {
          await selectRoadmap(updatedRoadmaps[0].id);
        }
      };
      
      initialize().catch(error => console.error("Failed to initialize roadmaps after language change:", error));
    }
  }, [user, settings.selectedLanguage, selectedLanguage, loadRoadmaps, loadUserRoadmaps, selectRoadmap]);

  // Initial load when the component mounts
  useEffect(() => {
    if (!user || initializedRef.current) return;
    
    initializedRef.current = true;
    
    const initialize = async () => {
      await loadRoadmaps(settings.selectedLanguage);
      const userRoadmaps = await loadUserRoadmaps(settings.selectedLanguage);
      
      // If user has roadmaps for this language, select the first one
      if (userRoadmaps.length > 0) {
        await selectRoadmap(userRoadmaps[0].id);
      }
    };
    
    initialize().catch(error => console.error("Failed to initialize roadmaps:", error));
  }, [user, settings.selectedLanguage, loadRoadmaps, loadUserRoadmaps, selectRoadmap]);

  // Wrapper for initializeRoadmap to set loading state
  const initializeUserRoadmap = async (level: LanguageLevel, language: Language) => {
    return await initializeRoadmap(level, language);
  };

  // Wrapper for incrementNodeCompletion to set loading state
  const incrementNodeCompletion = async (nodeId: string, accuracy: number) => {
    setNodeLoading(true);
    try {
      const result = await recordNodeCompletion(nodeId, accuracy);
      return result;
    } finally {
      setNodeLoading(false);
    }
  };

  return (
    <RoadmapContext.Provider
      value={{
        isLoading,
        nodeLoading,
        roadmaps,
        userRoadmaps,
        currentRoadmap: selectedRoadmap,
        nodes,
        currentNodeId,
        currentNode,
        completedNodes,
        availableNodes,
        loadRoadmaps,
        loadUserRoadmaps,
        initializeUserRoadmap,
        selectRoadmap,
        getNodeExercise,
        incrementNodeCompletion,
        markNodeAsCompleted,
      }}
    >
      {children}
    </RoadmapContext.Provider>
  );
};

export const useRoadmap = () => {
  const context = useContext(RoadmapContext);
  if (context === undefined) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  return context;
};
