
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Create a minimal context to prevent import errors
interface RoadmapContextValue {
  nodeLoading: boolean;
  completedNodes: string[];
  getNodeExercise: (nodeId: string) => Promise<any>;
  markNodeAsCompleted: (nodeId: string) => Promise<void>;
  incrementNodeCompletion: (nodeId: string, accuracy: number) => void;
  nodeProgress: any[];
}

// Create the context with default values
const RoadmapContext = createContext<RoadmapContextValue>({
  nodeLoading: false,
  completedNodes: [],
  getNodeExercise: async () => ({}),
  markNodeAsCompleted: async () => {},
  incrementNodeCompletion: () => {},
  nodeProgress: [],
});

// Provider component
export const RoadmapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [nodeProgress, setNodeProgress] = useState<any[]>([]);

  // Stub functions
  const getNodeExercise = async (nodeId: string): Promise<any> => {
    console.warn('getNodeExercise called, but roadmap feature has been removed');
    return {};
  };

  const markNodeAsCompleted = async (nodeId: string): Promise<void> => {
    console.warn('markNodeAsCompleted called, but roadmap feature has been removed');
  };

  const incrementNodeCompletion = (nodeId: string, accuracy: number): void => {
    console.warn('incrementNodeCompletion called, but roadmap feature has been removed');
  };

  const value = {
    nodeLoading: false,
    completedNodes,
    getNodeExercise,
    markNodeAsCompleted,
    incrementNodeCompletion,
    nodeProgress,
  };

  return <RoadmapContext.Provider value={value}>{children}</RoadmapContext.Provider>;
};

// Hook to use the roadmap context
export const useRoadmap = () => useContext(RoadmapContext);
