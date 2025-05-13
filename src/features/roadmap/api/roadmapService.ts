
import { supabase } from '@/integrations/supabase/client';
import { Language, LanguageLevel } from '@/types';
import { RoadmapItem, RoadmapNode, ExerciseContent, NodeCompletionResult } from '../types';

/**
 * Service for interacting with roadmap-related API endpoints
 */
export const roadmapService = {
  /**
   * Get all roadmaps available for a specific language
   */
  async getRoadmapsForLanguage(language: Language): Promise<RoadmapItem[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_roadmaps_by_language', { requested_language: language });
      
      if (error) throw error;
      
      // Transform the data to match our frontend types
      return data.map(item => ({
        id: item.id,
        name: item.name,
        level: item.level as LanguageLevel,
        description: item.description || undefined,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        createdBy: item.created_by || undefined,
      }));
    } catch (error) {
      console.error('Error fetching roadmaps:', error);
      throw error;
    }
  },
  
  /**
   * Get user's roadmaps for a specific language
   */
  async getUserRoadmaps(language: Language): Promise<RoadmapItem[]> {
    try {
      // Get the user's roadmaps from the database
      const { data: userRoadmapsData, error: userRoadmapsError } = await supabase
        .rpc('get_user_roadmaps_by_language', { 
          user_id_param: (await supabase.auth.getUser()).data.user?.id, 
          requested_language: language 
        });
        
      if (userRoadmapsError) throw userRoadmapsError;
      
      if (!userRoadmapsData.length) return [];
      
      // Get the base roadmap information for each user roadmap
      const roadmapIds = userRoadmapsData.map(ur => ur.roadmap_id);
      
      const { data: roadmapsData, error: roadmapsError } = await supabase
        .from('roadmaps')
        .select('*')
        .in('id', roadmapIds);
      
      if (roadmapsError) throw roadmapsError;
      
      // Merge the user roadmap data with the base roadmap data
      return userRoadmapsData.map(userRoadmap => {
        const baseRoadmap = roadmapsData.find(r => r.id === userRoadmap.roadmap_id);
        
        return {
          id: userRoadmap.id,
          roadmapId: userRoadmap.roadmap_id,
          name: baseRoadmap?.name || 'Untitled Roadmap',
          level: (baseRoadmap?.level as LanguageLevel) || 'A1',
          description: baseRoadmap?.description,
          language: userRoadmap.language as Language,
          currentNodeId: userRoadmap.current_node_id || undefined,
          createdAt: new Date(userRoadmap.created_at),
          updatedAt: new Date(userRoadmap.updated_at),
          createdBy: baseRoadmap?.created_by,
        };
      });
    } catch (error) {
      console.error('Error fetching user roadmaps:', error);
      throw error;
    }
  },
  
  /**
   * Initialize a new roadmap for the user based on a template
   */
  async initializeRoadmap(level: LanguageLevel, language: Language): Promise<string> {
    try {
      // Find a suitable roadmap template
      const { data: roadmaps, error: roadmapsError } = await supabase
        .from('roadmaps')
        .select('id')
        .eq('level', level)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (roadmapsError || !roadmaps.length) {
        throw new Error(`No roadmap template available for level ${level}`);
      }
      
      const roadmapId = roadmaps[0].id;
      
      // Create a new user roadmap
      const { data: userRoadmap, error: userRoadmapError } = await supabase
        .from('user_roadmaps')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          roadmap_id: roadmapId,
          language,
        })
        .select()
        .single();
      
      if (userRoadmapError) throw userRoadmapError;
      
      // Set the first node as the current node
      const { data: nodes, error: nodesError } = await supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', roadmapId)
        .order('position', { ascending: true })
        .limit(1);
      
      if (!nodesError && nodes.length > 0) {
        const firstNodeId = nodes[0].id;
        
        await supabase
          .from('user_roadmaps')
          .update({ current_node_id: firstNodeId })
          .eq('id', userRoadmap.id);
      }
      
      return userRoadmap.id;
    } catch (error) {
      console.error('Error initializing roadmap:', error);
      throw error;
    }
  },
  
  /**
   * Get all nodes for a roadmap with their status
   */
  async getRoadmapNodes(roadmapId: string): Promise<RoadmapNode[]> {
    try {
      // Get the user roadmap to determine the current node
      const { data: userRoadmap, error: userRoadmapError } = await supabase
        .from('user_roadmaps')
        .select('roadmap_id, current_node_id, language')
        .eq('id', roadmapId)
        .maybeSingle();
      
      if (userRoadmapError) throw userRoadmapError;
      
      if (!userRoadmap) {
        throw new Error('User roadmap not found');
      }
      
      // Get all nodes for this roadmap
      const { data: nodes, error: nodesError } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .order('position', { ascending: true });
      
      if (nodesError) throw nodesError;
      
      // Get completed nodes for this user
      const { data: completedNodes, error: completedNodesError } = await supabase
        .from('roadmap_progress')
        .select('node_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('completed', true);
      
      if (completedNodesError) throw completedNodesError;
      
      const completedNodeIds = new Set(completedNodes.map(n => n.node_id));
      const currentNodeId = userRoadmap.current_node_id;
      
      // Transform nodes and add status
      return nodes.map(node => {
        // Determine node status
        let status: 'locked' | 'available' | 'completed' | 'current' = 'locked';
        
        if (completedNodeIds.has(node.id)) {
          status = 'completed';
        } else if (node.id === currentNodeId) {
          status = 'current';
        } else if (node.position === 0 || nodes.some(n => 
          completedNodeIds.has(n.id) && n.position === node.position - 1
        )) {
          status = 'available';
        }
        
        return {
          id: node.id,
          roadmapId: node.roadmap_id,
          title: node.title,
          description: node.description,
          position: node.position,
          isBonus: node.is_bonus,
          defaultExerciseId: node.default_exercise_id,
          language: node.language as Language | undefined,
          createdAt: new Date(node.created_at),
          updatedAt: new Date(node.updated_at),
          status,
        };
      });
    } catch (error) {
      console.error('Error fetching roadmap nodes:', error);
      throw error;
    }
  },
  
  /**
   * Get exercise content for a roadmap node
   */
  async getNodeExerciseContent(nodeId: string): Promise<ExerciseContent | null> {
    try {
      // Get the node details including default_exercise_id
      const { data: node, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('default_exercise_id, language')
        .eq('id', nodeId)
        .single();
      
      if (nodeError) throw nodeError;
      
      if (!node.default_exercise_id) {
        return null;
      }
      
      // Get the default exercise content
      const { data: exercise, error: exerciseError } = await supabase
        .from('default_exercises')
        .select('*')
        .eq('id', node.default_exercise_id)
        .single();
      
      if (exerciseError) throw exerciseError;
      
      return {
        id: exercise.id,
        title: exercise.title,
        text: exercise.text,
        audioUrl: exercise.audio_url,
        language: exercise.language as Language,
        tags: exercise.tags,
      };
    } catch (error) {
      console.error('Error fetching node exercise:', error);
      throw error;
    }
  },
  
  /**
   * Record completion of a node with accuracy score
   */
  async recordNodeCompletion(nodeId: string, accuracy: number): Promise<NodeCompletionResult> {
    try {
      // Get the node details to know which roadmap it belongs to
      const { data: node, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('roadmap_id, position, is_bonus')
        .eq('id', nodeId)
        .single();
      
      if (nodeError) throw nodeError;
      
      // Get the user roadmap
      const { data: userRoadmaps, error: userRoadmapsError } = await supabase
        .from('user_roadmaps')
        .select('id, language, current_node_id')
        .eq('roadmap_id', node.roadmap_id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      
      if (userRoadmapsError) throw userRoadmapsError;
      
      if (!userRoadmaps.length) {
        throw new Error('User roadmap not found');
      }
      
      const userRoadmap = userRoadmaps[0];
      
      // Increment node completion counter using the database function
      await supabase.rpc('increment_node_completion', {
        node_id_param: nodeId,
        user_id_param: (await supabase.auth.getUser()).data.user?.id,
        language_param: userRoadmap.language,
        roadmap_id_param: node.roadmap_id
      });
      
      // Get the updated node progress
      const { data: nodeProgress, error: nodeProgressError } = await supabase
        .from('roadmap_nodes_progress')
        .select('completion_count, is_completed')
        .eq('node_id', nodeId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      if (nodeProgressError) throw nodeProgressError;
      
      // Find the next node
      const { data: nextNodes, error: nextNodesError } = await supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', node.roadmap_id)
        .eq('position', node.position + 1)
        .order('position', { ascending: true })
        .limit(1);
      
      if (nextNodesError) throw nextNodesError;
      
      const nextNodeId = nextNodes.length > 0 ? nextNodes[0].id : undefined;
      
      // If this node is completed, update the current node to the next one
      if (nodeProgress.is_completed && nextNodeId) {
        await supabase
          .from('user_roadmaps')
          .update({ current_node_id: nextNodeId })
          .eq('id', userRoadmap.id);
      }
      
      return {
        isCompleted: nodeProgress.is_completed,
        completionCount: nodeProgress.completion_count,
        nextNodeId: nextNodeId,
      };
    } catch (error) {
      console.error('Error recording node completion:', error);
      throw error;
    }
  },
  
  /**
   * Mark a node as completed (manual method)
   */
  async markNodeCompleted(nodeId: string): Promise<void> {
    try {
      // Get the node details to know which roadmap it belongs to
      const { data: node, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('roadmap_id')
        .eq('id', nodeId)
        .single();
      
      if (nodeError) throw nodeError;
      
      // Get the user roadmap
      const { data: userRoadmaps, error: userRoadmapsError } = await supabase
        .from('user_roadmaps')
        .select('id, language')
        .eq('roadmap_id', node.roadmap_id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      
      if (userRoadmapsError) throw userRoadmapsError;
      
      if (!userRoadmaps.length) {
        throw new Error('User roadmap not found');
      }
      
      const userRoadmap = userRoadmaps[0];
      
      // Directly mark the node as completed in both tables
      await supabase.from('roadmap_nodes_progress').upsert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        roadmap_id: node.roadmap_id,
        node_id: nodeId,
        language: userRoadmap.language,
        completion_count: 3,
        is_completed: true,
        last_practiced_at: new Date().toISOString()
      });
      
      await supabase.from('roadmap_progress').upsert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        roadmap_id: node.roadmap_id,
        node_id: nodeId,
        completed: true,
        completed_at: new Date().toISOString()
      });
      
      // Find the next node
      const { data: nextNodes, error: nextNodesError } = await supabase
        .from('roadmap_nodes')
        .select('id, position')
        .eq('roadmap_id', node.roadmap_id)
        .gt('position', node.position)
        .order('position', { ascending: true })
        .limit(1);
      
      if (nextNodesError) throw nextNodesError;
      
      // Update the current node to the next one if available
      if (nextNodes.length > 0) {
        await supabase
          .from('user_roadmaps')
          .update({ current_node_id: nextNodes[0].id })
          .eq('id', userRoadmap.id);
      }
    } catch (error) {
      console.error('Error marking node completed:', error);
      throw error;
    }
  }
};
