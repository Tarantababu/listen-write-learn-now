import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useUserSettingsContext } from './UserSettingsContext';
import { Roadmap, RoadmapNode, UserRoadmap, RoadmapProgress, LanguageLevel, Language, Exercise } from '@/types';
import { toast } from 'sonner';

interface RoadmapContextType {
  roadmaps: Roadmap[];
  currentRoadmap: Roadmap | null;
  currentNodeId: string | null;
  nodes: RoadmapNode[];
  nodeProgress: Record<string, boolean>;
  loading: boolean;
  error: string | null;
  completedNodes: string[];
  availableNodes: string[];
  initializeUserRoadmap: (languageLevel: LanguageLevel, language: Language) => Promise<void>;
  selectRoadmap: (roadmapId: string) => Promise<void>;
  getNodeExercise: (nodeId: string) => Promise<Exercise | null>;
  markNodeAsCompleted: (nodeId: string) => Promise<void>;
  getCurrentNodeExercise: () => Promise<Exercise | null>;
}

const RoadmapContext = createContext<RoadmapContextType | undefined>(undefined);

export const useRoadmap = () => {
  const context = useContext(RoadmapContext);
  if (!context) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  return context;
};

interface RoadmapProviderProps {
  children: ReactNode;
}

export const RoadmapProvider: React.FC<RoadmapProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [currentRoadmap, setCurrentRoadmap] = useState<Roadmap | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [nodeProgress, setNodeProgress] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [availableNodes, setAvailableNodes] = useState<string[]>([]);
  const [userRoadmap, setUserRoadmap] = useState<UserRoadmap | null>(null);

  // Fetch all roadmaps
  useEffect(() => {
    if (!user) return;

    const fetchRoadmaps = async () => {
      try {
        const { data, error } = await supabase
          .from('roadmaps')
          .select('*')
          .order('level', { ascending: true });

        if (error) throw error;

        const formattedRoadmaps: Roadmap[] = data.map(roadmap => ({
          id: roadmap.id,
          name: roadmap.name,
          level: roadmap.level as LanguageLevel,
          description: roadmap.description,
          createdAt: new Date(roadmap.created_at),
          updatedAt: new Date(roadmap.updated_at),
          createdBy: roadmap.created_by
        }));

        setRoadmaps(formattedRoadmaps);
      } catch (err: any) {
        console.error('Error fetching roadmaps:', err);
        setError(err.message);
      }
    };

    fetchRoadmaps();
  }, [user]);

  // Fetch user's current roadmap for the selected language
  useEffect(() => {
    if (!user || !settings.selectedLanguage) return;

    const fetchUserRoadmap = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_roadmaps')
          .select('*, roadmaps(*)')
          .eq('user_id', user.id)
          .eq('language', settings.selectedLanguage)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is code for no rows returned
          throw error;
        }

        if (data) {
          const roadmap: Roadmap = {
            id: data.roadmaps.id,
            name: data.roadmaps.name,
            level: data.roadmaps.level as LanguageLevel,
            description: data.roadmaps.description,
            createdAt: new Date(data.roadmaps.created_at),
            updatedAt: new Date(data.roadmaps.updated_at),
            createdBy: data.roadmaps.created_by
          };

          const userRoadmapObj: UserRoadmap = {
            id: data.id,
            userId: data.user_id,
            roadmapId: data.roadmap_id,
            language: data.language as Language,
            currentNodeId: data.current_node_id,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };

          setCurrentRoadmap(roadmap);
          setCurrentNodeId(data.current_node_id);
          setUserRoadmap(userRoadmapObj);
          await fetchNodesForRoadmap(data.roadmap_id);
          await fetchProgressForRoadmap(data.roadmap_id);
        } else {
          setCurrentRoadmap(null);
          setCurrentNodeId(null);
          setUserRoadmap(null);
        }
      } catch (err: any) {
        console.error('Error fetching user roadmap:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoadmap();
  }, [user, settings.selectedLanguage]);

  // Fetch nodes for a roadmap
  const fetchNodesForRoadmap = async (roadmapId: string) => {
    try {
      const { data, error } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', roadmapId)
        .order('position', { ascending: true });

      if (error) throw error;

      const formattedNodes: RoadmapNode[] = data.map(node => ({
        id: node.id,
        roadmapId: node.roadmap_id,
        defaultExerciseId: node.default_exercise_id,
        title: node.title,
        description: node.description,
        position: node.position,
        isBonus: node.is_bonus,
        createdAt: new Date(node.created_at),
        updatedAt: new Date(node.updated_at)
      }));

      setNodes(formattedNodes);
    } catch (err: any) {
      console.error('Error fetching roadmap nodes:', err);
      setError(err.message);
    }
  };

  // Fetch progress for a roadmap
  const fetchProgressForRoadmap = async (roadmapId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('roadmap_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('roadmap_id', roadmapId);

      if (error) throw error;

      const progress: Record<string, boolean> = {};
      const completed: string[] = [];
      
      data.forEach(item => {
        progress[item.node_id] = item.completed;
        if (item.completed) {
          completed.push(item.node_id);
        }
      });

      setNodeProgress(progress);
      setCompletedNodes(completed);

      // Calculate available nodes based on completed nodes and sequential order
      if (nodes.length > 0) {
        const available: string[] = [];
        const sortedNodes = [...nodes].sort((a, b) => a.position - b.position);
        
        // First node is always available
        available.push(sortedNodes[0].id);
        
        // Each subsequent node is available if the previous one is completed
        for (let i = 1; i < sortedNodes.length; i++) {
          const previousNode = sortedNodes[i - 1];
          if (progress[previousNode.id]) {
            available.push(sortedNodes[i].id);
          }
        }
        
        setAvailableNodes(available);
      }
    } catch (err: any) {
      console.error('Error fetching roadmap progress:', err);
      setError(err.message);
    }
  };

  // Initialize user roadmap with selected language level
  const initializeUserRoadmap = async (languageLevel: LanguageLevel, language: Language) => {
    if (!user) return;

    try {
      // Find roadmap for selected level
      const roadmap = roadmaps.find(r => r.level === languageLevel);
      if (!roadmap) {
        throw new Error(`No roadmap found for level ${languageLevel}`);
      }

      // Get first node
      const { data: nodeData, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', roadmap.id)
        .order('position', { ascending: true })
        .limit(1)
        .single();

      if (nodeError) throw nodeError;

      // Create user roadmap
      const { data, error } = await supabase
        .from('user_roadmaps')
        .insert([
          {
            user_id: user.id,
            roadmap_id: roadmap.id,
            language,
            current_node_id: nodeData.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Initialize progress for the first node
      await supabase
        .from('roadmap_progress')
        .insert([
          {
            user_id: user.id,
            roadmap_id: roadmap.id,
            node_id: nodeData.id,
            completed: false
          }
        ]);

      // Update state
      const userRoadmapObj: UserRoadmap = {
        id: data.id,
        userId: data.user_id,
        roadmapId: data.roadmap_id,
        language: data.language as Language,
        currentNodeId: data.current_node_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      setCurrentRoadmap(roadmap);
      setCurrentNodeId(data.current_node_id);
      setUserRoadmap(userRoadmapObj);
      await fetchNodesForRoadmap(roadmap.id);
      await fetchProgressForRoadmap(roadmap.id);

      toast.success('Roadmap initialized successfully', {
        description: `You've been assigned to ${roadmap.name} (${roadmap.level})`
      });
    } catch (err: any) {
      console.error('Error initializing user roadmap:', err);
      setError(err.message);
      toast.error('Failed to initialize roadmap', {
        description: err.message
      });
    }
  };

  // Select a roadmap
  const selectRoadmap = async (roadmapId: string) => {
    if (!user) return;

    try {
      // Find roadmap in list
      const roadmap = roadmaps.find(r => r.id === roadmapId);
      if (!roadmap) {
        throw new Error(`Roadmap with ID ${roadmapId} not found`);
      }

      // Get first node
      const { data: nodeData, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', roadmapId)
        .order('position', { ascending: true })
        .limit(1)
        .single();

      if (nodeError) throw nodeError;

      // Update or create user roadmap
      const { data, error } = await supabase
        .from('user_roadmaps')
        .upsert({
          user_id: user.id,
          roadmap_id: roadmapId,
          language: settings.selectedLanguage,
          current_node_id: nodeData.id
        })
        .select()
        .single();

      if (error) throw error;

      // Update state
      setCurrentRoadmap(roadmap);
      setCurrentNodeId(data.current_node_id);
      await fetchNodesForRoadmap(roadmapId);
      await fetchProgressForRoadmap(roadmapId);

      toast.success('Roadmap selected successfully', {
        description: `You're now on ${roadmap.name} (${roadmap.level})`
      });
    } catch (err: any) {
      console.error('Error selecting roadmap:', err);
      setError(err.message);
      toast.error('Failed to select roadmap', {
        description: err.message
      });
    }
  };

  // Get exercise for a node
  const getNodeExercise = async (nodeId: string): Promise<Exercise | null> => {
    try {
      // Find the node
      const node = nodes.find(n => n.id === nodeId);
      if (!node || !node.defaultExerciseId) {
        throw new Error(`Node ${nodeId} not found or has no exercise`);
      }

      // Get the default exercise
      const { data: defaultExerciseData, error: defaultExerciseError } = await supabase
        .from('default_exercises')
        .select('*')
        .eq('id', node.defaultExerciseId)
        .single();

      if (defaultExerciseError) throw defaultExerciseError;

      // See if the user already has a copy of this exercise
      const { data: existingExercise, error: existingExerciseError } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', user?.id)
        .eq('default_exercise_id', node.defaultExerciseId)
        .eq('language', settings.selectedLanguage)
        .single();

      // If there's no error, the user already has the exercise
      if (!existingExerciseError && existingExercise) {
        return {
          id: existingExercise.id,
          title: existingExercise.title,
          text: existingExercise.text,
          language: existingExercise.language as Language,
          tags: existingExercise.tags || [],
          audioUrl: existingExercise.audio_url,
          directoryId: existingExercise.directory_id,
          createdAt: new Date(existingExercise.created_at),
          completionCount: existingExercise.completion_count || 0,
          isCompleted: existingExercise.is_completed || false,
          archived: existingExercise.archived || false,
          default_exercise_id: existingExercise.default_exercise_id
        };
      }

      // Otherwise, create a new exercise for the user based on the default
      const { data: newExercise, error: newExerciseError } = await supabase
        .from('exercises')
        .insert([
          {
            title: defaultExerciseData.title,
            text: defaultExerciseData.text,
            language: settings.selectedLanguage,
            tags: defaultExerciseData.tags || [],
            audio_url: defaultExerciseData.audio_url,
            user_id: user?.id,
            default_exercise_id: defaultExerciseData.id
          }
        ])
        .select()
        .single();

      if (newExerciseError) throw newExerciseError;

      return {
        id: newExercise.id,
        title: newExercise.title,
        text: newExercise.text,
        language: newExercise.language as Language,
        tags: newExercise.tags || [],
        audioUrl: newExercise.audio_url,
        directoryId: newExercise.directory_id,
        createdAt: new Date(newExercise.created_at),
        completionCount: newExercise.completion_count || 0,
        isCompleted: newExercise.is_completed || false,
        archived: newExercise.archived || false,
        default_exercise_id: newExercise.default_exercise_id
      };
    } catch (err: any) {
      console.error('Error getting node exercise:', err);
      setError(err.message);
      return null;
    }
  };

  // Mark node as completed
  const markNodeAsCompleted = async (nodeId: string) => {
    if (!user || !currentRoadmap) return;

    try {
      // Update progress for the node
      await supabase
        .from('roadmap_progress')
        .upsert({
          user_id: user.id,
          roadmap_id: currentRoadmap.id,
          node_id: nodeId,
          completed: true,
          completed_at: new Date().toISOString()
        });

      // Find the next node
      const nextNode = nodes
        .filter(n => n.position > (nodes.find(node => node.id === nodeId)?.position || 0))
        .sort((a, b) => a.position - b.position)[0];

      if (nextNode) {
        // Update current node
        await supabase
          .from('user_roadmaps')
          .update({ current_node_id: nextNode.id })
          .eq('user_id', user.id)
          .eq('roadmap_id', currentRoadmap.id)
          .eq('language', settings.selectedLanguage);

        // Initialize progress for the next node
        await supabase
          .from('roadmap_progress')
          .upsert({
            user_id: user.id,
            roadmap_id: currentRoadmap.id,
            node_id: nextNode.id,
            completed: false
          });

        setCurrentNodeId(nextNode.id);

        // Update progress state
        const newProgress = { ...nodeProgress };
        newProgress[nodeId] = true;
        setNodeProgress(newProgress);
        
        setCompletedNodes([...completedNodes, nodeId]);
        setAvailableNodes([...availableNodes, nextNode.id]);

        toast.success('Node completed!', {
          description: `Moving to next node: ${nextNode.title}`
        });
      } else {
        // If there's no next node, the roadmap is complete
        const newProgress = { ...nodeProgress };
        newProgress[nodeId] = true;
        setNodeProgress(newProgress);
        
        setCompletedNodes([...completedNodes, nodeId]);

        toast.success('Congratulations!', {
          description: 'You have completed the roadmap!'
        });
      }
    } catch (err: any) {
      console.error('Error marking node as completed:', err);
      setError(err.message);
      toast.error('Failed to mark node as completed', {
        description: err.message
      });
    }
  };

  // Get the current node's exercise
  const getCurrentNodeExercise = async (): Promise<Exercise | null> => {
    if (!currentNodeId) return null;
    return getNodeExercise(currentNodeId);
  };

  const value: RoadmapContextType = {
    roadmaps,
    currentRoadmap,
    currentNodeId,
    nodes,
    nodeProgress,
    loading,
    error,
    completedNodes,
    availableNodes,
    initializeUserRoadmap,
    selectRoadmap,
    getNodeExercise,
    markNodeAsCompleted,
    getCurrentNodeExercise
  };

  return (
    <RoadmapContext.Provider value={value}>
      {children}
    </RoadmapContext.Provider>
  );
};

export default RoadmapContext;
