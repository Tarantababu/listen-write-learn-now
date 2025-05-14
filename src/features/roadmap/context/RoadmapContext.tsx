
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { roadmapService } from '../services/RoadmapService';
import { RoadmapItem, RoadmapNode, ExerciseContent, NodeCompletionResult } from '../types';
import { Language, LanguageLevel } from '@/types';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { toast } from '@/components/ui/use-toast';
import { exerciseService } from '../services/ExerciseService';

// Define the context type
interface RoadmapContextType {
  // State
  isLoading: boolean;
  nodeLoading: boolean;
  roadmaps: RoadmapItem[];
  userRoadmaps: RoadmapItem[];
  currentRoadmap: RoadmapItem | null;
  nodes: RoadmapNode[];
  // Derived state
  currentNodeId: string | undefined;
  currentNode: RoadmapNode | null;
  completedNodes: string[];
  availableNodes: string[];
  nodeProgress: Array<{ nodeId: string, completionCount: number, isCompleted: boolean }>;
  // Actions
  loadRoadmaps: (language: Language) => Promise<void>;
  loadUserRoadmaps: (language: Language) => Promise<RoadmapItem[]>;
  initializeRoadmap: (level: LanguageLevel, language: Language) => Promise<string>;
  initializeUserRoadmap: (level: LanguageLevel, language: Language) => Promise<string>; // Alias for backward compatibility
  selectRoadmap: (roadmapId: string) => Promise<RoadmapNode[]>;
  getNodeExercise: (nodeId: string) => Promise<ExerciseContent | null>;
  recordNodeCompletion: (nodeId: string, accuracy: number) => Promise<NodeCompletionResult>;
  incrementNodeCompletion: (nodeId: string, accuracy: number) => Promise<NodeCompletionResult>; // Alias for backward compatibility
  markNodeAsCompleted: (nodeId: string) => Promise<void>;
}

// Create the context with default values
export const RoadmapContext = createContext<RoadmapContextType>({
  isLoading: false,
  nodeLoading: false,
  roadmaps: [],
  userRoadmaps: [],
  currentRoadmap: null,
  nodes: [],
  currentNodeId: undefined,
  currentNode: null,
  completedNodes: [],
  availableNodes: [],
  nodeProgress: [],
  loadRoadmaps: async () => {},
  loadUserRoadmaps: async () => [],
  initializeRoadmap: async () => '',
  initializeUserRoadmap: async () => '',
  selectRoadmap: async () => [],
  getNodeExercise: async () => null,
  recordNodeCompletion: async () => ({ isCompleted: false, completionCount: 0 }),
  incrementNodeCompletion: async () => ({ isCompleted: false, completionCount: 0 }),
  markNodeAsCompleted: async () => {},
});

// Create the provider component
interface RoadmapProviderProps {
  children: ReactNode;
}

