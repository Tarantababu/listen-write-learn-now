
import { useState, useCallback, useRef, useEffect } from 'react';
import { roadmapService } from '../api/roadmapService';
import { RoadmapItem, RoadmapNode, ExerciseContent, NodeCompletionResult } from '../types';
import { Language, LanguageLevel } from '@/types';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useRoadmapData() {
  const [isLoading, setIsLoading] = useState(false);
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [userRoadmaps, setUserRoadmaps] = useState<RoadmapItem[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapItem | null>(null);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const loadingRef = useRef<{[key: string]: boolean}>({});
  
  // Load all roadmaps available for a language
  const loadRoadmaps = useCallback(async (language: Language) => {
    // Prevent duplicate fetches for the same language
    const cacheKey = `roadmaps_${language}`;
    if (loadingRef.current[cacheKey]) {
      return;
    }
    
    loadingRef.current[cacheKey] = true;
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
      loadingRef.current[cacheKey] = false;
    }
  }, []);
  
  // Load user's roadmaps for a language
  const loadUserRoadmaps = useCallback(async (language: Language) => {
    // Prevent duplicate fetches for the same language
    const cacheKey = `user_roadmaps_${language}`;
    if (loadingRef.current[cacheKey]) {
      return [];
    }
    
    loadingRef.current[cacheKey] = true;
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
      loadingRef.current[cacheKey] = false;
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
    // Prevent duplicate selects for the same roadmap
    const cacheKey = `select_roadmap_${roadmapId}`;
    if (loadingRef.current[cacheKey]) {
      return [];
    }
    
    loadingRef.current[cacheKey] = true;
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
      loadingRef.current[cacheKey] = false;
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
      const result = await roadmapService.recordNodeCompletion(nodeId, accuracy);
      
      // If accuracy is high enough (95%+) and node is in the current language,
      // record this in the user_daily_activities table
      if (accuracy >= 95 && selectedRoadmap?.language) {
        try {
          // Get the user ID
          const userId = (await supabase.auth.getUser()).data.user?.id;
          if (userId) {
            // Use our new record_language_activity function to update streaks
            await supabase.rpc(
              'record_language_activity',
              {
                user_id_param: userId,
                language_param: selectedRoadmap.language,
                activity_date_param: new Date().toISOString().split('T')[0],
                exercises_completed_param: 1,
                words_mastered_param: 0 // Words mastered is calculated separately
              }
            );
          }
        } catch (error) {
          console.error('Error recording daily activity for roadmap node:', error);
          // Non-critical error, don't fail the whole operation
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error recording node completion:', error);
      toast({
        variant: "destructive",
        title: "Failed to save progress",
        description: "There was an error saving your progress."
      });
      throw error;
    }
  }, [selectedRoadmap]);
  
  // Mark a node as completed
  const markNodeAsCompleted = useCallback(async (nodeId: string) => {
    try {
      await roadmapService.markNodeCompleted(nodeId);
      
      // Record this completion in the user_daily_activities table
      if (selectedRoadmap?.language) {
        try {
          // Get the user ID
          const userId = (await supabase.auth.getUser()).data.user?.id;
          if (userId) {
            // Use our new record_language_activity function to update streaks
            await supabase.rpc(
              'record_language_activity',
              {
                user_id_param: userId,
                language_param: selectedRoadmap.language,
                activity_date_param: new Date().toISOString().split('T')[0],
                exercises_completed_param: 1,
                words_mastered_param: 0 // Words mastered is calculated separately
              }
            );
          }
        } catch (error) {
          console.error('Error recording daily activity for completed node:', error);
          // Non-critical error, don't fail the whole operation
        }
      }
      
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
