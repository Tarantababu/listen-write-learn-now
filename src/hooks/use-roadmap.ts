import { useState, useCallback, useRef, useEffect } from 'react';
import { roadmapService } from '@/features/roadmap/services/RoadmapService';
import { RoadmapItem, RoadmapNode, UserRoadmap, ExerciseContent, NodeCompletionResult } from '@/features/roadmap/types';
import { Language, LanguageLevel } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { asUUID, asFilterParam } from '@/lib/utils/supabaseHelpers';
import { apiCache } from '@/utils/apiCache';
import { isAnyPopupOpen } from '@/utils/popupStateManager';

// Constants for data refresh management
const DATA_REFRESH_INTERVAL = 300000; // 5 minutes interval for data refresh (increased from before)
const MAX_REFRESH_INTERVAL = 900000; // 15 minutes maximum interval with backoff
const BACKOFF_MULTIPLIER = 2; // Exponential backoff multiplier
const ERROR_COOLDOWN_PERIOD = 30000; // 30 seconds cooldown after error

// Function to map property names for backwards compatibility
const mapToPreviousAPIProps = (data: any) => {
  const mapped = { ...data };
  
  // Map selectedRoadmap to currentRoadmap
  if (mapped.selectedRoadmap) {
    mapped.currentRoadmap = mapped.selectedRoadmap;
  }
  
  // Map other properties as needed
  if (mapped.recordNodeCompletion) {
    mapped.incrementNodeCompletion = mapped.recordNodeCompletion;
  }
  
  if (mapped.selectRoadmap) {
    mapped.loadUserRoadmap = mapped.selectRoadmap;
  }
  
  if (mapped.initializeRoadmap) {
    mapped.initializeUserRoadmap = mapped.initializeRoadmap;
  }
  
  return mapped;
};

