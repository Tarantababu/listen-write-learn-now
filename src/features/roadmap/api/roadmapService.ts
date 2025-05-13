
import { supabase } from '@/integrations/supabase/client';
import { Language, LanguageLevel } from '@/types';
import { RoadmapItem, RoadmapNode, ExerciseContent, NodeCompletionResult } from '../types';

/**
 * Service to handle all roadmap-related API calls to Supabase
 */
export const roadmapService = {
  /**
   * Get all available roadmaps for a specific language
   */
  async getRoadmapsForLanguage(language: Language): Promise<RoadmapItem[]> {
    // Use the database function to get roadmaps filtered by language
    const { data, error } = await supabase
      .rpc('get_roadmaps_by_language', {
        requested_language: language
      });

    if (error) {
      console.error('Error fetching roadmaps:', error);
      throw error;
    }

    // Get all roadmap languages to populate the language field
    const { data: languagesData, error: languagesError } = await supabase
      .from('roadmap_languages')
      .select('*');

    if (languagesError) {
      console.error('Error fetching roadmap languages:', languagesError);
      throw languagesError;
    }

    // Group languages by roadmap
    const languagesByRoadmap: Record<string, Language[]> = {};
    languagesData.forEach(lang => {
      if (!languagesByRoadmap[lang.roadmap_id]) {
        languagesByRoadmap[lang.roadmap_id] = [];
      }
      languagesByRoadmap[lang.roadmap_id].push(lang.language as Language);
    });

    // Get user roadmaps to check if the user has already started any of these roadmaps
    const { data: userRoadmapsData } = await supabase
      .from('user_roadmaps')
      .select('*')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
      .eq('language', language);

    // Format the roadmaps with progress information
    return data.map(roadmap => {
      // Check if user has this roadmap
      const userRoadmap = userRoadmapsData?.find(ur => ur.roadmap_id === roadmap.id);
      const progress = 0; // We'll calculate this later based on node completion

      return {
        id: roadmap.id,
        name: roadmap.name,
        level: roadmap.level as LanguageLevel,
        description: roadmap.description,
        language: language,
        progress: progress,
        currentNodeId: userRoadmap?.current_node_id,
        createdAt: new Date(roadmap.created_at)
      };
    });
  },

  /**
   * Get all user roadmaps for a specific language
   */
  async getUserRoadmaps(language: Language): Promise<RoadmapItem[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    // Get user roadmaps for the specified language
    const { data: userRoadmaps, error } = await supabase
      .rpc('get_user_roadmaps_by_language', {
        user_id_param: userId,
        requested_language: language
      });

    if (error) {
      console.error('Error fetching user roadmaps:', error);
      throw error;
    }

    if (!userRoadmaps || userRoadmaps.length === 0) {
      return [];
    }

    // Get roadmap details
    const roadmapIds = userRoadmaps.map(ur => ur.roadmap_id);
    const { data: roadmapsData, error: roadmapsError } = await supabase
      .from('roadmaps')
      .select('*')
      .in('id', roadmapIds);

    if (roadmapsError) {
      console.error('Error fetching roadmaps:', roadmapsError);
      throw roadmapsError;
    }

    // Get progress information for calculating completion percentages
    const { data: progressData, error: progressError } = await supabase
      .from('roadmap_progress')
      .select('*')
      .eq('user_id', userId)
      .in('roadmap_id', roadmapIds);

    if (progressError) {
      console.error('Error fetching progress:', progressError);
      throw progressError;
    }

    // Get all nodes to calculate progress percentages
    const { data: nodesData, error: nodesError } = await supabase
      .from('roadmap_nodes')
      .select('*')
      .in('roadmap_id', roadmapIds)
      .eq('language', language);

    if (nodesError) {
      console.error('Error fetching nodes:', nodesError);
      throw nodesError;
    }

    return userRoadmaps.map(userRoadmap => {
      const roadmap = roadmapsData?.find(r => r.id === userRoadmap.roadmap_id);
      if (!roadmap) return null;

      // Calculate progress percentage
      const roadmapNodes = nodesData?.filter(node => node.roadmap_id === userRoadmap.roadmap_id) || [];
      const completedNodes = progressData?.filter(
        p => p.roadmap_id === userRoadmap.roadmap_id && p.completed
      ) || [];
      
      const progress = roadmapNodes.length > 0
        ? Math.round((completedNodes.length / roadmapNodes.length) * 100)
        : 0;

      return {
        id: userRoadmap.id,
        name: roadmap.name,
        level: roadmap.level as LanguageLevel,
        description: roadmap.description,
        language: userRoadmap.language as Language,
        progress: progress,
        currentNodeId: userRoadmap.current_node_id,
        createdAt: new Date(userRoadmap.created_at)
      };
    }).filter(Boolean) as RoadmapItem[];
  },

  /**
   * Initialize a new roadmap for the user
   */
  async initializeRoadmap(level: LanguageLevel, language: Language): Promise<string> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    // Find matching roadmap for the level and language
    const { data: roadmapsData, error: roadmapsError } = await supabase
      .rpc('get_roadmaps_by_language', {
        requested_language: language
      });

    if (roadmapsError) {
      console.error('Error fetching roadmaps:', roadmapsError);
      throw roadmapsError;
    }

    const matchingRoadmap = roadmapsData.find(r => r.level === level);
    if (!matchingRoadmap) {
      throw new Error(`No roadmap found for ${level} level in ${language}.`);
    }

    // Check if the user already has this roadmap
    const { data: existingRoadmap, error: existingError } = await supabase
      .from('user_roadmaps')
      .select('*')
      .eq('user_id', userId)
      .eq('roadmap_id', matchingRoadmap.id)
      .eq('language', language)
      .maybeSingle();

    if (existingError) {
      console.error('Error checking existing roadmap:', existingError);
      throw existingError;
    }

    if (existingRoadmap) {
      return existingRoadmap.id; // Return existing roadmap ID
    }

    // Create user roadmap
    const { data: userRoadmap, error: roadmapError } = await supabase
      .from('user_roadmaps')
      .insert({
        user_id: userId,
        roadmap_id: matchingRoadmap.id,
        language: language
      })
      .select()
      .single();

    if (roadmapError) {
      console.error('Error creating roadmap:', roadmapError);
      throw roadmapError;
    }

    // Get first node
    const { data: firstNodeData, error: nodeError } = await supabase
      .from('roadmap_nodes')
      .select('*')
      .eq('roadmap_id', matchingRoadmap.id)
      .eq('language', language)
      .order('position')
      .limit(1)
      .maybeSingle();

    if (nodeError && nodeError.code !== 'PGRST116') {
      console.error('Error fetching first node:', nodeError);
      throw nodeError;
    }

    if (firstNodeData) {
      // Update user roadmap with first node
      const { error: updateError } = await supabase
        .from('user_roadmaps')
        .update({ current_node_id: firstNodeData.id })
        .eq('id', userRoadmap.id);

      if (updateError) {
        console.error('Error updating roadmap with first node:', updateError);
        throw updateError;
      }
    }

    return userRoadmap.id;
  },

  /**
   * Get all nodes for a specific user roadmap
   */
  async getRoadmapNodes(userRoadmapId: string): Promise<RoadmapNode[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    // Get the user roadmap
    const { data: userRoadmap, error: userRoadmapError } = await supabase
      .from('user_roadmaps')
      .select('*')
      .eq('id', userRoadmapId)
      .single();

    if (userRoadmapError) {
      console.error('Error fetching user roadmap:', userRoadmapError);
      throw userRoadmapError;
    }

    // Get all nodes for this roadmap
    const { data: nodesData, error: nodesError } = await supabase
      .from('roadmap_nodes')
      .select('*')
      .eq('roadmap_id', userRoadmap.roadmap_id)
      .eq('language', userRoadmap.language)
      .order('position');

    if (nodesError) {
      console.error('Error fetching nodes:', nodesError);
      throw nodesError;
    }

    // Get node completion info
    const { data: progressData, error: progressError } = await supabase
      .from('roadmap_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('roadmap_id', userRoadmap.roadmap_id);

    if (progressError) {
      console.error('Error fetching progress:', progressError);
      throw progressError;
    }

    // Get detailed node progress
    const { data: nodeProgressData, error: nodeProgressError } = await supabase
      .from('roadmap_nodes_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('roadmap_id', userRoadmap.roadmap_id)
      .eq('language', userRoadmap.language);

    if (nodeProgressError) {
      console.error('Error fetching node progress:', nodeProgressError);
      throw nodeProgressError;
    }

    // Calculate completed nodes
    const completedNodeIds = progressData?.filter(p => p.completed).map(p => p.node_id) || [];

    // Format the nodes with status information
    return nodesData.map((node, index, array) => {
      const isCompleted = completedNodeIds.includes(node.id);
      const isCurrent = node.id === userRoadmap.current_node_id;
      
      // Node is available if it's the first node or the previous node is completed
      const isAvailable = index === 0 || 
        (array[index - 1] && completedNodeIds.includes(array[index - 1].id));
      
      const status = isCompleted ? 'completed' 
        : isCurrent ? 'current' 
        : isAvailable ? 'available' 
        : 'locked';

      // Get node progress count
      const nodeProgress = nodeProgressData?.find(np => np.node_id === node.id);
      const progressCount = nodeProgress?.completion_count || 0;

      return {
        id: node.id,
        roadmapId: node.roadmap_id,
        title: node.title,
        description: node.description || '',
        position: node.position,
        isBonus: node.is_bonus,
        language: node.language as Language,
        status,
        progressCount,
        isCompleted: isCompleted || (nodeProgress?.is_completed || false),
        defaultExerciseId: node.default_exercise_id
      };
    });
  },

  /**
   * Get exercise content for a roadmap node
   */
  async getNodeExerciseContent(nodeId: string): Promise<ExerciseContent | null> {
    // Get the node to find its default exercise ID
    const { data: node, error: nodeError } = await supabase
      .from('roadmap_nodes')
      .select('*')
      .eq('id', nodeId)
      .single();

    if (nodeError) {
      console.error('Error fetching node:', nodeError);
      throw nodeError;
    }

    if (!node.default_exercise_id) {
      return null;
    }

    // Get the default exercise content
    const { data: exercise, error: exerciseError } = await supabase
      .from('default_exercises')
      .select('*')
      .eq('id', node.default_exercise_id)
      .single();

    if (exerciseError) {
      console.error('Error fetching exercise:', exerciseError);
      throw exerciseError;
    }

    return {
      id: exercise.id,
      title: exercise.title,
      text: exercise.text,
      audioUrl: exercise.audio_url,
      language: exercise.language as Language
    };
  },

  /**
   * Record completion of a node with accuracy
   */
  async recordNodeCompletion(nodeId: string, accuracy: number): Promise<NodeCompletionResult> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    // Get the node info
    const { data: node, error: nodeError } = await supabase
      .from('roadmap_nodes')
      .select('roadmap_id, language')
      .eq('id', nodeId)
      .single();

    if (nodeError) {
      console.error('Error fetching node:', nodeError);
      throw nodeError;
    }

    // Call the database function to increment node completion
    const { error } = await supabase.rpc('increment_node_completion', {
      node_id_param: nodeId,
      user_id_param: userId,
      language_param: node.language,
      roadmap_id_param: node.roadmap_id
    });

    if (error) {
      console.error('Error incrementing node completion:', error);
      throw error;
    }

    // Get the updated node progress
    const { data: nodeProgress, error: progressError } = await supabase
      .from('roadmap_nodes_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('node_id', nodeId)
      .eq('language', node.language)
      .single();

    if (progressError) {
      console.error('Error fetching node progress:', progressError);
      throw progressError;
    }

    return {
      isCompleted: nodeProgress.is_completed,
      completionCount: nodeProgress.completion_count,
      accuracy
    };
  },

  /**
   * Mark a node as completed and update the user's current node
   */
  async markNodeCompleted(nodeId: string): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    // Get the node info
    const { data: node, error: nodeError } = await supabase
      .from('roadmap_nodes')
      .select('roadmap_id')
      .eq('id', nodeId)
      .single();

    if (nodeError) {
      console.error('Error fetching node:', nodeError);
      throw nodeError;
    }

    // Get the user roadmap
    const { data: userRoadmap, error: roadmapError } = await supabase
      .from('user_roadmaps')
      .select('id')
      .eq('user_id', userId)
      .eq('roadmap_id', node.roadmap_id)
      .single();

    if (roadmapError) {
      console.error('Error fetching user roadmap:', roadmapError);
      throw roadmapError;
    }

    // First, ensure there's a progress record and mark it as completed
    const { error: progressError } = await supabase
      .from('roadmap_progress')
      .upsert(
        {
          user_id: userId,
          roadmap_id: node.roadmap_id,
          node_id: nodeId,
          completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id, roadmap_id, node_id' }
      );

    if (progressError) {
      console.error('Error updating progress:', progressError);
      throw progressError;
    }

    // Find next node
    const { data: nodes, error: nodesError } = await supabase
      .from('roadmap_nodes')
      .select('id, position')
      .eq('roadmap_id', node.roadmap_id)
      .order('position');

    if (nodesError) {
      console.error('Error fetching nodes:', nodesError);
      throw nodesError;
    }

    // Find the current node and get the next one
    const currentNodeIndex = nodes.findIndex(n => n.id === nodeId);
    const nextNode = nodes[currentNodeIndex + 1];

    // Update user roadmap with next node
    if (nextNode) {
      const { error: updateError } = await supabase
        .from('user_roadmaps')
        .update({
          current_node_id: nextNode.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', userRoadmap.id);

      if (updateError) {
        console.error('Error updating user roadmap:', updateError);
        throw updateError;
      }
    }

    // Also mark the node as completed in the detailed progress table
    const { error: nodeProgressError } = await supabase
      .from('roadmap_nodes_progress')
      .upsert(
        {
          user_id: userId,
          roadmap_id: node.roadmap_id,
          node_id: nodeId,
          language: (await supabase.from('roadmap_nodes').select('language').eq('id', nodeId).single()).data!.language,
          is_completed: true,
          completion_count: 3, // Mark as fully completed
          updated_at: new Date().toISOString(),
          last_practiced_at: new Date().toISOString()
        },
        { onConflict: 'user_id, node_id, language' }
      );

    if (nodeProgressError) {
      console.error('Error updating node progress:', nodeProgressError);
      throw nodeProgressError;
    }
  }
};
