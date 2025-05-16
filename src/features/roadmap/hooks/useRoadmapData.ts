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
  
  // Refs for request tracking and caching
  const loadingRef = useRef<{[key: string]: boolean}>({});
  const cacheRef = useRef<{
    roadmaps: {[language: string]: RoadmapItem[]},
    userRoadmaps: {[language: string]: RoadmapItem[]},
    nodes: {[roadmapId: string]: RoadmapNode[]}
  }>({
    roadmaps: {},
    userRoadmaps: {},
    nodes: {}
  });
  const requestTimestampsRef = useRef<{[key: string]: number}>({});
  
  // Cache expiration time in milliseconds (5 minutes)
  const CACHE_EXPIRATION = 5 * 60 * 1000;
  
  // Check if cache is valid
  const isCacheValid = (cacheKey: string) => {
    const timestamp = requestTimestampsRef.current[cacheKey];
    if (!timestamp) return false;
    return (Date.now() - timestamp) < CACHE_EXPIRATION;
  };
  
  // Load all roadmaps available for a language
  const loadRoadmaps = useCallback(async (language: Language) => {
    // Normalize language to lowercase for consistent comparison
    const normalizedLanguage = language.toLowerCase() as Language;
    
    // Cache key for this specific request
    const cacheKey = `roadmaps_${normalizedLanguage}`;
    
    // Return cached data if available and not expired
    if (cacheRef.current.roadmaps[normalizedLanguage] && isCacheValid(cacheKey)) {
      console.log(`Using cached roadmaps for ${normalizedLanguage}`);
      return cacheRef.current.roadmaps[normalizedLanguage];
    }
    
    // Prevent duplicate fetches for the same language
    if (loadingRef.current[cacheKey]) {
      console.log(`Already loading roadmaps for ${normalizedLanguage}, skipping duplicate request`);
      return cacheRef.current.roadmaps[normalizedLanguage] || [];
    }
    
    loadingRef.current[cacheKey] = true;
    setIsLoading(true);
    
    console.log(`Loading all roadmaps for language: ${normalizedLanguage}`);
    
    try {
      const roadmapsData = await roadmapService.getRoadmapsForLanguage(normalizedLanguage);
      console.log(`Loaded ${roadmapsData.length} roadmaps for ${normalizedLanguage}`);
      
      // Update state and cache
      setRoadmaps(roadmapsData);
      cacheRef.current.roadmaps[normalizedLanguage] = roadmapsData;
      requestTimestampsRef.current[cacheKey] = Date.now();
      
      return roadmapsData;
    } catch (error) {
      console.error(`Error loading roadmaps for ${normalizedLanguage}:`, error);
      toast({
        variant: "destructive",
        title: "Failed to load roadmaps",
        description: "There was an error loading available roadmaps."
      });
      return [];
    } finally {
      setIsLoading(false);
      loadingRef.current[cacheKey] = false;
    }
  }, []);
  
  // Load user's roadmaps for a language
  const loadUserRoadmaps = useCallback(async (language: Language) => {
    // Normalize language to lowercase for consistent comparison
    const normalizedLanguage = language.toLowerCase() as Language;
    
    // Cache key for this specific request
    const cacheKey = `user_roadmaps_${normalizedLanguage}`;
    
    // Return cached data if available and not expired
    if (cacheRef.current.userRoadmaps[normalizedLanguage] && isCacheValid(cacheKey)) {
      console.log(`Using cached user roadmaps for ${normalizedLanguage}`);
      return cacheRef.current.userRoadmaps[normalizedLanguage];
    }
    
    // Prevent duplicate fetches for the same language
    if (loadingRef.current[cacheKey]) {
      console.log(`Already loading user roadmaps for ${normalizedLanguage}, skipping duplicate request`);
      return cacheRef.current.userRoadmaps[normalizedLanguage] || [];
    }
    
    loadingRef.current[cacheKey] = true;
    setIsLoading(true);
    
    console.log(`Loading user roadmaps for language: ${normalizedLanguage}`);
    
    try {
      const userRoadmapsData = await roadmapService.getUserRoadmaps(normalizedLanguage);
      console.log(`Loaded ${userRoadmapsData.length} user roadmaps for ${normalizedLanguage}`);
      
      // Update state and cache
      setUserRoadmaps(userRoadmapsData);
      cacheRef.current.userRoadmaps[normalizedLanguage] = userRoadmapsData;
      requestTimestampsRef.current[cacheKey] = Date.now();
      
      return userRoadmapsData;
    } catch (error) {
      console.error(`Error loading user roadmaps for ${normalizedLanguage}:`, error);
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
    // Normalize language to lowercase for consistent comparison
    const normalizedLanguage = language.toLowerCase() as Language;
    
    setIsLoading(true);
    console.log(`Initializing roadmap for level ${level} and language ${normalizedLanguage}`);
    
    let loadingToastId: string | undefined;
    
    try {
      // Show loading toast
      const loadingToast = toast({
        title: "Creating your roadmap...",
        description: "Please wait while we prepare your learning path.",
        duration: 5000,
      });
      
      const roadmapId = await roadmapService.initializeRoadmap(level, normalizedLanguage);
      console.log(`Roadmap initialized with ID: ${roadmapId}`);
      
      // Invalidate user roadmaps cache to force reload
      delete cacheRef.current.userRoadmaps[normalizedLanguage];
      
      // Reload user roadmaps to include the new one
      const updatedRoadmaps = await loadUserRoadmaps(normalizedLanguage);
      
      // Toast success
      toast({
        title: "Roadmap created successfully!",
        description: "Your new learning path is ready.",
        variant: "default",
      });
      
      // Select the newly created roadmap
      const newRoadmap = updatedRoadmaps.find(r => r.id === roadmapId);
      if (newRoadmap) {
        await selectRoadmap(newRoadmap.id);
      }
      
      return roadmapId;
    } catch (error) {
      console.error('Error initializing roadmap:', error);
      
      // Show error
      toast({
        variant: "destructive",
        title: "Failed to create roadmap",
        description: "There was an error creating your roadmap. Please try again."
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadUserRoadmaps]);
  
  // Select and load a specific roadmap
  const selectRoadmap = useCallback(async (roadmapId: string) => {
    // Cache key for this specific request
    const cacheKey = `select_roadmap_${roadmapId}`;
    
    // Return cached data if available and valid
    if (cacheRef.current.nodes[roadmapId] && isCacheValid(cacheKey)) {
      console.log(`Using cached nodes for roadmap ${roadmapId}`);
      const roadmap = userRoadmaps.find(r => r.id === roadmapId);
      if (roadmap) {
        setSelectedRoadmap(roadmap);
        setNodes(cacheRef.current.nodes[roadmapId]);
        return cacheRef.current.nodes[roadmapId];
      }
    }
    
    // Prevent duplicate selects for the same roadmap
    if (loadingRef.current[cacheKey]) {
      console.log(`Already selecting roadmap ${roadmapId}, skipping duplicate request`);
      return cacheRef.current.nodes[roadmapId] || [];
    }
    
    loadingRef.current[cacheKey] = true;
    setIsLoading(true);
    
    console.log(`Selecting roadmap with ID: ${roadmapId}`);
    
    try {
      // Find the roadmap in the list of user roadmaps
      const roadmap = userRoadmaps.find(r => r.id === roadmapId);
      if (!roadmap) {
        console.error(`Roadmap with ID ${roadmapId} not found in user roadmaps`);
        throw new Error('Roadmap not found');
      }
      
      console.log(`Found roadmap: ${roadmap.name || roadmap.roadmapId} (${roadmap.language})`);
      setSelectedRoadmap(roadmap);
      
      // Load the nodes for this roadmap
      const nodesData = await roadmapService.getRoadmapNodes(roadmapId);
      console.log(`Loaded ${nodesData.length} nodes for roadmap ${roadmapId}`);
      
      // Update state and cache
      setNodes(nodesData);
      cacheRef.current.nodes[roadmapId] = nodesData;
      requestTimestampsRef.current[cacheKey] = Date.now();
      
      return nodesData;
    } catch (error) {
      console.error(`Error selecting roadmap ${roadmapId}:`, error);
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
                language_param: selectedRoadmap.language.toLowerCase(),
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
      
      // If selected roadmap exists, invalidate the cache to force reload of node data
      if (selectedRoadmap) {
        delete cacheRef.current.nodes[selectedRoadmap.id];
        // We won't await this to avoid blocking the UI
        selectRoadmap(selectedRoadmap.id).catch(err => {
          console.error('Error refreshing roadmap data after recording completion:', err);
        });
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
  }, [selectedRoadmap, selectRoadmap]);
  
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
                language_param: selectedRoadmap.language.toLowerCase(),
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
      
      // Invalidate cache for this roadmap's nodes
      if (selectedRoadmap) {
        delete cacheRef.current.nodes[selectedRoadmap.id];
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
