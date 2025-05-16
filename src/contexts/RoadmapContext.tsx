
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  RoadmapItem,
  RoadmapNode,
} from '@/features/roadmap/types';
import {
  getRoadmapsForLanguage,
  getUserRoadmaps,
  getNodeExerciseContent,
  recordNodeCompletion,
} from '@/features/roadmap/api/roadmapService';
import { Language, LanguageLevel } from '@/types';
import { useUserSettingsContext } from './UserSettingsContext';
import { NodeProgressDetails, NodeCompletionResult } from '@/features/roadmap/types/service-types';

interface RoadmapContextProps {
  roadmaps: RoadmapItem[];
  userRoadmaps: RoadmapItem[];
  currentRoadmap: RoadmapItem | null;
  currentNodeId: string | null;
  nodes: RoadmapNode[];
  nodeProgress: NodeProgressDetails[];
  isLoading: boolean;
  nodeLoading?: boolean;
  error: string | null;
  loadRoadmaps: (language: Language) => Promise<RoadmapItem[]>;
  loadUserRoadmaps: (language: Language) => Promise<RoadmapItem[]>;
  initializeUserRoadmap: (level: LanguageLevel, language: Language) => Promise<void>;
  loadRoadmapNodes: (userRoadmapId: string) => Promise<void>;
  getNodeContent: (nodeId: string) => Promise<any>;
  recordCompletion: (nodeId: string, accuracy: number) => Promise<NodeCompletionResult>;
  markNodeCompleted: (nodeId: string) => Promise<void>;
  completedNodes: string[];
  availableNodes?: string[];
  // Add aliases for the methods used in components
  markNodeAsCompleted?: (nodeId: string) => Promise<void>;
  getNodeExercise?: (nodeId: string) => Promise<any>;
  incrementNodeCompletion?: (nodeId: string, accuracy: number) => Promise<NodeCompletionResult>;
  selectRoadmap?: (roadmapId: string) => Promise<RoadmapNode[]>;
}

const defaultContext: RoadmapContextProps = {
  roadmaps: [],
  userRoadmaps: [],
  currentRoadmap: null,
  currentNodeId: null,
  nodes: [],
  nodeProgress: [],
  isLoading: false,
  error: null,
  loadRoadmaps: async () => [],
  loadUserRoadmaps: async () => [],
  initializeUserRoadmap: async () => {},
  loadRoadmapNodes: async () => {},
  getNodeContent: async () => {},
  recordCompletion: async () => ({ completionCount: 0, isCompleted: false, lastPracticedAt: new Date() }),
  markNodeCompleted: async () => {},
  completedNodes: [],
};

export const RoadmapContext = createContext<RoadmapContextProps>(defaultContext);

