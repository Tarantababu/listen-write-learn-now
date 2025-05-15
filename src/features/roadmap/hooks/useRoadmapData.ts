
import { useState, useCallback, useRef, useEffect } from 'react';
import { roadmapService } from '../services/RoadmapService';
import { RoadmapItem, RoadmapNode, UserRoadmap, ExerciseContent, NodeCompletionResult } from '../types';
import { Language, LanguageLevel } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { asUUID, asFilterParam } from '@/lib/utils/supabaseHelpers';

// Constants for data refresh management
const DATA_REFRESH_INTERVAL = 60000; // 1 minute interval for data refresh
const MAX_REFRESH_INTERVAL = 300000; // 5 minutes maximum interval with backoff
const BACKOFF_MULTIPLIER = 2; // Exponential backoff multiplier

export function useRoadmapData() {
  const [isLoading, setIsLoading] = useState(false);
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [userRoadmaps, setUserRoadmaps] = useState<UserRoadmap[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapItem | null>(null);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [refreshInterval, setRefreshInterval] = useState(DATA_REFRESH_INTERVAL);
  const [lastActivity, setLastActivity] = useState(Date.now());
  
  // Use refs to prevent unnecessary renders and track loading states
  const loadingRef = useRef<{[key: string]: boolean}>({});
  const initialLoadedRef = useRef<{[key: string]: boolean}>({});
  const timerRef = useRef<number | null>(null);
  
  // Track user activity to implement exponential backoff
  const trackActivity = useCallback(() => {
    setLastActivity(Date.now());
    setRefreshInterval(DATA_REFRESH_INTERVAL); // Reset interval on activity
  }, []);
  
  useEffect(() => {
    // Setup activity tracking
    window.addEventListener('click', trackActivity);
    window.addEventListener('keydown', trackActivity);
    window.addEventListener('mousemove', trackActivity);
    
    return () => {
      window.removeEventListener('click', trackActivity);
      window.removeEventListener('keydown', trackActivity);
      window.removeEventListener('mousemove', trackActivity);
      
      // Clear any timers on unmount
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [trackActivity]);
  
  // Load all roadmaps available for a language
  const loadRoadmaps = useCallback(async (language: Language) => {
    // Prevent duplicate fetches for the same language
    const cacheKey = `roadmaps_${language}`;
    if (loadingRef.current[cacheKey]) {
      return;
    }
    
    // If we've already loaded this data and have results, don't fetch again
    if (initialLoadedRef.current[cacheKey] && roadmaps.length > 0) {
      return;
    }
    
    loadingRef.current[cacheKey] = true;
    setIsLoading(true);
    
    try {
      const roadmapsData = await roadmapService.getRoadmapsForLanguage(language);
      setRoadmaps(roadmapsData);
      initialLoadedRef.current[cacheKey] = true;
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
  }, [roadmaps.length]);
  
  // Load user's roadmaps for the selected language
  const loadUserRoadmaps = useCallback(async (language: Language) => {
    // Add cache key for user roadmaps
    const cacheKey = `user_roadmaps_${language}`;
    if (loadingRef.current[cacheKey]) {
      return [];
    }
    
    loadingRef.current[cacheKey] = true;
    setIsLoading(true);
    
    try {
      const roadmapsList = await roadmapService.getUserRoadmaps(language);
      setUserRoadmaps(roadmapsList);
      
      if (roadmapsList.length > 0 && !selectedRoadmap) {
        // Convert UserRoadmap to RoadmapItem for compatibility
        const firstRoadmap: RoadmapItem = {
          id: roadmapsList[0].id,
          name: roadmapsList[0].name,
          level: roadmapsList[0].level,
          description: roadmapsList[0].description,
          languages: roadmapsList[0].languages, // Now languages is required in UserRoadmap
          createdAt: roadmapsList[0].createdAt,
          updatedAt: roadmapsList[0].updatedAt,
          userId: roadmapsList[0].userId,
          roadmapId: roadmapsList[0].roadmapId,
          language: roadmapsList[0].language,
          currentNodeId: roadmapsList[0].currentNodeId
        };
        setSelectedRoadmap(firstRoadmap);
      }
      
      initialLoadedRef.current[cacheKey] = true;
      return roadmapsList;
    } catch (error) {
      console.error('Error loading user roadmaps:', error);
      toast({
        variant: "destructive",
        title: "Failed to load roadmaps",
        description: "There was an error loading your roadmaps."
      });
      return [];
    } finally {
      setIsLoading(false);
      loadingRef.current[cacheKey] = false;
    }
  }, [selectedRoadmap]);
  
  // Select and load a specific roadmap (moved before initializeRoadmap)
  const selectRoadmap = useCallback(async (roadmapId: string) => {
    // Prevent duplicate selects for the same roadmap
    const cacheKey = `select_roadmap_${roadmapId}`;
    if (loadingRef.current[cacheKey]) {
      return [];
    }
    
    // Don't re-fetch if we've already selected this roadmap
    if (selectedRoadmap?.id === roadmapId && nodes.length > 0) {
      return nodes;
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
  }, [userRoadmaps, selectedRoadmap, nodes.length]);
  
  // Initialize a new roadmap for the user
  const initializeRoadmap = useCallback(async (level: LanguageLevel, language: Language) => {
    if (loadingRef.current['initialize']) {
      return '';
    }
    
    loadingRef.current['initialize'] = true;
    setIsLoading(true);
    
    try {
      // Explicitly call the service with the user's authentication to ensure roadmap is linked to this user
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
      loadingRef.current['initialize'] = false;
    }
  }, [loadUserRoadmaps, selectRoadmap]);
  
  // Get exercise content for a node
  const getNodeExercise = useCallback(async (nodeId: string) => {
    const cacheKey = `exercise_${nodeId}`;
    if (loadingRef.current[cacheKey]) {
      return null;
    }
    
    loadingRef.current[cacheKey] = true;
    
    try {
      const result = await roadmapService.getNodeExerciseContent(nodeId);
      return result;
    } catch (error) {
      console.error('Error getting node exercise:', error);
      toast({
        variant: "destructive",
        title: "Failed to load exercise",
        description: "There was an error loading the exercise content."
      });
      return null;
    } finally {
      loadingRef.current[cacheKey] = false;
    }
  }, []);
  
  // Record completion with accuracy score
  const recordNodeCompletion = useCallback(async (nodeId: string, accuracy: number): Promise<NodeCompletionResult> => {
    if (loadingRef.current[`complete_${nodeId}`]) {
      return { isCompleted: false, completionCount: 0 };
    }
    
    loadingRef.current[`complete_${nodeId}`] = true;
    
    try {
      const result = await roadmapService.recordNodeCompletion(nodeId, accuracy);
      return result;
    } catch (error) {
      console.error('Error recording node completion:', error);
      toast({
        variant: "destructive",
        title: "Failed to save progress",
        description: "There was an error saving your progress."
      });
      throw error;
    } finally {
      loadingRef.current[`complete_${nodeId}`] = false;
    }
  }, []);
  
  // Mark a node as completed
  const markNodeAsCompleted = useCallback(async (nodeId: string) => {
    if (loadingRef.current[`mark_complete_${nodeId}`]) {
      return;
    }
    
    loadingRef.current[`mark_complete_${nodeId}`] = true;
    
    try {
      await roadmapService.markNodeAsCompleted(nodeId);
      
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
    } finally {
      loadingRef.current[`mark_complete_${nodeId}`] = false;
    }
  }, [selectedRoadmap, selectRoadmap]);
  
  // Complete a node with a specific accuracy
  const markNodeWithAccuracy = useCallback(async (nodeId: string, accuracy: number) => {
    if (loadingRef.current[`mark_accuracy_${nodeId}`]) {
      return;
    }
    
    loadingRef.current[`mark_accuracy_${nodeId}`] = true;
    setIsLoading(true);
    
    try {
      const result = await roadmapService.markNodeAsCompleted(nodeId);
      // ... handle result
      toast({
        title: "Progress saved!",
        description: `You completed this node with ${Math.round(accuracy)}% accuracy.`
      });
    } catch (error) {
      console.error('Error marking node with accuracy:', error);
      toast({
        variant: "destructive",
        title: "Failed to save progress",
        description: "There was an error saving your progress."
      });
    } finally {
      setIsLoading(false);
      loadingRef.current[`mark_accuracy_${nodeId}`] = false;
    }
  }, []);
  
  // Manual refresh function for user-triggered data refresh
  const refreshData = useCallback(async (language?: Language) => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      trackActivity(); // Track this as user activity
      
      // Refresh roadmaps if we have a language
      if (language) {
        await loadRoadmaps(language);
      }
      
      // Refresh user roadmaps
      if (language) {
        await loadUserRoadmaps(language);
      }
      
      // Refresh selected roadmap's nodes
      if (selectedRoadmap) {
        await selectRoadmap(selectedRoadmap.id);
      }
      
      toast({
        title: "Data refreshed",
        description: "Your data has been successfully refreshed."
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        variant: "destructive",
        title: "Failed to refresh data",
        description: "There was an error refreshing your data."
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, loadRoadmaps, loadUserRoadmaps, selectRoadmap, selectedRoadmap, trackActivity]);
  
  // Helper derived values
  const currentNodeId = selectedRoadmap?.currentNodeId;
  const currentNode = nodes.find(n => n.id === currentNodeId) || null;
  const completedNodes = nodes.filter(n => n.status === 'completed').map(n => n.id);
  const availableNodes = nodes.filter(n => n.status === 'available').map(n => n.id);
  
  // Implement smart polling with backoff
  useEffect(() => {
    // Only set up polling if we have a selectedRoadmap
    if (!selectedRoadmap) return;
    
    // Clear any existing timer
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // Calculate backoff based on inactivity
    const inactiveTime = Date.now() - lastActivity;
    let currentInterval = refreshInterval;
    
    // Implement exponential backoff if user has been inactive
    if (inactiveTime > DATA_REFRESH_INTERVAL) {
      currentInterval = Math.min(
        refreshInterval * BACKOFF_MULTIPLIER, 
        MAX_REFRESH_INTERVAL
      );
      setRefreshInterval(currentInterval);
    }
    
    // Set the timer for the next refresh
    const timerId = window.setTimeout(() => {
      // Only refresh if we're not already loading something
      if (!isLoading && selectedRoadmap?.language) {
        // Check for updates to the currently selected roadmap
        selectRoadmap(selectedRoadmap.id).catch(console.error);
      }
    }, currentInterval);
    
    timerRef.current = timerId;
    
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [selectedRoadmap, refreshInterval, lastActivity, isLoading]);
  
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
    markNodeWithAccuracy,
    refreshData, // New manual refresh function
  };
}
