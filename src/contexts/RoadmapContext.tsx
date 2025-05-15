import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Roadmap, RoadmapNode, UserRoadmap, RoadmapProgress, LanguageLevel, Language, RoadmapNodeProgress, RoadmapContextType } from '@/types';

export const RoadmapContext = createContext<RoadmapContextType>({} as RoadmapContextType);

export const RoadmapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [userRoadmaps, setUserRoadmaps] = useState<UserRoadmap[]>([]); // Store all user roadmaps
  const [selectedRoadmap, setSelectedRoadmap] = useState<UserRoadmap | null>(null);
  const [roadmapNodes, setRoadmapNodes] = useState<RoadmapNode[]>([]);
  const [currentNode, setCurrentNode] = useState<RoadmapNode | null>(null);
  const [progress, setProgress] = useState<RoadmapProgress[]>([]);
  const [nodeProgress, setNodeProgress] = useState<RoadmapNodeProgress[]>([]); // For detailed node progress
  const [loading, setLoading] = useState<boolean>(true);
  const [nodeLoading, setNodeLoading] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(settings.selectedLanguage);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Memoized function to fetch roadmaps
  const fetchRoadmaps = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Use our custom function to get roadmaps filtered by the current language
      const { data: roadmapData, error: roadmapError } = await supabase
        .rpc('get_roadmaps_by_language', {
          requested_language: settings.selectedLanguage
        });

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
        level: roadmap.level as LanguageLevel, // Explicit cast to LanguageLevel
        description: roadmap.description,
        createdAt: new Date(roadmap.created_at),
        updatedAt: new Date(roadmap.updated_at),
        languages: languagesByRoadmap[roadmap.id] || []
      }));

      setRoadmaps(formattedRoadmaps);
      
      // Load all user roadmaps after fetching available roadmaps
      await loadUserRoadmaps();
    } catch (error) {
      console.error("Error fetching roadmaps:", error);
      toast({
        variant: "destructive",
        title: "Failed to load learning roadmaps",
        description: "There was an error loading your roadmaps."
      });
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  }, [user, settings.selectedLanguage]);

  // Effect to fetch roadmaps only when language changes
  useEffect(() => {
    if (settings.selectedLanguage !== selectedLanguage) {
      setSelectedLanguage(settings.selectedLanguage);
      fetchRoadmaps();
    }
  }, [settings.selectedLanguage, selectedLanguage, fetchRoadmaps]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchRoadmaps();
    }
  }, [user]);

  // Load all user roadmaps
  const loadUserRoadmaps = useCallback(async (language?: Language): Promise<UserRoadmap[]> => {
    if (!user) return [];

    try {
      // Use our custom function to get user roadmaps filtered by the current language
      const { data: userRoadmapData, error: userRoadmapError } = await supabase
        .rpc('get_user_roadmaps_by_language', {
          user_id_param: user.id,
          requested_language: language || settings.selectedLanguage
        });

      if (userRoadmapError) throw userRoadmapError;

      if (!userRoadmapData || userRoadmapData.length === 0) {
        setUserRoadmaps([]);
        setSelectedRoadmap(null);
        return [];
      }

      // Format user roadmaps
      const formattedUserRoadmaps: UserRoadmap[] = userRoadmapData.map(roadmap => ({
        id: roadmap.id,
        userId: roadmap.user_id,
        roadmapId: roadmap.roadmap_id,
        language: roadmap.language as Language,
        currentNodeId: roadmap.current_node_id,
        createdAt: new Date(roadmap.created_at),
        updatedAt: new Date(roadmap.updated_at),
      }));

      setUserRoadmaps(formattedUserRoadmaps);
      
      // If no roadmap is selected but user has roadmaps, select the first one
      if (!selectedRoadmap && formattedUserRoadmaps.length > 0) {
        await loadUserRoadmap(formattedUserRoadmaps[0].id);
      }
      
      return formattedUserRoadmaps;
    } catch (error) {
      console.error("Error loading user roadmaps:", error);
      toast({
        variant: "destructive",
        title: "Failed to load your learning paths",
        description: "There was an error loading your learning paths."
      });
      return [];
    }
  }, [user, settings.selectedLanguage, selectedRoadmap]);

  // Select a specific roadmap
  const selectRoadmap = async (roadmapId: string) => {
    const roadmap = userRoadmaps.find(r => r.id === roadmapId);
    if (roadmap) {
      await loadUserRoadmap(roadmap.id);
    } else {
      toast({
        variant: "destructive",
        title: "Roadmap not found",
        description: "The selected roadmap could not be found."
      });
    }
  };

  // Load user's selected roadmap
  const loadUserRoadmap = async (userRoadmapId?: string) => {
    if (!user) return;

    setLoading(true);
    try {
      // Get user's roadmap
      let query = supabase
        .from('user_roadmaps')
        .select('*');
        
      if (userRoadmapId) {
        query = query.eq('id', userRoadmapId);
      } else {
        // If no specific roadmap ID is provided, try to get one for the current language
        query = query
          .eq('user_id', user.id)
          .eq('language', settings.selectedLanguage);
      }
      
      const { data: userRoadmapData, error: userRoadmapError } = await query.single();

      if (userRoadmapError) {
        if (userRoadmapError.code !== 'PGRST116') { // Record not found
          throw userRoadmapError;
        }
        setSelectedRoadmap(null);
        setRoadmapNodes([]);
        setCurrentNode(null);
        setProgress([]);
        setNodeProgress([]); // Clear node progress
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
        .eq('language', userRoadmap.language)
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

      // Load detailed node progress
      const { data: nodeProgressData, error: nodeProgressError } = await supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('roadmap_id', userRoadmap.roadmapId)
        .eq('language', userRoadmap.language);

      if (nodeProgressError) throw nodeProgressError;

      const formattedNodeProgress: RoadmapNodeProgress[] = (nodeProgressData || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        roadmapId: item.roadmap_id,
        nodeId: item.node_id,
        language: item.language as Language,
        completionCount: item.completion_count,
        isCompleted: item.is_completed,
        lastPracticedAt: item.last_practiced_at ? new Date(item.last_practiced_at) : undefined,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }));

      setNodeProgress(formattedNodeProgress);
    } catch (error) {
      console.error("Error loading user roadmap:", error);
      toast({
        variant: "destructive",
        title: "Failed to load your learning path",
        description: "There was an error loading your roadmap details."
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize user roadmap
  const initializeUserRoadmap = async (level: LanguageLevel, language: Language) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to start a learning path."
      });
      return;
    }

    // Find matching roadmap for the level and language
    const matchingRoadmap = roadmaps.find(r => 
      r.level === level && r.languages && r.languages.includes(language)
    );

    if (!matchingRoadmap) {
      toast({
        variant: "destructive",
        title: "Roadmap not available",
        description: `No roadmap found for ${level} level in ${language}.`
      });
      return;
    }

    // Check if the user already has this roadmap
    const existingRoadmap = userRoadmaps.find(
      r => r.roadmapId === matchingRoadmap.id && r.language === language
    );

    if (existingRoadmap) {
      toast({
        title: "Roadmap already exists",
        description: `You already have the ${matchingRoadmap.name} roadmap in ${language}.`
      });
      await selectRoadmap(existingRoadmap.id);
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
        toast({
          variant: "destructive", // Change from "warning" to "destructive"
          title: "Roadmap content missing",
          description: "This roadmap doesn't have any content yet. Please check back later."
        });
        await loadUserRoadmaps(); // Reload with empty nodes
        return;
      }

      // Update user roadmap with first node
      const { error: updateError } = await supabase
        .from('user_roadmaps')
        .update({ current_node_id: firstNodeData.id })
        .eq('id', userRoadmap.id);

      if (updateError) throw updateError;

      toast({
        title: "Learning journey started!",
        description: "Your learning journey has begun!"
      });
      
      // Refresh the user roadmap data
      await loadUserRoadmaps();
      await loadUserRoadmap(userRoadmap.id);

    } catch (error) {
      console.error("Error initializing roadmap:", error);
      toast({
        variant: "destructive",
        title: "Initialization failed",
        description: "Failed to start learning journey. Please try again later."
      });
    }
  };

  // Get node exercise
  const getNodeExercise = async (nodeId: string) => {
    const node = roadmapNodes.find(n => n.id === nodeId);
    if (!node || !node.defaultExerciseId) {
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('default_exercises')
        .select('*')
        .eq('id', node.defaultExerciseId)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching node exercise:", error);
      toast({
        variant: "destructive", 
        title: "Failed to load exercise",
        description: "Could not load the exercise content. Please try again."
      });
      return null;
    }
  };

  // Increment node completion count when dictation is completed with good accuracy
  const incrementNodeCompletion = async (nodeId: string, accuracy: number) => {
    if (!user || !selectedRoadmap) return;

    // Only increment if accuracy is good (95% or better)
    if (accuracy < 95) return;

    setNodeLoading(true);
    try {
      console.log(`Incrementing completion count for node ${nodeId} with accuracy ${accuracy}%`);

      // Call the database function to increment node completion count
      const { error } = await supabase
        .rpc('increment_node_completion', {
          node_id_param: nodeId,
          user_id_param: user.id,
          language_param: selectedRoadmap.language,
          roadmap_id_param: selectedRoadmap.roadmapId
        });

      if (error) {
        console.error("Error incrementing node completion:", error);
        throw error;
      }

      // Reload roadmap data to get updated progress
      await loadUserRoadmap(selectedRoadmap.id);
      
      // Get updated node progress to check if it's now complete
      const { data: progressData } = await supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('node_id', nodeId)
        .eq('language', selectedRoadmap.language)
        .single();

      if (progressData && progressData.is_completed) {
        toast({
          title: "Node completed!",
          description: `You've completed this lesson! Completion count: ${progressData.completion_count}/3`
        });
        
        // If this is now completed, check if we need to move to the next node
        await completeNode(nodeId);
      } else if (progressData) {
        toast({
          title: "Progress saved!",
          description: `Practice progress saved. Completion count: ${progressData.completion_count}/3`
        });
      }
      
    } catch (error) {
      console.error("Error updating node progress:", error);
      toast({
        variant: "destructive",
        title: "Failed to save progress",
        description: "Failed to save your practice progress"
      });
    } finally {
      setNodeLoading(false);
    }
  };

  // Mark node as completed
  const markNodeAsCompleted = async (nodeId: string): Promise<void> => {
    await completeNode(nodeId);
  };

  // Complete a node
  const completeNode = async (nodeId: string): Promise<void> => {
    if (!user || !selectedRoadmap) return;

    setNodeLoading(true);
    try {
      console.log("Attempting to complete node:", nodeId, "for roadmap:", selectedRoadmap.id);
      
      // Check if already completed
      const existingProgress = progress.find(p => p.nodeId === nodeId);
      
      if (existingProgress && existingProgress.completed) {
        // Already completed, nothing to do
        console.log("Node already completed, no update needed");
        return;
      }

      if (existingProgress) {
        // Update existing progress
        console.log("Updating existing progress record:", existingProgress.id);
        const { error } = await supabase
          .from('roadmap_progress')
          .update({ 
            completed: true,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id);

        if (error) {
          console.error("Error updating progress:", error);
          throw error;
        }
        console.log("Progress updated successfully");
      } else {
        // Create new progress record
        console.log("Creating new progress record for node:", nodeId);
        const { data, error } = await supabase
          .from('roadmap_progress')
          .insert({
            user_id: user.id,
            roadmap_id: selectedRoadmap.roadmapId,
            node_id: nodeId,
            completed: true,
            completed_at: new Date().toISOString()
          })
          .select();

        if (error) {
          console.error("Error creating progress:", error);
          throw error;
        }
        console.log("Progress created successfully:", data);
      }

      // Find next node
      const currentNodeIndex = roadmapNodes.findIndex(n => n.id === nodeId);
      const nextNode = roadmapNodes[currentNodeIndex + 1] || null;

      // Update current node if there is a next node
      if (nextNode) {
        console.log("Moving to next node:", nextNode.id);
        const { error } = await supabase
          .from('user_roadmaps')
          .update({ 
            current_node_id: nextNode.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedRoadmap.id);

        if (error) {
          console.error("Error updating current node:", error);
          throw error;
        }
        console.log("User roadmap updated with new current node");
      }

      // Reload roadmap data
      await loadUserRoadmap(selectedRoadmap.id);
      
      toast({
        title: nextNode ? "Lesson completed!" : "Path completed!",
        description: nextNode 
          ? "Well done! Moving to the next lesson." 
          : "Congratulations! You've completed all lessons in this path."
      });
      
    } catch (error) {
      console.error("Error completing node:", error);
      toast({
        variant: "destructive",
        title: "Failed to mark as complete",
        description: "Failed to mark lesson as complete"
      });
    } finally {
      setNodeLoading(false);
    }
  };

  // Reset progress
  const resetProgress = async (): Promise<void> => {
    if (!user || !selectedRoadmap) return;

    try {
      // Delete progress records
      const { error: progressError } = await supabase
        .from('roadmap_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('roadmap_id', selectedRoadmap.roadmapId);

      if (progressError) throw progressError;

      // Delete detailed node progress records
      const { error: nodeProgressError } = await supabase
        .from('roadmap_nodes_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('roadmap_id', selectedRoadmap.roadmapId)
        .eq('language', selectedRoadmap.language);

      if (nodeProgressError) throw nodeProgressError;

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
      await loadUserRoadmap(selectedRoadmap.id);
      toast({
        title: "Progress reset",
        description: "Progress reset successfully"
      });
      
    } catch (error) {
      console.error("Error resetting progress:", error);
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: "Failed to reset progress"
      });
    }
  };

  // Calculate completed nodes ids
  const completedNodes = progress.filter(p => p.completed).map(p => p.nodeId);
  
  // Calculate available nodes
  const availableNodes = roadmapNodes
    .filter((node, index, array) => {
      // First node is always available
      if (index === 0) return true;
      
      // Previous node is completed, this one is available
      const prevNode = array[index - 1];
      return prevNode && completedNodes.includes(prevNode.id);
    })
    .map(node => node.id);

  return (
    <RoadmapContext.Provider value={{
      roadmaps,
      userRoadmaps,
      selectedRoadmap,
      currentNode,
      roadmapNodes,
      progress,
      nodeProgress,
      loading,
      nodeLoading,
      // Alias properties to match what other components are using
      currentRoadmap: selectedRoadmap,
      nodes: roadmapNodes,
      currentNodeId: selectedRoadmap?.currentNodeId,
      completedNodes,
      availableNodes,
      isLoading,
      initializeUserRoadmap,
      loadUserRoadmap,
      loadUserRoadmaps,
      completeNode,
      resetProgress,
      getNodeExercise,
      markNodeAsCompleted,
      incrementNodeCompletion,
      selectRoadmap
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
