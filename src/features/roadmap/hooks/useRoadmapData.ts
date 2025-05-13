
import { useState, useCallback } from 'react';
import { roadmapService } from '../api/roadmapService';
import { RoadmapItem, RoadmapNode, ExerciseContent, NodeCompletionResult } from '../types';
import { Language, LanguageLevel } from '@/types';
import { toast } from '@/components/ui/use-toast';

export function useRoadmapData() {
  const [isLoading, setIsLoading] = useState(false);
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [userRoadmaps, setUserRoadmaps] = useState<RoadmapItem[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapItem | null>(null);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  
  // Load all roadmaps available for a language
  const loadRoadmaps = useCallback(async (language: Language) => {
    setIsLoading(true);
    try {
      const roadmapsData = await roadmapService.getRoadmapsForLanguage(language);
      setRoadmaps(roadmapsData);
    } catch (error) {
      console.error('Error loading roadmaps:', error);
      toast({
        variant: "destructive",
        title: "Failed to load roadmaps",
        description: "There was an error loading available roadmaps."
      });
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Load user's roadmaps for a language
  const loadUserRoadmaps = useCallback(async (language: Language) => {
    setIsLoading(true);
    try {
      const userRoadmapsData = await roadmapService.getUserRoadmaps(language);
      setUserRoadmaps(userRoadmapsData);
      return userRoadmapsData;
    } catch (error) {
      console.error('Error loading user roadmaps:', error);
      toast({
        variant: "destructive",
        title: "Failed to load your roadmaps",
        description: "There was an error loading your roadmaps."
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Initialize a new roadmap for the user
  const initializeRoadmap = useCallback(async (level: LanguageLevel, language: Language) => {
    setIsLoading(true);
    try {
      const roadmapId = await roadmapService.initializeRoadmap(level, language);
      
      // Reload user roadmaps to include the new one
      const updatedRoadmaps = await loadUserRoadmaps(language);
      
      // Select the newly created roadmap
      const newRoadmap = updatedRoadmaps.find(r => r.id === roadmapId);
      if (newRoadmap) {
        await selectRoadmap(newRoadmap.id);
      }
      
      return roadmapId;
    } catch (error) {
      console.error('Error initializing roadmap:', error);
      toast({
        variant: "destructive",
        title: "Failed to create roadmap",
        description: "There was an error creating your roadmap."
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadUserRoadmaps]);
  
  // Select and load a specific roadmap
  const selectRoadmap = useCallback(async (roadmapId: string) => {
    setIsLoading(true);
    try {
      // Find the roadmap in the list of user roadmaps
      const roadmap = userRoadmaps.find(r => r.id === roadmapId);
      if (!roadmap) {
        throw new Error('Roadmap not found');
      }
      
      setSelectedRoadmap(roadmap);
      
      // Load the nodes for this roadmap
      const nodesData = await roadmapService.getRoadmapNodes(roadmapId);
      setNodes(nodesData);
      
      return nodesData;
    } catch (error) {
      console.error('Error selecting roadmap:', error);
      toast({
        variant: "destructive",
        title: "Failed to load roadmap",
        description: "There was an error loading the roadmap details."
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userRoadmaps]);
  
  // Get exercise content for a node
  const getNodeExercise = useCallback(async (nodeId: string) => {
    try {
      return await roadmapService.getNodeExerciseContent(nodeId);
    } catch (error) {
      console.error('Error getting node exercise:', error);
      toast({
        variant: "destructive",
        title: "Failed to load exercise",
        description: "There was an error loading the exercise content."
      });
      return null;
    }
  }, []);
  
  // Record completion with accuracy score
  const recordNodeCompletion = useCallback(async (nodeId: string, accuracy: number): Promise<NodeCompletionResult> => {
    try {
      return await roadmapService.recordNodeCompletion(nodeId, accuracy);
    } catch (error) {
      console.error('Error recording node completion:', error);
      toast({
        variant: "destructive",
        title: "Failed to save progress",
        description: "There was an error saving your progress."
      });
      throw error;
    }
  }, []);
  
  // Mark a node as completed
  const markNodeAsCompleted = useCallback(async (nodeId: string) => {
    try {
      await roadmapService.markNodeCompleted(nodeId);
      
      // Refresh nodes after completion
      if (selectedRoadmap) {
        await selectRoadmap(selectedRoadmap.id);
      }
    } catch (error) {
      console.error('Error marking node as completed:', error);
      toast({
        variant: "destructive",
        title: "Failed to complete lesson",
        description: "There was an error marking the lesson as completed."
      });
      throw error;
    }
  }, [selectedRoadmap, selectRoadmap]);
  
  // Helper derived values
  const currentNodeId = selectedRoadmap?.currentNodeId;
  const currentNode = nodes.find(n => n.id === currentNodeId) || null;
  const completedNodes = nodes.filter(n => n.status === 'completed').map(n => n.id);
  const availableNodes = nodes.filter(n => n.status === 'available').map(n => n.id);
  
  return {
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
  };
}
