
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Language } from '@/types';

export interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  position: number;
  isBonus: boolean;
  language: string;
  roadmapId?: string; // Add this field to match the data structure
}

export interface RoadmapContextType {
  currentRoadmap: RoadmapNode[] | null;
  nodeProgress: any[];
  completedNodes: string[];
  currentLanguage: Language;
  setCurrentLanguage: (language: Language) => void;
  fetchRoadmap: () => Promise<void>;
  fetchNodeProgress: () => Promise<void>;
  fetchCompletedNodes: () => Promise<void>;
  nodeLoading: boolean;
  getNodeExercise: (nodeId: string) => Promise<any>;
  markNodeAsCompleted: (nodeId: string) => Promise<void>;
  incrementNodeCompletion: (nodeId: string, accuracy: number) => Promise<{
    isCompleted: boolean;
    nextNodeId?: string;
  }>;
  // Add these properties to ensure compatibility with the unified type
  isLoading?: boolean;
  loading?: boolean;
  hasError?: boolean;
  roadmaps?: any[];
  userRoadmaps?: any[];
  nodes?: RoadmapNode[];
  availableNodes?: string[];
  currentNodeId?: string;
  currentNode?: RoadmapNode | null;
  initializeRoadmap?: (level: any, language: Language) => Promise<string>;
  initializeUserRoadmap?: (level: any, language: Language) => Promise<string>;
  loadRoadmaps?: (language: Language) => Promise<void>;
  loadUserRoadmaps?: (language: Language) => Promise<any[]>;
  selectRoadmap?: (roadmapId: string) => Promise<RoadmapNode[]>;
  recordNodeCompletion?: (nodeId: string, accuracy: number) => Promise<any>;
}

interface RoadmapProviderProps {
  children: React.ReactNode;
}

export const RoadmapContext = createContext<RoadmapContextType | undefined>(
  undefined
);