export function useRoadmap() {
  const [isLoading, setIsLoading] = useState(false);
  const [nodeLoading, setNodeLoading] = useState(false);
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [userRoadmaps, setUserRoadmaps] = useState<UserRoadmap[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapItem | null>(null);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [refreshInterval, setRefreshInterval] = useState(DATA_REFRESH_INTERVAL);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [languageAvailability, setLanguageAvailability] = useState<Record<string, boolean>>({});
  const [hasAutoRefreshed, setHasAutoRefreshed] = useState(false);
  const [errorState, setErrorState] = useState<{
    hasError: boolean;
    message?: string;
    suggestedLanguage?: string;
  }>({
    hasError: false
  });
  
  // Use refs to prevent unnecessary renders and track loading states
  const loadingRef = useRef<{[key: string]: boolean}>({});
  const errorTimestampsRef = useRef<{[key: string]: number}>({});
  const initialLoadedRef = useRef<{[key: string]: boolean}>({});
  const timerRef = useRef<number | null>(null);
  
  // Track user activity to implement exponential backoff
  const trackActivity = useCallback(() => {
    setLastActivity(Date.now());
    setRefreshInterval(DATA_REFRESH_INTERVAL); // Reset interval on activity
  }, []);
  
  useEffect(() => {
    // Setup activity tracking - but only monitor significant user interactions
    window.addEventListener('click', trackActivity);
    window.addEventListener('keydown', trackActivity);
    
    return () => {
      window.removeEventListener('click', trackActivity);
      window.removeEventListener('keydown', trackActivity);
      
      // Clear any timers on unmount
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [trackActivity]);
  
  // Should we retry after an error?
  const shouldRetryAfterError = useCallback((key: string): boolean => {
    const errorTimestamp = errorTimestampsRef.current[key];
    if (!errorTimestamp) return true;
    
    // Check if we've waited long enough since the last error
    const timeSinceError = Date.now() - errorTimestamp;
    return timeSinceError > ERROR_COOLDOWN_PERIOD;
  }, []);
  
  // Mark an operation as having an error, with timestamp
  const markOperationError = useCallback((key: string): void => {
    errorTimestampsRef.current[key] = Date.now();
  }, []);
  
  // Load all roadmaps available for a language
  const loadRoadmaps = useCallback(async (language: Language) => {
    // Prevent duplicate fetches for the same language
    const cacheKey = `roadmaps_${language}`;
    if (loadingRef.current[cacheKey]) {
      return;
    }
    
    // Don't retry too frequently after errors
    if (!shouldRetryAfterError(cacheKey)) {
      return;
    }
    
    try {
      setIsLoading(true);
      loadingRef.current[cacheKey] = true;
      
      const roadmapsData = await apiCache.get(
        cacheKey,
        () => roadmapService.getRoadmapsForLanguage(language),
        { allowStale: true, ttl: 300000 } // 5 minute TTL
      );
      
      // Update language availability map
      setLanguageAvailability(prev => ({
        ...prev,
        [language]: roadmapsData && roadmapsData.length > 0
      }));
      
      setRoadmaps(roadmapsData);
      initialLoadedRef.current[cacheKey] = true;
      
    } catch (error) {
      console.error('Error loading roadmaps:', error);
      markOperationError(cacheKey);
      
      // Only show toast if not an automatic refresh
      if (!hasAutoRefreshed) {
        toast({
          variant: "destructive",
          title: "Failed to load roadmaps",
          description: `Couldn't load learning paths for ${language}. Please try again later.`
        });
      }
    } finally {
      setIsLoading(false);
      loadingRef.current[cacheKey] = false;
    }
  }, [hasAutoRefreshed, shouldRetryAfterError, markOperationError]);
  
  // Load user's roadmaps for the selected language
  const loadUserRoadmaps = useCallback(async (language?: Language) => {
    // Add cache key for user roadmaps
    const cacheKey = language ? `user_roadmaps_${language}` : 'user_roadmaps_all';
    if (loadingRef.current[cacheKey]) {
      return [];
    }
    
    // Don't retry too frequently after errors
    if (!shouldRetryAfterError(cacheKey)) {
      return [];
    }
    
    try {
      setIsLoading(true);
      loadingRef.current[cacheKey] = true;
      
      const roadmapsList = await apiCache.get(
        cacheKey,
        () => roadmapService.getUserRoadmaps(language),
        { allowStale: true, ttl: 300000 } // 5 minute TTL
      );
      
      setUserRoadmaps(roadmapsList);
      
      if (roadmapsList.length > 0 && !selectedRoadmap) {
        // Convert UserRoadmap to RoadmapItem for compatibility
        const firstRoadmap: RoadmapItem = {
          id: roadmapsList[0].id,
          name: roadmapsList[0].name,
          level: roadmapsList[0].level,
          description: roadmapsList[0].description,
          languages: roadmapsList[0].languages,
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
      markOperationError(cacheKey);
      
      // Only show toast if not an automatic refresh
      if (!hasAutoRefreshed) {
        toast({
          variant: "destructive",
          title: "Failed to load your learning paths",
          description: "There was an error loading your learning paths."
        });
      }
      return [];
    } finally {
      setIsLoading(false);
      loadingRef.current[cacheKey] = false;
    }
  }, [selectedRoadmap, shouldRetryAfterError, markOperationError, hasAutoRefreshed]);
  
  // Select and load a specific roadmap
  const selectRoadmap = useCallback(async (roadmapId: string) => {
    // Prevent duplicate selects for the same roadmap
    const cacheKey = `select_roadmap_${roadmapId}`;
    if (loadingRef.current[cacheKey]) {
      return [];
    }
    
    // Don't retry too frequently after errors
    if (!shouldRetryAfterError(cacheKey)) {
      return nodes; // Return existing nodes
    }
    
    // Don't re-fetch if we've already selected this roadmap
    if (selectedRoadmap?.id === roadmapId && nodes.length > 0) {
      return nodes;
    }
    
    try {
      setIsLoading(true);
      loadingRef.current[cacheKey] = true;
      
      // Find the roadmap in the list of user roadmaps
      const roadmap = userRoadmaps.find(r => r.id === roadmapId);
      if (!roadmap) {
        throw new Error('Roadmap not found');
      }
      
      setSelectedRoadmap(roadmap);
      
      // Load the nodes for this roadmap using cache
      const nodesData = await apiCache.get(
        `roadmap_nodes_${roadmapId}`,
        () => roadmapService.getRoadmapNodes(roadmapId),
        { allowStale: true, ttl: 300000 } // 5 minute TTL
      );
      
      setNodes(nodesData);
      
      return nodesData;
    } catch (error) {
      console.error('Error selecting roadmap:', error);
      markOperationError(cacheKey);
      
      // Only show toast if not an automatic refresh
      if (!hasAutoRefreshed) {
        toast({
          variant: "destructive",
          title: "Failed to load roadmap",
          description: "There was an error loading the roadmap details."
        });
      }
      throw error;
    } finally {
      setIsLoading(false);
      loadingRef.current[cacheKey] = false;
    }
  }, [userRoadmaps, selectedRoadmap, nodes, hasAutoRefreshed, shouldRetryAfterError, markOperationError]);
  
  // For compatibility, also provide as loadUserRoadmap
  const loadUserRoadmap = selectRoadmap;
  
  // Initialize a new roadmap for the user
  const initializeRoadmap = useCallback(async (level: LanguageLevel, language: Language) => {
    if (loadingRef.current['initialize']) {
      return '';
    }
    
    loadingRef.current['initialize'] = true;
    setIsLoading(true);
    setErrorState({ hasError: false });
    
    try {
      // Check if roadmaps are available for this language before proceeding
      if (languageAvailability[language] === false) {
        throw {
          code: 'ROADMAP_NOT_AVAILABLE_FOR_LANGUAGE',
          message: `No roadmap is available for ${language}. Try English instead.`,
          suggestedLanguage: 'english'
        };
      }
      
      // Explicitly call the service with the user's authentication to ensure roadmap is linked to this user
      const roadmapId = await roadmapService.initializeRoadmap(level, language);
      
      // Invalidate user roadmaps cache since we've created a new one
      apiCache.invalidate(`user_roadmaps_${language}`);
      
      // Reload user roadmaps to include the new one
      const updatedRoadmaps = await loadUserRoadmaps(language);
      
      // Select the newly created roadmap
      const newRoadmap = updatedRoadmaps.find(r => r.id === roadmapId);
      if (newRoadmap) {
        await selectRoadmap(newRoadmap.id);
      }
      
      return roadmapId;
    } catch (error: any) {
      console.error('Error initializing roadmap:', error);
      
      // Handle special error code for language availability
      if (error?.code === 'ROADMAP_NOT_AVAILABLE_FOR_LANGUAGE') {
        setErrorState({
          hasError: true,
          message: error.message,
          suggestedLanguage: error.suggestedLanguage || 'english'
        });
        
        // Update language availability map
        setLanguageAvailability(prev => ({
          ...prev,
          [language]: false
        }));
        
        toast({
          variant: "destructive",
          title: "Language not supported",
          description: error.message || `No learning paths available for ${language}.`
        });
      } else {
        // Generic error
        setErrorState({
          hasError: true,
          message: error?.message || "Failed to create learning path"
        });
        
        toast({
          variant: "destructive",
          title: "Failed to create learning path",
          description: error?.message || "Please try a different language or level."
        });
      }
      
      throw error;
    } finally {
      setIsLoading(false);
      loadingRef.current['initialize'] = false;
    }
  }, [loadUserRoadmaps, selectRoadmap, languageAvailability]);
  
  // For compatibility, also provide as initializeUserRoadmap
  const initializeUserRoadmap = initializeRoadmap;
  
  // Function to try alternate language if current language isn't available
  const tryAlternateLanguage = useCallback(async (level: LanguageLevel, currentLanguage: Language): Promise<string> => {
    try {
      // Default to English as fallback
      const fallbackLanguage: Language = 'english';
      
      // Don't attempt retry with the same language
      if (currentLanguage === fallbackLanguage) {
        throw new Error(`No roadmap available for ${currentLanguage}`);
      }
      
      // Try with fallback language
      toast({
        title: `Trying with ${fallbackLanguage}`,
        description: `No roadmap found for ${currentLanguage}, trying ${fallbackLanguage} instead.`
      });
      
      return await initializeRoadmap(level, fallbackLanguage);
    } catch (error) {
      console.error('Error with fallback language:', error);
      throw error;
    }
  }, [initializeRoadmap]);
  
  // Get exercise content for a node
  const getNodeExercise = useCallback(async (nodeId: string) => {
    const cacheKey = `exercise_${nodeId}`;
    if (loadingRef.current[cacheKey]) {
      return null;
    }
    
    setNodeLoading(true);
    loadingRef.current[cacheKey] = true;
    
    try {
      const result = await apiCache.get(
        cacheKey,
        () => roadmapService.getNodeExerciseContent(nodeId),
        { ttl: 3600000 } // 1 hour - exercise content rarely changes
      );
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
      setNodeLoading(false);
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
      
      // Invalidate relevant caches after completion
      if (selectedRoadmap) {
        apiCache.invalidate(`roadmap_nodes_${selectedRoadmap.id}`);
        apiCache.invalidate(`user_roadmaps_${selectedRoadmap.language}`);
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
    } finally {
      loadingRef.current[`complete_${nodeId}`] = false;
    }
  }, [selectedRoadmap]);
  
  // For compatibility, also provide as incrementNodeCompletion
  const incrementNodeCompletion = recordNodeCompletion;
  
  // Mark a node as completed
  const markNodeAsCompleted = useCallback(async (nodeId: string) => {
    if (loadingRef.current[`mark_complete_${nodeId}`]) {
      return;
    }
    
    loadingRef.current[`mark_complete_${nodeId}`] = true;
    
    try {
      await roadmapService.markNodeAsCompleted(nodeId);
      
      // Invalidate relevant caches
      if (selectedRoadmap) {
        apiCache.invalidate(`roadmap_nodes_${selectedRoadmap.id}`);
        apiCache.invalidate(`user_roadmaps_${selectedRoadmap.language}`);
        
        // Refresh nodes after completion
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
  
  // Reset a roadmap's progress
  const resetProgress = useCallback(async (roadmapId: string) => {
    if (loadingRef.current[`reset_progress_${roadmapId}`]) {
      return;
    }
    
    loadingRef.current[`reset_progress_${roadmapId}`] = true;
    setIsLoading(true);
    
    try {
      await roadmapService.resetProgress(roadmapId);
      
      // Invalidate relevant caches
      apiCache.invalidate(`roadmap_nodes_${roadmapId}`);
      if (selectedRoadmap) {
        apiCache.invalidate(`user_roadmaps_${selectedRoadmap.language}`);
      }
      
      toast({
        title: "Progress reset",
        description: "Your roadmap progress has been reset."
      });
      
      // Refresh nodes after reset
      if (selectedRoadmap && selectedRoadmap.id === roadmapId) {
        await selectRoadmap(roadmapId);
      }
    } catch (error) {
      console.error('Error resetting progress:', error);
      toast({
        variant: "destructive",
        title: "Failed to reset progress",
        description: "There was an error resetting your progress."
      });
    } finally {
      setIsLoading(false);
      loadingRef.current[`reset_progress_${roadmapId}`] = false;
    }
  }, [selectedRoadmap, selectRoadmap]);
  
  // Manual refresh function for user-triggered data refresh
  const refreshData = useCallback(async (language?: Language) => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      trackActivity(); // Track this as user activity
      
      // Force cache invalidation for manual refresh
      if (language) {
        apiCache.invalidate(`roadmaps_${language}`);
        apiCache.invalidate(`user_roadmaps_${language}`);
      }
      
      if (selectedRoadmap) {
        apiCache.invalidate(`roadmap_nodes_${selectedRoadmap.id}`);
      }
      
      // Refresh roadmaps if we have a language
      if (language) {
        await loadRoadmaps(language);
      }
      
      // Refresh user roadmaps
      await loadUserRoadmaps(language);
      
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
  
  // Add additional helper function to clear error state
  const clearErrorState = useCallback(() => {
    setErrorState({ hasError: false });
  }, []);
  
  // Helper derived values
  const currentNodeId = selectedRoadmap?.currentNodeId;
  const currentNode = nodes.find(n => n.id === currentNodeId) || null;
  const completedNodes = nodes.filter(n => n.status === 'completed').map(n => n.id);
  const availableNodes = nodes.filter(n => n.status === 'available').map(n => n.id);
  const currentRoadmap = selectedRoadmap; // Alias for backward compatibility
  
  // Implement smart polling with backoff
  useEffect(() => {
    // Only set up polling if we have a selectedRoadmap
    if (!selectedRoadmap) return;
    
    // Clear any existing timer
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // Don't refresh data if any popup is open
    if (isAnyPopupOpen()) {
      return;
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
      // Only refresh if we're not already loading something and no popup is open
      if (!isLoading && selectedRoadmap?.language && !isAnyPopupOpen()) {
        setHasAutoRefreshed(true); // Mark this as an auto-refresh
        // Check for updates to the currently selected roadmap, but don't force refresh
        selectRoadmap(selectedRoadmap.id)
          .catch(() => {}) // Silently handle errors during auto-refresh
          .finally(() => {
            setTimeout(() => setHasAutoRefreshed(false), 100); // Reset flag after a brief delay
          });
      }
    }, currentInterval);
    
    timerRef.current = timerId;
    
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [selectedRoadmap, refreshInterval, lastActivity, isLoading, selectRoadmap]);
  
  // Return both the new property names and the old ones for backward compatibility
  return {
    // Original properties
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
    refreshData,
    
    // Additional error state properties
    errorState,
    clearErrorState,
    tryAlternateLanguage,
    languageAvailability,
    
    // Backward compatibility properties
    nodeLoading,
    currentRoadmap,
    initializeUserRoadmap,
    loadUserRoadmap,
    incrementNodeCompletion,
    resetProgress
  };
}

// For backward compatibility, also export the same function as useRoadmapData
export { useRoadmap as useRoadmapData };
