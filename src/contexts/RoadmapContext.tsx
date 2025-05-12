
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useUserSettingsContext } from './UserSettingsContext';
import { Roadmap, RoadmapNode, UserRoadmap, RoadmapProgress, LanguageLevel, Language } from '@/types';

interface RoadmapContextType {
  roadmaps: Roadmap[];
  selectedRoadmap: UserRoadmap | null;
  currentNode: RoadmapNode | null;
  roadmapNodes: RoadmapNode[];
  progress: RoadmapProgress[];
  loading: boolean;
  nodeLoading: boolean;
  initializeUserRoadmap: (level: LanguageLevel, language: Language) => Promise<void>;
  loadUserRoadmap: () => Promise<void>;
  completeNode: (nodeId: string) => Promise<void>;
  resetProgress: () => Promise<void>;
}

const RoadmapContext = createContext<RoadmapContextType | undefined>(undefined);

export const RoadmapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<UserRoadmap | null>(null);
  const [roadmapNodes, setRoadmapNodes] = useState<RoadmapNode[]>([]);
  const [currentNode, setCurrentNode] = useState<RoadmapNode | null>(null);
  const [progress, setProgress] = useState<RoadmapProgress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [nodeLoading, setNodeLoading] = useState<boolean>(false);

  // Fetch all roadmaps
  useEffect(() => {
    const fetchRoadmaps = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // First get all roadmaps
        const { data: roadmapData, error: roadmapError } = await supabase
          .from('roadmaps')
          .select('*')
          .order('level');

        if (roadmapError) throw roadmapError;

        // Get all roadmap languages
        const { data: languagesData, error: languagesError } = await supabase
          .from('roadmap_languages')
          .select('*');

        if (languagesError) throw languagesError;

        // Group languages by roadmap
        const languagesByRoadmap: Record<string, Language[]> = {};
        languagesData.forEach(lang => {
          if (!languagesByRoadmap[lang.roadmap_id]) {
            languagesByRoadmap[lang.roadmap_id] = [];
          }
          languagesByRoadmap[lang.roadmap_id].push(lang.language as Language);
        });

        // Combine roadmaps with their languages
        const formattedRoadmaps: Roadmap[] = roadmapData.map(roadmap => ({
          id: roadmap.id,
          name: roadmap.name,
          level: roadmap.level,
          description: roadmap.description,
          createdAt: new Date(roadmap.created_at),
          updatedAt: new Date(roadmap.updated_at),
          languages: languagesByRoadmap[roadmap.id] || []
        }));

        setRoadmaps(formattedRoadmaps);
      } catch (error) {
        console.error("Error fetching roadmaps:", error);
        toast.error("Failed to load learning roadmaps");
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmaps();
  }, [user]);

  // Load user's selected roadmap
  const loadUserRoadmap = async () => {
    if (!user || !settings.selectedLanguage) return;

    setLoading(true);
    try {
      // Get user's roadmap
      const { data: userRoadmapData, error: userRoadmapError } = await supabase
        .from('user_roadmaps')
        .select('*')
        .eq('user_id', user.id)
        .eq('language', settings.selectedLanguage)
        .single();

      if (userRoadmapError) {
        if (userRoadmapError.code !== 'PGRST116') { // Record not found
          throw userRoadmapError;
        }
        setSelectedRoadmap(null);
        setRoadmapNodes([]);
        setCurrentNode(null);
        setProgress([]);
        setLoading(false);
        return;
      }

      // Format user roadmap
      const userRoadmap: UserRoadmap = {
        id: userRoadmapData.id,
        userId: userRoadmapData.user_id,
        roadmapId: userRoadmapData.roadmap_id,
        language: userRoadmapData.language as Language,
        currentNodeId: userRoadmapData.current_node_id,
        createdAt: new Date(userRoadmapData.created_at),
        updatedAt: new Date(userRoadmapData.updated_at),
      };

      setSelectedRoadmap(userRoadmap);

      // Load roadmap nodes
      const { data: nodesData, error: nodesError } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', userRoadmap.roadmapId)
        .eq('language', settings.selectedLanguage)
        .order('position');

      if (nodesError) throw nodesError;

      const formattedNodes: RoadmapNode[] = nodesData.map(node => ({
        id: node.id,
        roadmapId: node.roadmap_id,
        title: node.title,
        description: node.description || '',
        position: node.position,
        isBonus: node.is_bonus,
        defaultExerciseId: node.default_exercise_id,
        language: node.language as Language | undefined,
        createdAt: new Date(node.created_at),
        updatedAt: new Date(node.updated_at),
      }));

      setRoadmapNodes(formattedNodes);

      // Find current node
      if (userRoadmap.currentNodeId) {
        const current = formattedNodes.find(node => node.id === userRoadmap.currentNodeId);
        setCurrentNode(current || null);
      } else if (formattedNodes.length > 0) {
        setCurrentNode(formattedNodes[0]);
      }

      // Load progress
      const { data: progressData, error: progressError } = await supabase
        .from('roadmap_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('roadmap_id', userRoadmap.roadmapId);

      if (progressError) throw progressError;

      const formattedProgress: RoadmapProgress[] = progressData.map(item => ({
        id: item.id,
        userId: item.user_id,
        roadmapId: item.roadmap_id,
        nodeId: item.node_id,
        completed: item.completed,
        completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }));

      setProgress(formattedProgress);
    } catch (error) {
      console.error("Error loading user roadmap:", error);
      toast.error("Failed to load your learning path");
    } finally {
      setLoading(false);
    }
  };

  // Initialize user roadmap
  const initializeUserRoadmap = async (level: LanguageLevel, language: Language) => {
    if (!user) {
      toast.error("You must be logged in to start a learning path");
      return;
    }

    // Find matching roadmap for the level and language
    const matchingRoadmap = roadmaps.find(r => 
      r.level === level && r.languages && r.languages.includes(language)
    );

    if (!matchingRoadmap) {
      toast.error(`No roadmap found for ${level} level in ${language}`);
      return;
    }

    try {
      // Create user roadmap
      const { data: userRoadmap, error: roadmapError } = await supabase
        .from('user_roadmaps')
        .insert({
          user_id: user.id,
          roadmap_id: matchingRoadmap.id,
          language: language
        })
        .select()
        .single();

      if (roadmapError) throw roadmapError;

      // Get first node
      const { data: firstNodeData, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', matchingRoadmap.id)
        .eq('language', language)
        .order('position')
        .limit(1)
        .single();

      if (nodeError) {
        if (nodeError.code !== 'PGRST116') { // Not found
          throw nodeError;
        }
        // No nodes for this roadmap and language
        toast.warning("This roadmap doesn't have any content yet. Please check back later.");
        await loadUserRoadmap(); // Reload with empty nodes
        return;
      }

      // Update user roadmap with first node
      const { error: updateError } = await supabase
        .from('user_roadmaps')
        .update({ current_node_id: firstNodeData.id })
        .eq('id', userRoadmap.id);

      if (updateError) throw updateError;

      toast.success("Your learning journey has begun!");
      await loadUserRoadmap();

    } catch (error) {
      console.error("Error initializing roadmap:", error);
      toast.error("Failed to start learning journey");
    }
  };

  // Complete a node
  const completeNode = async (nodeId: string) => {
    if (!user || !selectedRoadmap) return;

    setNodeLoading(true);
    try {
      // Check if already completed
      const existingProgress = progress.find(p => p.nodeId === nodeId);
      
      if (existingProgress && existingProgress.completed) {
        // Already completed, nothing to do
        return;
      }

      if (existingProgress) {
        // Update existing progress
        const { error } = await supabase
          .from('roadmap_progress')
          .update({ 
            completed: true,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id);

        if (error) throw error;
      } else {
        // Create new progress record
        const { error } = await supabase
          .from('roadmap_progress')
          .insert({
            user_id: user.id,
            roadmap_id: selectedRoadmap.roadmapId,
            node_id: nodeId,
            completed: true,
            completed_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      // Find next node
      const currentNodeIndex = roadmapNodes.findIndex(n => n.id === nodeId);
      const nextNode = roadmapNodes[currentNodeIndex + 1] || null;

      // Update current node if there is a next node
      if (nextNode) {
        const { error } = await supabase
          .from('user_roadmaps')
          .update({ 
            current_node_id: nextNode.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedRoadmap.id);

        if (error) throw error;
      }

      // Reload roadmap data
      await loadUserRoadmap();
      
      toast.success(nextNode 
        ? "Well done! Moving to the next lesson." 
        : "Congratulations! You've completed all lessons in this path.");
      
    } catch (error) {
      console.error("Error completing node:", error);
      toast.error("Failed to mark lesson as complete");
    } finally {
      setNodeLoading(false);
    }
  };

  // Reset progress
  const resetProgress = async () => {
    if (!user || !selectedRoadmap) return;

    try {
      // Delete progress records
      const { error: progressError } = await supabase
        .from('roadmap_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('roadmap_id', selectedRoadmap.roadmapId);

      if (progressError) throw progressError;

      // Find first node
      const firstNode = roadmapNodes.length > 0 ? roadmapNodes[0] : null;
      
      // Update user roadmap to point to first node
      const { error: roadmapError } = await supabase
        .from('user_roadmaps')
        .update({ 
          current_node_id: firstNode?.id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRoadmap.id);

      if (roadmapError) throw roadmapError;

      // Reload roadmap data
      await loadUserRoadmap();
      toast.success("Progress reset successfully");
      
    } catch (error) {
      console.error("Error resetting progress:", error);
      toast.error("Failed to reset progress");
    }
  };

  return (
    <RoadmapContext.Provider value={{
      roadmaps,
      selectedRoadmap,
      currentNode,
      roadmapNodes,
      progress,
      loading,
      nodeLoading,
      initializeUserRoadmap,
      loadUserRoadmap,
      completeNode,
      resetProgress
    }}>
      {children}
    </RoadmapContext.Provider>
  );
};

export const useRoadmap = () => {
  const context = useContext(RoadmapContext);
  if (context === undefined) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  return context;
};
