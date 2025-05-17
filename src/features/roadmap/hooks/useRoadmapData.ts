import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { roadmapService } from '../api/roadmapService';
import { RoadmapItem, RoadmapNode, NodeCompletionResult } from '../types';
import { Language, LanguageLevel } from '@/types';
import { nodeAccessService } from '../services/NodeAccessService';
import { supabase } from '@/integrations/supabase/client';
import { NodeProgressDetails } from '../types/service-types';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';

// Create extended roadmap service with additional methods
const extendedRoadmapService = {
  ...roadmapService,
  
  // Add initializeRoadmap functionality
  initializeRoadmap: async (level: LanguageLevel, language: Language): Promise<string> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }
      
      // Find matching roadmap for the level and language
      const roadmaps = await roadmapService.getRoadmapsForLanguage(language);
      const matchingRoadmap = roadmaps.find(r => r.level === level);
      
      if (!matchingRoadmap) {
        throw new Error(`No roadmap found for level ${level} and language ${language}`);
      }
      
      // Check if user already has this roadmap
      const userRoadmaps = await roadmapService.getUserRoadmaps(language);
      const existingRoadmap = userRoadmaps.find(r => r.roadmapId === matchingRoadmap.id);
      
      if (existingRoadmap) {
        return existingRoadmap.id;
      }
      
      // Create a new user roadmap
      const { data, error } = await supabase
        .from('user_roadmaps')
        .insert({
          user_id: userData.user.id,
          roadmap_id: matchingRoadmap.id,
          language
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return data.id;
    } catch (error) {
      console.error('Error initializing roadmap:', error);
      throw error;
    }
  },
  
  // Add getRoadmapNodes functionality
  getRoadmapNodes: async (userRoadmapId: string): Promise<RoadmapNode[]> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        return [];
      }
      
      // Get the user roadmap
      const { data: userRoadmap, error: roadmapError } = await supabase
        .from('user_roadmaps')
        .select('*')
        .eq('id', userRoadmapId)
        .single();
        
      if (roadmapError) throw roadmapError;
      
      // Get all nodes
      const { data: nodes, error: nodesError } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', userRoadmap.language)
        .order('position');
        
      if (nodesError) throw nodesError;
      
      // Format nodes
      return nodes.map(node => ({
        id: node.id,
        roadmapId: node.roadmap_id,
        title: node.title,
        description: node.description || '',
        position: node.position,
        isBonus: node.is_bonus,
        language: node.language as Language,
        defaultExerciseId: node.default_exercise_id,
        createdAt: new Date(node.created_at),
        updatedAt: node.updated_at ? new Date(node.updated_at) : undefined,
        status: 'locked' // Default status, will be updated later
      }));
    } catch (error) {
      console.error('Error getting roadmap nodes:', error);
      return [];
    }
  },
  
  // Add getNodeExerciseContent functionality
  getNodeExerciseContent: async (nodeId: string) => {
    try {
      // Get the node
      const { data: node, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('default_exercise_id')
        .eq('id', nodeId)
        .single();
        
      if (nodeError || !node.default_exercise_id) {
        return null;
      }
      
      // Get exercise content
      const { data: exercise, error: exerciseError } = await supabase
        .from('default_exercises')
        .select('*')
        .eq('id', node.default_exercise_id)
        .single();
        
      if (exerciseError) throw exerciseError;
      
      return exercise;
    } catch (error) {
      console.error('Error getting node exercise:', error);
      return null;
    }
  },
  
  // Add markNodeCompleted functionality
  markNodeCompleted: async (nodeId: string): Promise<void> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }
      
      // Get node info
      const { data: node, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('roadmap_id, language')
        .eq('id', nodeId)
        .single();
        
      if (nodeError) throw nodeError;
      
      // Mark as completed
      const { error } = await supabase
        .from('roadmap_progress')
        .insert({
          user_id: userData.user.id,
          roadmap_id: node.roadmap_id,
          node_id: nodeId,
          completed: true,
          completed_at: new Date().toISOString()
        })
        .match({ user_id: userData.user.id, roadmap_id: node.roadmap_id, node_id: nodeId });
        
      if (error && error.code !== '23505') throw error; // Ignore conflict errors
    } catch (error) {
      console.error('Error marking node as completed:', error);
      throw error;
    }
  }
};

