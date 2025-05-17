
import React, { createContext, ReactNode, useState } from 'react';
import { RoadmapItem, RoadmapNode } from '../types';
import { Language, LanguageLevel } from '@/types';
import { NodeProgressDetails } from '../types/service-types';

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

// Create a context with empty placeholder values
export const RoadmapContext = createContext<RoadmapContextType | undefined>(undefined);

/**
 * Simplified provider for RoadmapContext
 * This feature has been deprecated but this stub remains to prevent import errors
 */
export const RoadmapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const contextValue: RoadmapContextType = {
    roadmaps: [],
    userRoadmaps: [],
    currentRoadmap: null,
    nodes: [],
    currentNodeId: undefined,
    currentNode: null,
    completedNodes: [],
    availableNodes: [],
    nodeProgress: [],
    isLoading: false,
    nodeLoading: false,
    initializeUserRoadmap: async () => '',
    loadUserRoadmaps: async () => [],
    loadRoadmaps: async () => [],
    selectRoadmap: async () => [],
    resetProgress: async () => {},
    getNodeExercise: async () => null,
    markNodeAsCompleted: async () => {},
    recordNodeCompletion: async () => ({}),
    incrementNodeCompletion: async () => ({}),
  };

  return (
    <RoadmapContext.Provider value={contextValue}>
      {children}
    </RoadmapContext.Provider>
  );
};
