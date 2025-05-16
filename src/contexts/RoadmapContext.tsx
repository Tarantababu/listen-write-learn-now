
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
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
  
  // Refs for tracking request status and preventing duplicate calls
  const loadingRef = useRef<{[key: string]: boolean}>({});
  const requestTimeoutsRef = useRef<{[key: string]: ReturnType<typeof setTimeout>}>({});
  const abortControllersRef = useRef<{[key: string]: AbortController}>({});
  const previousLanguageRef = useRef<Language | null>(null);
  const initialLoadDoneRef = useRef<boolean>(false);
  
  // Cache for roadmap data to prevent unnecessary API calls
  const cacheRef = useRef<{
    roadmaps: {[language: string]: {data: RoadmapItem[], timestamp: number}},
    userRoadmaps: {[language: string]: {data: RoadmapItem[], timestamp: number}}
  }>({
    roadmaps: {},
    userRoadmaps: {}
  });
  
  // Cache expiration time in milliseconds (5 minutes)
  const CACHE_EXPIRATION = 5 * 60 * 1000;
  
  // Strict memoization of the current language to prevent unnecessary renders
  const currentLanguage = useMemo(() => settings.selectedLanguage, [settings.selectedLanguage]);
  
  // Function to check if cache is valid
  const isCacheValid = useCallback((type: 'roadmaps' | 'userRoadmaps', language: Language) => {
    const cache = cacheRef.current[type][language];
    if (!cache) return false;
    
    const now = Date.now();
    return cache.data.length > 0 && (now - cache.timestamp) < CACHE_EXPIRATION;
  }, []);
  
  // Function to cancel a pending request for a specific key
  const cancelPendingRequest = useCallback((key: string) => {
    // Cancel timeout
    if (requestTimeoutsRef.current[key]) {
      clearTimeout(requestTimeoutsRef.current[key]);
      delete requestTimeoutsRef.current[key];
    }
    
    // Abort fetch if in progress
    if (abortControllersRef.current[key]) {
      abortControllersRef.current[key].abort();
      delete abortControllersRef.current[key];
    }
  }, []);

  // Function to cancel all pending requests
  const cancelAllPendingRequests = useCallback(() => {
    Object.keys(requestTimeoutsRef.current).forEach(cancelPendingRequest);
  }, [cancelPendingRequest]);

  // Debounced function to make API requests with built-in abort controller
  const debouncedRequest = useCallback(<T,>(key: string, fn: (signal: AbortSignal) => Promise<T>, delay = 500): Promise<T> => {
    return new Promise((resolve, reject) => {
      // If this exact request is already in progress, skip
      if (loadingRef.current[key]) {
        console.log(`Already loading ${key}, skipping duplicate request`);
        return;
      }
      
      // Cancel any pending request for this key
      cancelPendingRequest(key);
      
      // Set new timeout with delay
      requestTimeoutsRef.current[key] = setTimeout(async () => {
        try {
          // Set loading state and create abort controller
          loadingRef.current[key] = true;
          abortControllersRef.current[key] = new AbortController();
          
          console.log(`Executing debounced request for ${key}`);
          const result = await fn(abortControllersRef.current[key].signal);
          
          resolve(result);
        } catch (error: any) {
          console.error(`Error in debounced request for ${key}:`, error);
          
          // Only reject for non-abort errors
          if (error.name !== 'AbortError') {
            reject(error);
          }
        } finally {
          delete requestTimeoutsRef.current[key];
          delete abortControllersRef.current[key];
          loadingRef.current[key] = false;
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
      const mockGetRoadmapNodes = async (id: string, signal: AbortSignal) => {
        return [] as RoadmapNode[]; // Return empty array for now
      };
      
      const roadmapNodes = await debouncedRequest(cacheKey, (signal) => mockGetRoadmapNodes(userRoadmapId, signal));
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

  // Load language-specific roadmaps with debouncing, caching and abort control
  const loadRoadmaps = useCallback(async (language: Language): Promise<RoadmapItem[]> => {
    // Skip if the language is empty or invalid
    if (!language) {
      console.log('Skipping loadRoadmaps: Invalid language');
      return roadmaps;
    }
    
    // Check cache first
    if (isCacheValid('roadmaps', language)) {
      console.log(`Using cached roadmaps for ${language}`);
      return cacheRef.current.roadmaps[language].data;
    }
    
    const cacheKey = `loadRoadmaps_${language}`;
    
    try {
      setIsLoading(true);
      
      const roadmapsData = await debouncedRequest(cacheKey, async (signal) => {
        console.log('Loading roadmaps for language:', language);
        return await getRoadmapsForLanguage(language);
      });
      
      console.log('Roadmaps loaded:', roadmapsData);
      
      // Update cache
      cacheRef.current.roadmaps[language] = {
        data: roadmapsData,
        timestamp: Date.now()
      };
      
      setRoadmaps(roadmapsData);
      return roadmapsData;
    } catch (error) {
      console.error('Error loading roadmaps:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [debouncedRequest, isCacheValid]);

  // Load user-specific roadmaps with debouncing, caching and loading state management
  const loadUserRoadmaps = useCallback(async (language: Language): Promise<RoadmapItem[]> => {
    // Skip if the language is empty or invalid
    if (!language) {
      console.log('Skipping loadUserRoadmaps: Invalid language');
      return userRoadmaps;
    }
    
    // Check cache first
    if (isCacheValid('userRoadmaps', language)) {
      console.log(`Using cached user roadmaps for ${language}`);
      return cacheRef.current.userRoadmaps[language].data;
    }
    
    const cacheKey = `loadUserRoadmaps_${language}`;
    
    try {
      setIsLoading(true);
      
      const userRoadmapsData = await debouncedRequest(cacheKey, async (signal) => {
        console.log('Loading user roadmaps for language:', language);
        return await getUserRoadmaps(language);
      });
      
      console.log('User roadmaps loaded:', userRoadmapsData);
      
      // Update cache
      cacheRef.current.userRoadmaps[language] = {
        data: userRoadmapsData,
        timestamp: Date.now()
      };
      
      setUserRoadmaps(userRoadmapsData);
      
      return userRoadmapsData;
    } catch (error) {
      console.error('Error loading user roadmaps:', error);
      setError('Failed to load user roadmaps');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [debouncedRequest, isCacheValid]);

  // Initialize a user roadmap
  const initializeUserRoadmap = useCallback(async (level: LanguageLevel, language: Language) => {
    setIsLoading(true);
    try {
      // TODO: Implement the actual initialization logic here
      // For now, let's just simulate a successful initialization
      console.log(`Initializing roadmap for level ${level} and language ${language}`);
      
      // After successful initialization, reload user roadmaps
      await loadUserRoadmaps(language);
      
      // Invalidate cache
      if (cacheRef.current.userRoadmaps[language]) {
        cacheRef.current.userRoadmaps[language].timestamp = 0;
      }
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
  const selectRoadmap = useCallback(async (roadmapId: string): Promise<RoadmapNode[]> => {
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

  // Effect to load roadmaps when language changes, with proper safeguards
  useEffect(() => {
    // Use strict equality check to prevent unnecessary API calls
    const isLanguageChanged = previousLanguageRef.current !== currentLanguage;
    
    if (isLanguageChanged || !initialLoadDoneRef.current) {
      console.log('Language changed or initial load:', {
        previous: previousLanguageRef.current, 
        current: currentLanguage, 
        isInitialLoad: !initialLoadDoneRef.current
      });
      
      // Cancel all pending requests to avoid race conditions
      cancelAllPendingRequests();
      
      // Update language ref to prevent future unnecessary calls
      previousLanguageRef.current = currentLanguage;
      
      // Mark initial load as done to prevent unnecessary loads on mount
      initialLoadDoneRef.current = true;
      
      if (currentLanguage) {
        // Use staggered timeouts to prevent concurrent requests
        const loadDataWithDelay = async () => {
          try {
            await loadRoadmaps(currentLanguage);
            await loadUserRoadmaps(currentLanguage);
          } catch (error) {
            console.error('Error loading roadmap data:', error);
          }
        };
        
        // Use a single timeout for the whole operation
        const timeoutId = setTimeout(loadDataWithDelay, 100);
        
        return () => {
          clearTimeout(timeoutId);
        };
      }
    }
  }, [currentLanguage, loadRoadmaps, loadUserRoadmaps, cancelAllPendingRequests]);

  // Cleanup all pending timeouts when unmounting
  useEffect(() => {
    return () => {
      cancelAllPendingRequests();
    };
  }, [cancelAllPendingRequests]);

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
