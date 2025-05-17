
import { useState } from 'react';
import { roadmapService } from '../api/roadmapService';
import { RoadmapItem, RoadmapNode } from '../types';
import { Language, LanguageLevel } from '@/types';

/**
 * Simplified stub hook for the deprecated roadmap feature
 * This provides empty implementations to prevent errors in components that might reference it
 */
export function useRoadmapData() {  
  const [isLoading, setIsLoading] = useState(false);
  const [nodeLoading, setNodeLoading] = useState(false);
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [userRoadmaps, setUserRoadmaps] = useState<RoadmapItem[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapItem | null>(null);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);

  // Simplified stub methods
  const loadRoadmaps = async () => {
    return [];
  };
  
  const loadUserRoadmaps = async () => {
    return [];
  };
  
  const initializeRoadmap = async () => {
    return '';
  };
  
  const selectRoadmap = async () => {
    return [];
  };
  
  const getNodeExercise = async () => {
    return null;
  };
  
  const markNodeAsCompleted = async () => {
    // Do nothing
  };
  
  const recordNodeCompletion = async () => {
    return {
      completionCount: 0,
      isCompleted: false,
      lastPracticedAt: new Date()
    };
  };

  return {
    isLoading,
    nodeLoading,
    roadmaps,
    userRoadmaps,
    selectedRoadmap,
    nodes,
    currentNodeId: undefined,
    currentNode: null,
    completedNodes: [],
    availableNodes: [],
    loadRoadmaps,
    loadUserRoadmaps,
    initializeRoadmap,
    selectRoadmap,
    getNodeExercise,
    markNodeAsCompleted,
    recordNodeCompletion,
  };
}
