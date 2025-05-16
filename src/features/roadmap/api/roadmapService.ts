import { supabase } from '@/integrations/supabase/client';
import { Language, LanguageLevel } from '@/types';
import { RoadmapItem, RoadmapNode, ExerciseContent } from '../types';
import { NodeCompletionResult, ServiceResult } from '../types/service-types';

class RoadmapService {
  private supabase = supabase;

  async getCurrentUserId(): Promise<string | null> {
    const { data } = await this.supabase.auth.getUser();
    return data?.user?.id || null;
  }

  async getNode(nodeId: string): Promise<RoadmapNode | null> {
    try {
      const { data, error } = await this.supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('id', nodeId)
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        roadmapId: data.roadmap_id,
        title: data.title,
        description: data.description || '',
        position: data.position,
        isBonus: data.is_bonus,
        defaultExerciseId: data.default_exercise_id,
        language: data.language,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error fetching node:', error);
      return null;
    }
  }

  async getRoadmapsForLanguage(language: Language): Promise<RoadmapItem[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_roadmaps_by_language', {
          requested_language: language
        });

      if (error) throw error;

      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        level: item.level,
        language: language,
        nodeCount: item.node_count || 0,
        createdAt: new Date(item.created_at),
      }));
    } catch (error) {
      console.error('Error fetching roadmaps:', error);
      return [];
    }
  }

  async getUserRoadmaps(language: Language): Promise<RoadmapItem[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return [];

      const { data, error } = await this.supabase
        .rpc('get_user_roadmaps_by_language', {
          user_id_param: userId,
          requested_language: language
        });

      if (error) throw error;

      return data.map((item: any) => ({
        id: item.id,
        roadmapId: item.roadmap_id,
        name: item.name,
        description: item.description,
        level: item.level,
        language: item.language,
        currentNodeId: item.current_node_id,
        completedNodes: item.completed_nodes || 0,
        totalNodes: item.total_nodes || 0,
        createdAt: new Date(item.created_at),
      }));
    } catch (error) {
      console.error('Error fetching user roadmaps:', error);
      return [];
    }
  }

  async initializeRoadmap(level: LanguageLevel, language: Language): Promise<string> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Find matching roadmap for the level and language
      const { data: roadmaps, error: roadmapError } = await this.supabase
        .from('roadmaps')
        .select('id')
        .eq('level', level);

      if (roadmapError) throw roadmapError;
      if (!roadmaps || roadmaps.length === 0) {
        throw new Error(`No roadmap found for ${level} level`);
      }

      // Check if the roadmap supports this language
      const { data: languageSupport, error: langError } = await this.supabase
        .from('roadmap_languages')
        .select('*')
        .eq('roadmap_id', roadmaps[0].id)
        .eq('language', language);

      if (langError) throw langError;
      if (!languageSupport || languageSupport.length === 0) {
        throw new Error(`Language ${language} not supported for this roadmap`);
      }

      // Check if user already has this roadmap
      const { data: existingRoadmap, error: existingError } = await this.supabase
        .from('user_roadmaps')
        .select('id')
        .eq('user_id', userId)
        .eq('roadmap_id', roadmaps[0].id)
        .eq('language', language)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existingRoadmap) {
        return existingRoadmap.id; // Return existing roadmap ID
      }

      // Create new user roadmap
      const { data: newRoadmap, error: createError } = await this.supabase
        .from('user_roadmaps')
        .insert({
          user_id: userId,
          roadmap_id: roadmaps[0].id,
          language: language
        })
        .select()
        .single();

      if (createError) throw createError;

      // Get first node
      const { data: firstNode, error: nodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', roadmaps[0].id)
        .eq('language', language)
        .order('position', { ascending: true })
        .limit(1)
        .single();

      if (nodeError) {
        if (nodeError.code !== 'PGRST116') { // Not found
          throw nodeError;
        }
        // No nodes for this roadmap and language
        return newRoadmap.id;
      }

      // Update user roadmap with first node
      const { error: updateError } = await this.supabase
        .from('user_roadmaps')
        .update({ current_node_id: firstNode.id })
        .eq('id', newRoadmap.id);

      if (updateError) throw updateError;

      return newRoadmap.id;
    } catch (error) {
      console.error('Error initializing roadmap:', error);
      throw new Error('Failed to initialize roadmap');
    }
  }

  async getRoadmapNodes(userRoadmapId: string): Promise<RoadmapNode[]> {
    try {
      // Get the roadmap ID and language from user_roadmaps
      const { data: userRoadmap, error: roadmapError } = await this.supabase
        .from('user_roadmaps')
        .select('roadmap_id, language')
        .eq('id', userRoadmapId)
        .single();

      if (roadmapError) throw roadmapError;

      // Get all nodes for this roadmap and language
      const { data: nodes, error: nodesError } = await this.supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', userRoadmap.language)
        .order('position');

      if (nodesError) throw nodesError;

      return nodes.map((node: any) => ({
        id: node.id,
        roadmapId: node.roadmap_id,
        title: node.title,
        description: node.description || '',
        position: node.position,
        isBonus: node.is_bonus,
        defaultExerciseId: node.default_exercise_id,
        language: node.language,
        createdAt: new Date(node.created_at),
        updatedAt: new Date(node.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching roadmap nodes:', error);
      return [];
    }
  }

  async getNodeExerciseContent(nodeId: string): Promise<any> {
    try {
      // Get the node to find its default exercise
      const { data: node, error: nodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('default_exercise_id')
        .eq('id', nodeId)
        .single();

      if (nodeError) throw nodeError;
      if (!node.default_exercise_id) {
        return null; // No default exercise for this node
      }

      // Get the exercise content
      const { data: exercise, error: exerciseError } = await this.supabase
        .from('default_exercises')
        .select('*')
        .eq('id', node.default_exercise_id)
        .single();

      if (exerciseError) throw exerciseError;
      return exercise;
    } catch (error) {
      console.error('Error fetching node exercise:', error);
      return null;
    }
  }

  async recordNodeCompletion(nodeId: string, accuracy: number): Promise<NodeCompletionResult> {
    try {
      // First check if the node exists
      const nodeResponse = await this.getNode(nodeId);
      if (!nodeResponse) {
        throw new Error('Node not found');
      }
      
      // Get the current user ID
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Find the user roadmap for this node
      const { data: nodeData } = await this.supabase
        .from('roadmap_nodes')
        .select('roadmap_id, language')
        .eq('id', nodeId)
        .single();
        
      if (!nodeData) {
        throw new Error('Failed to get roadmap information for node');
      }
      
      const { roadmap_id: roadmapId, language } = nodeData;
      
      // Check if we already have a progress record
      const { data: existingProgress } = await this.supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('node_id', nodeId)
        .eq('roadmap_id', roadmapId)
        .eq('language', language)
        .maybeSingle();
      
      const now = new Date();
      
      if (existingProgress) {
        // Update existing progress
        const newCompletionCount = existingProgress.completion_count + (accuracy >= 95 ? 1 : 0);
        const isNowCompleted = newCompletionCount >= 3;  // Mark as completed after 3 successful attempts
        
        const { data } = await this.supabase
          .from('roadmap_nodes_progress')
          .update({
            completion_count: newCompletionCount,
            is_completed: isNowCompleted,
            last_practiced_at: now.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('id', existingProgress.id)
          .select()
          .single();
        
        // If it's newly completed and wasn't before, add to roadmap_progress
        if (isNowCompleted && !existingProgress.is_completed) {
          await this.supabase
            .from('roadmap_progress')
            .upsert({
              user_id: userId,
              roadmap_id: roadmapId,
              node_id: nodeId,
              completed: true,
              completed_at: now.toISOString()
            });
        }
        
        return {
          completionCount: newCompletionCount,
          isCompleted: isNowCompleted,
          lastPracticedAt: now
        };
        
      } else {
        // Create new progress record
        const isCompleted = accuracy >= 95;
        const completionCount = isCompleted ? 1 : 0;
        
        const { data } = await this.supabase
          .from('roadmap_nodes_progress')
          .insert({
            user_id: userId,
            roadmap_id: roadmapId,
            node_id: nodeId,
            language: language,
            completion_count: completionCount,
            is_completed: completionCount >= 3,
            last_practiced_at: now.toISOString()
          })
          .select()
          .single();
        
        return {
          completionCount: completionCount,
          isCompleted: completionCount >= 3,
          lastPracticedAt: now
        };
      }
    } catch (error) {
      console.error('Error recording node completion:', error);
      throw new Error('Failed to record node completion');
    }
  }

  async markNodeCompleted(nodeId: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Get the node to find its roadmap
      const { data: node, error: nodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('roadmap_id, language')
        .eq('id', nodeId)
        .single();

      if (nodeError) throw nodeError;

      const now = new Date().toISOString();

      // Mark the node as completed in roadmap_progress
      await this.supabase
        .from('roadmap_progress')
        .upsert({
          user_id: userId,
          roadmap_id: node.roadmap_id,
          node_id: nodeId,
          completed: true,
          completed_at: now
        });

      // Also mark it as completed in roadmap_nodes_progress
      await this.supabase
        .from('roadmap_nodes_progress')
        .upsert({
          user_id: userId,
          roadmap_id: node.roadmap_id,
          node_id: nodeId,
          language: node.language,
          completion_count: 3, // Set to max completion count
          is_completed: true,
          last_practiced_at: now
        });

      // Find the next node in sequence
      const { data: nodes, error: nodesError } = await this.supabase
        .from('roadmap_nodes')
        .select('id, position')
        .eq('roadmap_id', node.roadmap_id)
        .eq('language', node.language)
        .order('position');

      if (nodesError) throw nodesError;

      // Find current node position and the next node
      const currentNodeIndex = nodes.findIndex((n: any) => n.id === nodeId);
      const nextNode = nodes[currentNodeIndex + 1];

      if (nextNode) {
        // Update user roadmap to point to next node
        const { data: userRoadmap, error: roadmapError } = await this.supabase
          .from('user_roadmaps')
          .select('id')
          .eq('user_id', userId)
          .eq('roadmap_id', node.roadmap_id)
          .eq('language', node.language)
          .single();

        if (roadmapError) throw roadmapError;

        await this.supabase
          .from('user_roadmaps')
          .update({ current_node_id: nextNode.id })
          .eq('id', userRoadmap.id);
      }
    } catch (error) {
      console.error('Error marking node as completed:', error);
      throw new Error('Failed to mark node as completed');
    }
  }
}

export const roadmapService = new RoadmapService();
