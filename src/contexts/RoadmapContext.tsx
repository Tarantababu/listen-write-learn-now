import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  RoadmapItem,
  RoadmapNode,
  NodeProgressDetails,
} from '@/features/roadmap/types';
import {
  getRoadmapsForLanguage,
  getUserRoadmaps,
  getNodeExerciseContent,
  recordNodeCompletion,
} from '@/features/roadmap/api/roadmapService';
import { Language, LanguageLevel } from '@/types';
import { useUserSettingsContext } from './UserSettingsContext';

interface RoadmapContextProps {
  roadmaps: RoadmapItem[];
  userRoadmaps: RoadmapItem[];
  currentRoadmap: RoadmapItem | null;
  currentNodeId: string | null;
  nodes: RoadmapNode[];
  nodeProgress: NodeProgressDetails[];
  isLoading: boolean;
  error: string | null;
  loadRoadmaps: (language: Language) => Promise<RoadmapItem[]>;
  loadUserRoadmaps: (language: Language) => Promise<void>;
  initializeUserRoadmap: (level: LanguageLevel, language: Language) => Promise<void>;
  loadRoadmapNodes: (userRoadmapId: string) => Promise<void>;
  getNodeContent: (nodeId: string) => Promise<any>;
  recordCompletion: (nodeId: string, accuracy: number) => Promise<void>;
  markNodeCompleted: (nodeId: string) => Promise<void>;
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
  loadUserRoadmaps: async () => {},
  initializeUserRoadmap: async () => {},
  loadRoadmapNodes: async () => {},
  getNodeContent: async () => {},
  recordCompletion: async () => {},
  markNodeCompleted: async () => {},
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
  const [error, setError] = useState<string | null>(null);

  // Load language-specific roadmaps
  const loadRoadmaps = useCallback(async (language: Language) => {
    try {
      setIsLoading(true);
      console.log('Loading roadmaps for language:', language);
      const roadmapsData = await getRoadmapsForLanguage(language);
      console.log('Roadmaps loaded:', roadmapsData);
      setRoadmaps(roadmapsData);
      return roadmapsData;
    } catch (error) {
      console.error('Error loading roadmaps:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load user-specific roadmaps
  const loadUserRoadmaps = useCallback(async (language: Language) => {
    setIsLoading(true);
    try {
      const userRoadmapsData = await getUserRoadmaps(language);
      setUserRoadmaps(userRoadmapsData);

      // Set the current roadmap to the first one if available
      if (userRoadmapsData.length > 0) {
        setCurrentRoadmap(userRoadmapsData[0]);
        setCurrentNodeId(userRoadmapsData[0].currentNodeId || null);
        await loadRoadmapNodes(userRoadmapsData[0].id);
      } else {
        setCurrentRoadmap(null);
        setCurrentNodeId(null);
        setNodes([]);
      }
    } catch (error) {
      console.error('Error loading user roadmaps:', error);
      setError('Failed to load user roadmaps');
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  // Load roadmap nodes
  const loadRoadmapNodes = useCallback(async (userRoadmapId: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement the actual logic to fetch roadmap nodes
      // For now, let's just simulate fetching some nodes
      console.log(`Loading roadmap nodes for roadmap ID ${userRoadmapId}`);
      
      const roadmapNodes = await getRoadmapNodes(userRoadmapId);
      setNodes(roadmapNodes);
      
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
      setIsLoading(false);
    }
  }, []);

  const getNodeContent = useCallback(async (nodeId: string) => {
    setIsLoading(true);
    try {
      const content = await getNodeExerciseContent(nodeId);
      return content;
    } catch (error) {
      console.error('Error fetching node content:', error);
      setError('Failed to load node content');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const recordCompletion = useCallback(async (nodeId: string, accuracy: number) => {
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
    } catch (error) {
      console.error('Error recording node completion:', error);
      setError('Failed to record node completion');
    }
  }, []);

  const markNodeCompleted = useCallback(async (nodeId: string) => {
    // TODO: Implement the logic to mark a node as completed
    console.log(`Marking node ${nodeId} as completed`);
  }, []);

  // Ensure roadmaps are loaded whenever the selected language changes
  useEffect(() => {
    if (settings.selectedLanguage) {
      console.log('Language changed, loading roadmaps for:', settings.selectedLanguage);
      loadRoadmaps(settings.selectedLanguage);
      loadUserRoadmaps(settings.selectedLanguage);
    }
  }, [settings.selectedLanguage, loadRoadmaps, loadUserRoadmaps]);

  const completedNodes = nodes.filter(node => 
    nodeProgress.find(np => np.nodeId === node.id)?.isCompleted
  ).map(node => node.id);

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
        error,
        loadRoadmaps,
        loadUserRoadmaps,
        initializeUserRoadmap,
        loadRoadmapNodes,
        getNodeContent,
        recordCompletion,
        markNodeCompleted,
        completedNodes
      }}
    >
      {children}
    </RoadmapContext.Provider>
  );
};