export const RoadmapProvider: React.FC<RoadmapProviderProps> = ({ children }) => {
  // State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [nodeLoading, setNodeLoading] = useState<boolean>(false);
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [userRoadmaps, setUserRoadmaps] = useState<RoadmapItem[]>([]);
  const [currentRoadmap, setCurrentRoadmap] = useState<RoadmapItem | null>(null);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [nodeProgress, setNodeProgress] = useState<Array<{ nodeId: string, completionCount: number, isCompleted: boolean }>>([]);
  
  // Get user's selected language
  const { settings } = useUserSettingsContext();
  
  // Constants for local storage
  const LOCAL_STORAGE_KEY = 'roadmap_state';
  
  // Define all functions first to avoid reference issues
  
  // Save state to local storage
  const saveStateToLocalStorage = useCallback(() => {
    if (userRoadmaps.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        userRoadmaps,
        currentRoadmapId: currentRoadmap?.id,
        lastUpdated: new Date().toISOString(),
        language: settings.selectedLanguage
      }));
    }
  }, [userRoadmaps, currentRoadmap, settings.selectedLanguage]);
  
  // Restore state from local storage
  const restoreStateFromLocalStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        
        // Only use cached data if it's for the current language and not too old (1 hour max)
        const lastUpdated = new Date(data.lastUpdated);
        const isRecent = (new Date().getTime() - lastUpdated.getTime()) < (60 * 60 * 1000);
        const isCorrectLanguage = data.language === settings.selectedLanguage;
        
        if (isRecent && isCorrectLanguage && data.userRoadmaps && data.userRoadmaps.length > 0) {
          setUserRoadmaps(data.userRoadmaps);
          
          // If we had a current roadmap, try to restore it
          if (data.currentRoadmapId) {
            const savedRoadmap = data.userRoadmaps.find((r: RoadmapItem) => r.id === data.currentRoadmapId);
            if (savedRoadmap) {
              setCurrentRoadmap(savedRoadmap);
            }
          }
          
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error restoring state from local storage:', error);
      return false;
    }
  }, [settings.selectedLanguage]);

  // Load roadmaps
  const loadRoadmaps = useCallback(async (language: Language) => {
    setIsLoading(true);
    try {
      const result = await roadmapService.getRoadmapsByLanguage(language);
      if (result.status === 'success' && result.data) {
        setRoadmaps(result.data);
      } else {
        console.error('Error loading roadmaps:', result.error);
        toast({
          variant: "destructive",
          title: "Failed to load roadmaps",
          description: "There was an error loading available roadmaps."
        });
      }
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

  // Load user roadmaps
  const loadUserRoadmaps = useCallback(async (language: Language): Promise<RoadmapItem[]> => {
    setIsLoading(true);
    try {
      const result = await roadmapService.getUserRoadmaps(language);
      if (result.status === 'success' && result.data) {
        const userRoadmapsData = result.data;
        
        // Update state immediately so other functions have access to the latest data
        setUserRoadmaps(userRoadmapsData);
        console.log('User roadmaps loaded:', userRoadmapsData);
        
        // If we have user roadmaps and none is currently selected, select the first one
        if (userRoadmapsData.length > 0 && !currentRoadmap) {
          // Don't await here to prevent blocking, but handle errors
          selectRoadmap(userRoadmapsData[0].id).catch(err => {
            console.error('Error auto-selecting first roadmap:', err);
          });
        }
        
        return userRoadmapsData;
      } else {
        console.error('Error loading user roadmaps:', result.error);
        toast({
          variant: "destructive",
          title: "Failed to load your roadmaps",
          description: "There was an error loading your roadmaps."
        });
        return [];
      }
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
  }, [currentRoadmap]);

  // Select roadmap
  const selectRoadmap = useCallback(async (roadmapId: string): Promise<RoadmapNode[]> => {
    setIsLoading(true);
    let retryCount = 0;
    const MAX_RETRIES = 3;
    
    const attemptSelection = async (): Promise<RoadmapNode[]> => {
      try {
        console.log('Selecting roadmap with ID:', roadmapId);
        console.log('Available user roadmaps:', userRoadmaps);
        
        // Find the roadmap in user roadmaps
        let roadmap = userRoadmaps.find(r => r.id === roadmapId);
        
        // If not found, try refreshing userRoadmaps first before failing
        if (!roadmap && retryCount < MAX_RETRIES) {
          console.log(`Roadmap ${roadmapId} not found. Attempting to refresh user roadmaps (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          retryCount++;
          
          // Reload user roadmaps with the current language
          const refreshedRoadmaps = await loadUserRoadmaps(settings.selectedLanguage);
          
          // Check again after refresh
          roadmap = refreshedRoadmaps.find(r => r.id === roadmapId);
          
          if (!roadmap) {
            if (retryCount < MAX_RETRIES) {
              // Wait a brief moment before retrying
              await new Promise(resolve => setTimeout(resolve, 500));
              return attemptSelection();
            } else {
              console.error('Roadmap not found with ID after multiple attempts:', roadmapId);
              console.error('Available roadmap IDs:', refreshedRoadmaps.map(r => r.id));
              throw new Error(`Roadmap not found after ${MAX_RETRIES} attempts`);
            }
          }
        } else if (!roadmap) {
          console.error('Roadmap not found with ID:', roadmapId);
          console.error('Available roadmap IDs:', userRoadmaps.map(r => r.id));
          throw new Error('Roadmap not found');
        }
        
        // Set the current roadmap
        setCurrentRoadmap(roadmap);
        
        // Load the nodes for this roadmap
        const result = await roadmapService.getRoadmapNodes(roadmapId);
        if (result.status === 'success' && result.data) {
          const nodesData = result.data;
          setNodes(nodesData);
          
          // Extract node progress information
          const progressData = nodesData.map(node => ({
            nodeId: node.id,
            completionCount: node.progressCount || 0,
            isCompleted: node.status === 'completed'
          }));
          setNodeProgress(progressData);
          
          return nodesData;
        } else {
          console.error('Error loading nodes:', result.error);
          toast({
            variant: "destructive",
            title: "Failed to load roadmap details",
            description: "There was an error loading the roadmap nodes."
          });
          throw new Error(result.error || 'Unknown error loading nodes');
        }
      } catch (error) {
        console.error('Error selecting roadmap:', error);
        throw error;
      }
    };
    
    try {
      return await attemptSelection();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load roadmap",
        description: "There was an error loading the roadmap details."
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userRoadmaps, loadUserRoadmaps, settings.selectedLanguage]);

  // Initialize a new roadmap
  const initializeRoadmap = useCallback(async (level: LanguageLevel, language: Language): Promise<string> => {
    setIsLoading(true);
    try {
      const result = await roadmapService.initializeRoadmap(level, language);
      if (result.status === 'success' && result.data) {
        // Reload user roadmaps to include the new one
        await loadUserRoadmaps(language);
        
        // Return the ID of the newly created roadmap
        return result.data;
      } else {
        console.error('Error initializing roadmap:', result.error);
        toast({
          variant: "destructive",
          title: "Failed to create roadmap",
          description: "There was an error creating your roadmap."
        });
        throw new Error(result.error || 'Unknown error initializing roadmap');
      }
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

  // Get node exercise - Fixed to use the exerciseService
  const getNodeExercise = useCallback(async (nodeId: string): Promise<ExerciseContent | null> => {
    setNodeLoading(true);
    try {
      console.log('Getting exercise for node:', nodeId);
      
      // Use the exerciseService to get the node exercise content
      const result = await exerciseService.getNodeExercise(nodeId);
      
      if (result.status === 'success' && result.data) {
        console.log('Exercise content loaded successfully:', result.data);
        return result.data;
      } else {
        console.error('Error getting node exercise:', result.error);
        toast({
          variant: "destructive",
          title: "Failed to load exercise",
          description: "There was an error loading the exercise content."
        });
        return null;
      }
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
    }
  }, []);

  // Record completion of a node with accuracy score
  const recordNodeCompletion = useCallback(async (nodeId: string, accuracy: number): Promise<NodeCompletionResult> => {
    setNodeLoading(true);
    try {
      console.log(`Recording completion for node ${nodeId} with accuracy ${accuracy}%`);
      
      // Only proceed if we have high enough accuracy
      if (accuracy < 70) {
        console.log('Accuracy too low, not recording completion');
        return { 
          isCompleted: false, 
          completionCount: 0 
        };
      }
      
      // Get the current roadmap ID
      if (!currentRoadmap) {
        throw new Error('No current roadmap selected');
      }
      
      // Call the supabase function directly since the service method may not exist
      const { data, error } = await exerciseService.supabase
        .rpc('increment_node_completion', {
          node_id_param: nodeId, 
          user_id_param: (await exerciseService.getCurrentUser()).userId,
          language_param: currentRoadmap.language,
          roadmap_id_param: currentRoadmap.roadmapId
        });
      
      if (error) {
        console.error('Error recording node completion:', error);
        throw new Error(error.message || 'Unknown error recording completion');
      }
      
      // Fetch the updated node progress
      const { data: progressData, error: progressError } = await exerciseService.supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', (await exerciseService.getCurrentUser()).userId)
        .eq('node_id', nodeId)
        .single();
      
      if (progressError) {
        console.error('Error fetching updated progress:', progressError);
        throw new Error(progressError.message || 'Unknown error fetching progress');
      }
      
      // Refresh nodes to update status after completion
      await selectRoadmap(currentRoadmap.id);
      
      return {
        isCompleted: progressData.is_completed,
        completionCount: progressData.completion_count
      };
    } catch (error) {
      console.error('Error recording completion:', error);
      toast({
        variant: "destructive",
        title: "Failed to save progress",
        description: "There was an error saving your progress."
      });
      return { 
        isCompleted: false,
        completionCount: 0
      };
    } finally {
      setNodeLoading(false);
    }
  }, [currentRoadmap, selectRoadmap]);

  // Mark a node as completed manually
  const markNodeAsCompleted = useCallback(async (nodeId: string): Promise<void> => {
    setNodeLoading(true);
    try {
      console.log('Marking node as completed:', nodeId);
      
      if (!currentRoadmap) {
        throw new Error('No current roadmap selected');
      }
      
      // Use supabase directly since the service method doesn't exist
      const auth = await exerciseService.getCurrentUser();
      
      // Check if already completed
      const { data: existingProgress, error: queryError } = await exerciseService.supabase
        .from('roadmap_progress')
        .select('id, completed')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', currentRoadmap.roadmapId)
        .eq('node_id', nodeId)
        .single();
      
      if (existingProgress && existingProgress.completed) {
        // Already completed, nothing to do
        toast({
          title: "Already completed",
          description: "This lesson was already marked as completed."
        });
        return;
      }
      
      // Insert or update progress record
      if (existingProgress) {
        // Update existing record
        await exerciseService.supabase
          .from('roadmap_progress')
          .update({
            completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id);
      } else {
        // Create new record
        await exerciseService.supabase
          .from('roadmap_progress')
          .insert({
            user_id: auth.userId,
            roadmap_id: currentRoadmap.roadmapId,
            node_id: nodeId,
            completed: true,
            completed_at: new Date().toISOString()
          });
      }
      
      // Update node progress record if it exists
      await exerciseService.supabase
        .from('roadmap_nodes_progress')
        .upsert({
          user_id: auth.userId,
          roadmap_id: currentRoadmap.roadmapId,
          node_id: nodeId,
          language: currentRoadmap.language,
          completion_count: 3, // Set to 3 to mark as completed
          is_completed: true,
          last_practiced_at: new Date().toISOString()
        }, { onConflict: 'user_id,node_id,language' });
      
      // Refresh nodes after completion
      await selectRoadmap(currentRoadmap.id);
      
      toast({
        title: "Lesson completed",
        description: "You've completed this lesson successfully."
      });
    } catch (error) {
      console.error('Error marking node as completed:', error);
      toast({
        variant: "destructive",
        title: "Failed to complete lesson",
        description: "There was an error marking the lesson as completed."
      });
      throw error;
    } finally {
      setNodeLoading(false);
    }
  }, [currentRoadmap, selectRoadmap]);

  // Create an alias for initializeRoadmap for backward compatibility
  const initializeUserRoadmap = initializeRoadmap;
  
  // Create an alias for recordNodeCompletion for backward compatibility
  const incrementNodeCompletion = recordNodeCompletion;

  // Load roadmaps on language change
  useEffect(() => {
    if (settings.selectedLanguage) {
      loadUserRoadmaps(settings.selectedLanguage);
      loadRoadmaps(settings.selectedLanguage);
    }
  }, [settings.selectedLanguage, loadUserRoadmaps, loadRoadmaps]);
  
  // Add validation effect when component mounts
  useEffect(() => {
    const validateData = async () => {
      if (!settings.selectedLanguage) return;
      
      // Try to restore from local storage first
      const restored = restoreStateFromLocalStorage();
      
      // If nothing was restored or what was restored is empty, load from API
      if (!restored || userRoadmaps.length === 0) {
        await loadUserRoadmaps(settings.selectedLanguage);
      }
      
      // Validate that if we have a currentRoadmap, it's actually in userRoadmaps
      if (currentRoadmap && !userRoadmaps.some(r => r.id === currentRoadmap.id)) {
        console.warn('Current roadmap is not in user roadmaps list, resetting...');
        setCurrentRoadmap(null);
        
        // If we have user roadmaps, select the first one
        if (userRoadmaps.length > 0) {
          try {
            await selectRoadmap(userRoadmaps[0].id);
          } catch (error) {
            console.error('Error selecting first roadmap during validation:', error);
          }
        }
      }
    };
    
    validateData();
  }, [
    settings.selectedLanguage, 
    restoreStateFromLocalStorage, 
    loadUserRoadmaps, 
    selectRoadmap, 
    userRoadmaps, 
    currentRoadmap
  ]);
  
  // Add effect to save state when it changes
  useEffect(() => {
    saveStateToLocalStorage();
  }, [userRoadmaps, currentRoadmap, saveStateToLocalStorage]);

  // Derived values from state
  const currentNodeId = currentRoadmap?.currentNodeId;
  const currentNode = nodes.find(n => n.id === currentNodeId) || null;
  const completedNodes = nodes.filter(n => n.status === 'completed').map(n => n.id);
  const availableNodes = nodes.filter(n => n.status === 'available').map(n => n.id);

  // Context provider value
  const value: RoadmapContextType = {
    isLoading,
    nodeLoading,
    roadmaps,
    userRoadmaps,
    currentRoadmap,
    nodes,
    currentNodeId,
    currentNode,
    completedNodes,
    availableNodes,
    nodeProgress,
    loadRoadmaps,
    loadUserRoadmaps,
    initializeRoadmap,
    initializeUserRoadmap,
    selectRoadmap,
    getNodeExercise,
    recordNodeCompletion,
    incrementNodeCompletion,
    markNodeAsCompleted,
  };

  return (
    <RoadmapContext.Provider value={value}>
      {children}
    </RoadmapContext.Provider>
  );
};

// Custom hook to use the roadmap context
export const useRoadmap = () => {
  const context = useContext(RoadmapContext);
  if (context === undefined) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  return context;
};