export function useRoadmapData() {
  const { settings } = useUserSettingsContext();
  
  const [isLoading, setIsLoading] = useState(false);
  const [nodeLoading, setNodeLoading] = useState(false);
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [userRoadmaps, setUserRoadmaps] = useState<RoadmapItem[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapItem | null>(null);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  
  // Refs for request tracking and caching
  const loadingRef = useRef<{[key: string]: boolean}>({});
  const abortControllersRef = useRef<{[key: string]: AbortController}>({});
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
  
  // Cleanup function for aborting pending requests
  const cleanupRequests = useCallback((key?: string) => {
    if (key && abortControllersRef.current[key]) {
      abortControllersRef.current[key].abort();
      delete abortControllersRef.current[key];
      delete loadingRef.current[key];
    } else if (!key) {
      // Abort all pending requests
      Object.values(abortControllersRef.current).forEach(controller => {
        try {
          controller.abort();
        } catch (e) {
          console.error("Error aborting request:", e);
        }
      });
      abortControllersRef.current = {};
      loadingRef.current = {};
    }
  }, []);
  
  // Make sure to clean up on unmount
  useEffect(() => {
    return () => {
      cleanupRequests();
    };
  }, [cleanupRequests]);
  
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
    
    // Abort any existing request with this key
    cleanupRequests(cacheKey);
    
    // Prevent duplicate fetches for the same language
    if (loadingRef.current[cacheKey]) {
      console.log(`Already loading roadmaps for ${normalizedLanguage}, skipping duplicate request`);
      return cacheRef.current.roadmaps[normalizedLanguage] || [];
    }
    
    // Create new abort controller
    const abortController = new AbortController();
    abortControllersRef.current[cacheKey] = abortController;
    
    loadingRef.current[cacheKey] = true;
    setIsLoading(true);
    
    console.log(`Loading all roadmaps for language: ${normalizedLanguage}`);
    
    try {
      // Log the exact language being requested to check for case issues
      console.log(`Requesting roadmaps with exact language string: "${normalizedLanguage}"`);
      
      const roadmapsData = await roadmapService.getRoadmapsForLanguage(normalizedLanguage);
      console.log(`Loaded ${roadmapsData.length} roadmaps for ${normalizedLanguage}:`, roadmapsData);
      
      // Update state and cache
      setRoadmaps(roadmapsData);
      cacheRef.current.roadmaps[normalizedLanguage] = roadmapsData;
      requestTimestampsRef.current[cacheKey] = Date.now();
      
      return roadmapsData;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(`Error loading roadmaps for ${normalizedLanguage}:`, error);
        toast({
          variant: "destructive",
          title: "Failed to load roadmaps",
          description: "There was an error loading available roadmaps."
        });
      }
      return [];
    } finally {
      setIsLoading(false);
      delete loadingRef.current[cacheKey];
      delete abortControllersRef.current[cacheKey];
    }
  }, [cleanupRequests]);
  
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
    
    // Abort any existing request with this key
    cleanupRequests(cacheKey);
    
    // Prevent duplicate fetches for the same language
    if (loadingRef.current[cacheKey]) {
      console.log(`Already loading user roadmaps for ${normalizedLanguage}, skipping duplicate request`);
      return cacheRef.current.userRoadmaps[normalizedLanguage] || [];
    }
    
    // Create new abort controller
    const abortController = new AbortController();
    abortControllersRef.current[cacheKey] = abortController;
    
    loadingRef.current[cacheKey] = true;
    setIsLoading(true);
    
    console.log(`Loading user roadmaps for language: ${normalizedLanguage}`);
    
    try {
      // Log the exact language being requested to check for case issues
      console.log(`Requesting user roadmaps with exact language string: "${normalizedLanguage}"`);
      
      const userRoadmapsData = await roadmapService.getUserRoadmaps(normalizedLanguage);
      console.log(`Loaded ${userRoadmapsData.length} user roadmaps for ${normalizedLanguage}:`, userRoadmapsData);
      
      // Update state and cache
      setUserRoadmaps(userRoadmapsData);
      cacheRef.current.userRoadmaps[normalizedLanguage] = userRoadmapsData;
      requestTimestampsRef.current[cacheKey] = Date.now();
      
      return userRoadmapsData;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(`Error loading user roadmaps for ${normalizedLanguage}:`, error);
        toast({
          variant: "destructive",
          title: "Failed to load your roadmaps",
          description: "There was an error loading your roadmaps."
        });
      }
      return [];
    } finally {
      setIsLoading(false);
      delete loadingRef.current[cacheKey];
      delete abortControllersRef.current[cacheKey];
    }
  }, [cleanupRequests]);
  
  // Initialize a new roadmap for the user
  const initializeRoadmap = useCallback(async (level: LanguageLevel, language: Language): Promise<string> => {
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
      
      const roadmapId = await extendedRoadmapService.initializeRoadmap(level, normalizedLanguage);
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
      const nodesData = await extendedRoadmapService.getRoadmapNodes(roadmapId);
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
      setNodeLoading(true); // Set node loading state to true
      return await extendedRoadmapService.getNodeExerciseContent(nodeId);
    } catch (error) {
      console.error('Error getting node exercise:', error);
      return null;
    } finally {
      setNodeLoading(false); // Set node loading state to false when done
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
      await extendedRoadmapService.markNodeCompleted(nodeId);
      
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
    nodeLoading,
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