export const RoadmapProvider: React.FC<RoadmapProviderProps> = ({ 
  children 
}) => {
  const [currentRoadmap, setCurrentRoadmap] = useState<RoadmapNode[] | null>(null);
  const [nodeProgress, setNodeProgress] = useState<any[]>([]);
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [nodeLoading, setNodeLoading] = useState<boolean>(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('english');
  const { session, user } = useAuth();

  // Fetch roadmap nodes
  const fetchRoadmap = async () => {
    try {
      const { data, error } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .order('position', { ascending: true });

      if (error) {
        console.error("Error fetching roadmap:", error);
        return;
      }

      // Transform the data to match RoadmapNode type
      const transformedData: RoadmapNode[] = data.map(node => ({
        id: node.id,
        title: node.title,
        description: node.description || '',
        position: node.position,
        isBonus: node.is_bonus || false,
        language: node.language,
        roadmapId: node.roadmap_id,
      }));

      setCurrentRoadmap(transformedData);
    } catch (error) {
      console.error("Unexpected error fetching roadmap:", error);
    }
  };

  // Fetch node progress for the current user
  const fetchNodeProgress = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error("Error fetching node progress:", error);
        return;
      }

      setNodeProgress(data);
    } catch (error) {
      console.error("Unexpected error fetching node progress:", error);
    }
  }, [user]);

  // Fetch IDs of completed nodes for the current user
  const fetchCompletedNodes = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('roadmap_progress')
        .select('node_id')
        .eq('user_id', user.id)
        .eq('completed', true);

      if (error) {
        console.error("Error fetching completed nodes:", error);
        return;
      }

      const completedNodeIds = data.map(item => item.node_id);
      setCompletedNodes(completedNodeIds);
    } catch (error) {
      console.error("Unexpected error fetching completed nodes:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchRoadmap();
    fetchNodeProgress();
    fetchCompletedNodes();
  }, [session, fetchNodeProgress, fetchCompletedNodes]);

  // Get exercise content for a specific node
  const getNodeExercise = async (nodeId: string) => {
    try {
      setNodeLoading(true);
      
      // First, check if node has a default exercise attached
      const { data: nodeData, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('default_exercise_id')
        .eq('id', nodeId)
        .maybeSingle();

      if (nodeError) throw nodeError;
      
      if (nodeData?.default_exercise_id) {
        const { data: exerciseData, error: exerciseError } = await supabase
          .from('default_exercises')
          .select('*')
          .eq('id', nodeData.default_exercise_id)
          .maybeSingle();

        if (exerciseError) throw exerciseError;
        
        if (exerciseData) {
          // Check if there's a reading analysis for this exercise
          const { data: analysisData } = await supabase
            .from('reading_analyses')
            .select('id')
            .eq('exercise_id', `roadmap-${nodeId}`)
            .maybeSingle();
          
          return {
            title: exerciseData.title,
            text: exerciseData.text,
            language: exerciseData.language,
            audioUrl: exerciseData.audio_url,
            readingAnalysisId: analysisData?.id || null,
          };
        }
      }
      
      // If no default exercise is found, return basic content based on node
      return {
        title: "Practice Exercise",
        text: "Sample text for practice. This node doesn't have specific exercise content.",
        language: "english",
        audioUrl: null
      };
    } catch (error) {
      console.error('Error fetching node exercise:', error);
      throw error;
    } finally {
      setNodeLoading(false);
    }
  };

  // Mark a node as completed
  const markNodeAsCompleted = async (nodeId: string) => {
    if (!user) return;

    try {
      const { data: roadmapData, error: roadmapError } = await supabase
        .from('roadmap_nodes')
        .select('roadmap_id')
        .eq('id', nodeId)
        .single();

      if (roadmapError) throw roadmapError;

      const { error: progressError } = await supabase
        .from('roadmap_progress')
        .upsert({
          user_id: user.id,
          roadmap_id: roadmapData.roadmap_id,
          node_id: nodeId,
          completed: true,
          completed_at: new Date().toISOString(),
        });

      if (progressError) throw progressError;

      // Refresh completed nodes
      fetchCompletedNodes();
    } catch (error) {
      console.error('Error marking node as completed:', error);
      throw error;
    }
  };

  // Function to increment node completion count when user gets >= 95% accuracy
  const incrementNodeCompletion = async (nodeId: string, accuracy: number) => {
    if (accuracy < 95) {
      return { isCompleted: false };
    }

    try {
      const { data: roadmapData, error: roadmapError } = await supabase
        .from('roadmap_nodes')
        .select('roadmap_id')
        .eq('id', nodeId)
        .single();

      if (roadmapError) throw roadmapError;

      // Check if there's existing progress for this node
      const { data: existingProgress, error: progressError } = await supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('node_id', nodeId)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (progressError) throw progressError;

      // Update or create progress record
      if (existingProgress) {
        // If completion_count is already 3, nothing more to do
        if (existingProgress.completion_count >= 3) {
          return { 
            isCompleted: true,
            nextNodeId: existingProgress.completion_count >= 3 ? await getNextNodeId(nodeId) : undefined
          };
        }

        const newCompletionCount = existingProgress.completion_count + 1;
        const isNewlyCompleted = newCompletionCount >= 3;

        // Update the progress record
        const { error: updateError } = await supabase
          .from('roadmap_nodes_progress')
          .update({
            completion_count: newCompletionCount,
            is_completed: isNewlyCompleted,
            last_practiced_at: new Date().toISOString(),
          })
          .eq('id', existingProgress.id);

        if (updateError) throw updateError;

        // If newly completed, also update roadmap_progress
        if (isNewlyCompleted) {
          const { error: markCompleteError } = await supabase
            .from('roadmap_progress')
            .update({
              completed: true,
              completed_at: new Date().toISOString(),
            })
            .eq('node_id', nodeId)
            .eq('user_id', user?.id);

          if (markCompleteError) throw markCompleteError;
          
          // Refresh completed nodes
          fetchCompletedNodes();
        }

        return { 
          isCompleted: isNewlyCompleted,
          nextNodeId: isNewlyCompleted ? await getNextNodeId(nodeId) : undefined
        };

      } else {
        // Create new progress record with completion_count = 1
        const isCompleted = 1 >= 3; // Will be false
        
        const { error: insertError } = await supabase
          .from('roadmap_nodes_progress')
          .insert({
            user_id: user?.id,
            roadmap_id: roadmapData.roadmap_id,
            node_id: nodeId,
            completion_count: 1,
            is_completed: isCompleted,
            language: currentLanguage,
            last_practiced_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;

        // Force refresh of node progress data
        await fetchNodeProgress();

        return { 
          isCompleted: false,
          nextNodeId: undefined
        };
      }
    } catch (error) {
      console.error('Error updating node completion:', error);
      throw error;
    }
  };

  // Helper function to get next node ID
  const getNextNodeId = async (currentNodeId: string) => {
    try {
      // Get current node's position and roadmap ID
      const { data: currentNode, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('position, roadmap_id')
        .eq('id', currentNodeId)
        .single();

      if (nodeError) throw nodeError;

      // Find the next node based on position
      const { data: nextNodes, error: nextNodeError } = await supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', currentNode.roadmap_id)
        .gt('position', currentNode.position)
        .order('position', { ascending: true })
        .limit(1);

      if (nextNodeError) throw nextNodeError;

      return nextNodes && nextNodes.length > 0 ? nextNodes[0].id : undefined;
    } catch (error) {
      console.error('Error finding next node:', error);
      return undefined;
    }
  };

  const value: RoadmapContextType = {
    currentRoadmap,
    nodeProgress,
    completedNodes,
    currentLanguage,
    setCurrentLanguage,
    fetchRoadmap,
    fetchNodeProgress,
    fetchCompletedNodes,
    nodeLoading,
    getNodeExercise,
    markNodeAsCompleted,
    incrementNodeCompletion,
  };

  return (
    <RoadmapContext.Provider value={value}>
      {children}
    </RoadmapContext.Provider>
  );
};
