
import { useState } from 'react';
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

  // Completely stubbed methods that don't make any database calls
  const loadRoadmaps = async () => {
    console.log('Stub useRoadmapData.loadRoadmaps called');
    return [];
  };
  
  const loadUserRoadmaps = async () => {
    console.log('Stub useRoadmapData.loadUserRoadmaps called');
    return [];
  };
  
  const initializeRoadmap = async () => {
    console.log('Stub useRoadmapData.initializeRoadmap called');
    return '';
  };
  
  const selectRoadmap = async () => {
    console.log('Stub useRoadmapData.selectRoadmap called');
    return [];
  };
  
  const getNodeExercise = async () => {
    console.log('Stub useRoadmapData.getNodeExercise called');
    return null;
  };
  
  const markNodeAsCompleted = async () => {
    console.log('Stub useRoadmapData.markNodeAsCompleted called');
    // Do nothing
  };
  
  const recordNodeCompletion = async () => {
    console.log('Stub useRoadmapData.recordNodeCompletion called');
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