export const RoadmapProvider = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useUserSettingsContext();
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [userRoadmaps, setUserRoadmaps] = useState<RoadmapItem[]>([]);
  const [currentRoadmap, setCurrentRoadmap] = useState<RoadmapItem | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [nodeProgress, setNodeProgress] = useState<NodeProgressDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nodeLoading, setNodeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [availableNodes, setAvailableNodes] = useState<string[]>([]);
  
  // Add refs to track request status and debounce API calls
  const loadingRef = useRef<{[key: string]: boolean}>({});
  const requestTimeoutRef = useRef<{[key: string]: ReturnType<typeof setTimeout>}>({});
  const previousLanguageRef = useRef<Language | null>(null);

  // Memoize the language to prevent unnecessary renders
  const currentLanguage = settings.selectedLanguage;
  
  // Function to cancel a pending timeout for a specific key
  const cancelPendingRequest = useCallback((key: string) => {
    if (requestTimeoutRef.current[key]) {
      clearTimeout(requestTimeoutRef.current[key]);
      delete requestTimeoutRef.current[key];
    }
  }, []);

  // Debounced function to make API requests
  const debouncedRequest = useCallback(<T,>(key: string, fn: () => Promise<T>, delay = 300): Promise<T> => {
    return new Promise((resolve, reject) => {
      // Cancel any pending request for this key
      cancelPendingRequest(key);
      
      // Set new timeout
      requestTimeoutRef.current[key] = setTimeout(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          delete requestTimeoutRef.current[key];
        }
      }, delay);
    });
  }, [cancelPendingRequest]);

  // Define loadRoadmapNodes first since it's used in loadUserRoadmaps
  const loadRoadmapNodes = useCallback(async (userRoadmapId: string) => {
    const cacheKey = `loadRoadmapNodes_${userRoadmapId}`;
    
    if (loadingRef.current[cacheKey]) {
      console.log(`Already loading nodes for roadmap ${userRoadmapId}, skipping duplicate request`);
      return;
    }
    
    try {
      loadingRef.current[cacheKey] = true;
      
      // TODO: Implement the actual logic to fetch roadmap nodes
      // For now, let's just simulate fetching some nodes
      console.log(`Loading roadmap nodes for roadmap ID ${userRoadmapId}`);
      
      // Mock function for getting roadmap nodes - this will be replaced with a real implementation
      const mockGetRoadmapNodes = async (id: string) => {
        return [] as RoadmapNode[]; // Return empty array for now
      };
      
      const roadmapNodes = await debouncedRequest(cacheKey, () => mockGetRoadmapNodes(userRoadmapId));
      setNodes(roadmapNodes);
      
      // Mock completed and available nodes
      setCompletedNodes([]);
      setAvailableNodes([]);
      
      // Load node progress
      const initialProgress = roadmapNodes.map(node => ({
        nodeId: node.id,
        completionCount: 0,
        isCompleted: false,
        lastPracticedAt: undefined,
        accuracyHistory: [],
      }));
      setNodeProgress(initialProgress);
    } catch (error) {
      console.error('Error loading roadmap nodes:', error);
      setError('Failed to load roadmap nodes');
    } finally {
      loadingRef.current[cacheKey] = false;
    }
  }, [debouncedRequest]);

  // Load language-specific roadmaps with debouncing and caching
  const loadRoadmaps = useCallback(async (language: Language) => {
    // Skip if already loading this language
    const cacheKey = `loadRoadmaps_${language}`;
    
    if (loadingRef.current[cacheKey]) {
      console.log(`Already loading roadmaps for ${language}, skipping duplicate request`);
      return roadmaps;
    }
    
    try {
      loadingRef.current[cacheKey] = true;
      setIsLoading(true);
      console.log('Loading roadmaps for language:', language);
      
      const roadmapsData = await debouncedRequest(cacheKey, () => getRoadmapsForLanguage(language));
      console.log('Roadmaps loaded:', roadmapsData);
      setRoadmaps(roadmapsData);
      return roadmapsData;
    } catch (error) {
      console.error('Error loading roadmaps:', error);
      return [];
    } finally {
      setIsLoading(false);
      loadingRef.current[cacheKey] = false;
    }
  }, [debouncedRequest]);

  // Load user-specific roadmaps with debouncing and loading state management
  const loadUserRoadmaps = useCallback(async (language: Language): Promise<RoadmapItem[]> => {
    // Skip if already loading this language
    const cacheKey = `loadUserRoadmaps_${language}`;
    
    if (loadingRef.current[cacheKey]) {
      console.log(`Already loading user roadmaps for ${language}, skipping duplicate request`);
      return userRoadmaps;
    }
    
    try {
      loadingRef.current[cacheKey] = true;
      setIsLoading(true);
      
      const userRoadmapsData = await debouncedRequest(cacheKey, () => getUserRoadmaps(language));
      setUserRoadmaps(userRoadmapsData);

      // Only set the current roadmap if we don't already have one
      // or if the current language has changed
      if ((!currentRoadmap && userRoadmapsData.length > 0) || 
          (currentRoadmap && currentRoadmap.language !== language)) {
        setCurrentRoadmap(userRoadmapsData[0] || null);
        setCurrentNodeId(userRoadmapsData[0]?.currentNodeId || null);
        if (userRoadmapsData[0]) {
          await loadRoadmapNodes(userRoadmapsData[0].id);
        }
      } else if (userRoadmapsData.length === 0) {
        // Clear state when we have no roadmaps for this language
        setCurrentRoadmap(null);
        setCurrentNodeId(null);
        setNodes([]);
      }
      
      return userRoadmapsData;
    } catch (error) {
      console.error('Error loading user roadmaps:', error);
      setError('Failed to load user roadmaps');
      return [];
    } finally {
      setIsLoading(false);
      loadingRef.current[cacheKey] = false;
    }
  }, [currentRoadmap, loadRoadmapNodes]);

  // Initialize a user roadmap
  const initializeUserRoadmap = useCallback(async (level: LanguageLevel, language: Language) => {
    setIsLoading(true);
    try {
      // TODO: Implement the actual initialization logic here
      // For now, let's just simulate a successful initialization
      console.log(`Initializing roadmap for level ${level} and language ${language}`);
      
      // After successful initialization, reload user roadmaps
      await loadUserRoadmaps(language);
    } catch (error) {
      console.error('Error initializing user roadmap:', error);
      setError('Failed to initialize user roadmap');
    } finally {
      setIsLoading(false);
    }
  }, [loadUserRoadmaps]);

  const getNodeContent = useCallback(async (nodeId: string) => {
    setNodeLoading(true);
    try {
      const content = await getNodeExerciseContent(nodeId);
      return content;
    } catch (error) {
      console.error('Error fetching node content:', error);
      setError('Failed to load node content');
      return null;
    } finally {
      setNodeLoading(false);
    }
  }, []);

  const recordCompletion = useCallback(async (nodeId: string, accuracy: number): Promise<NodeCompletionResult> => {
    try {
      const result = await recordNodeCompletion(nodeId, accuracy);
      
      setNodeProgress(prevProgress => {
        return prevProgress.map(item => {
          if (item.nodeId === nodeId) {
            return {
              ...item,
              completionCount: result.completionCount,
              isCompleted: result.isCompleted,
              lastPracticedAt: result.lastPracticedAt,
            };
          }
          return item;
        });
      });
      
      return result;
    } catch (error) {
      console.error('Error recording node completion:', error);
      setError('Failed to record node completion');
      return { completionCount: 0, isCompleted: false, lastPracticedAt: new Date() };
    }
  }, []);

  const markNodeCompleted = useCallback(async (nodeId: string) => {
    // TODO: Implement the logic to mark a node as completed
    console.log(`Marking node ${nodeId} as completed`);
    
    // Mock implementation: add the node to completedNodes
    setCompletedNodes(prev => [...prev, nodeId]);
  }, []);
  
  // Implementation for selectRoadmap method with loading state management
  const selectRoadmap = useCallback(async (roadmapId: string) => {
    const cacheKey = `selectRoadmap_${roadmapId}`;
    
    if (loadingRef.current[cacheKey]) {
      console.log(`Already selecting roadmap ${roadmapId}, skipping duplicate request`);
      return nodes;
    }
    
    try {
      loadingRef.current[cacheKey] = true;
      setIsLoading(true);
      console.log(`Selecting roadmap ${roadmapId}`);
      
      // Find the selected roadmap
      const selectedRoadmap = userRoadmaps.find(r => r.id === roadmapId);
      if (selectedRoadmap) {
        setCurrentRoadmap(selectedRoadmap);
        setCurrentNodeId(selectedRoadmap.currentNodeId || null);
        await loadRoadmapNodes(selectedRoadmap.id);
        return nodes;
      }
      return [];
    } catch (error) {
      console.error('Error selecting roadmap:', error);
      setError('Failed to select roadmap');
      return [];
    } finally {
      setIsLoading(false);
      loadingRef.current[cacheKey] = false;
    }
  }, [userRoadmaps, loadRoadmapNodes, nodes]);

  // Ensure roadmaps are loaded only when the language actually changes
  useEffect(() => {
    // Skip the effect if the language hasn't changed
    if (previousLanguageRef.current === currentLanguage) {
      return;
    }
    
    if (currentLanguage) {
      console.log('Language changed from', previousLanguageRef.current, 'to', currentLanguage);
      
      // Update the ref for next comparison
      previousLanguageRef.current = currentLanguage;
      
      // Load roadmaps for the new language
      loadRoadmaps(currentLanguage);
      loadUserRoadmaps(currentLanguage);
    }
  }, [currentLanguage, loadRoadmaps, loadUserRoadmaps]);

  // Cleanup all pending timeouts when unmounting
  useEffect(() => {
    return () => {
      Object.keys(requestTimeoutRef.current).forEach(key => {
        clearTimeout(requestTimeoutRef.current[key]);
      });
    };
  }, []);

  return (
    <RoadmapContext.Provider
      value={{
        roadmaps,
        userRoadmaps,
        currentRoadmap,
        currentNodeId,
        nodes,
        nodeProgress,
        isLoading,
        nodeLoading,
        error,
        loadRoadmaps,
        loadUserRoadmaps,
        initializeUserRoadmap,
        loadRoadmapNodes,
        getNodeContent,
        recordCompletion,
        markNodeCompleted,
        completedNodes,
        availableNodes,
        // Add aliases for method names used in components
        markNodeAsCompleted: markNodeCompleted,
        getNodeExercise: getNodeContent,
        incrementNodeCompletion: recordCompletion,
        selectRoadmap,
      }}
    >
      {children}
    </RoadmapContext.Provider>
  );
};
