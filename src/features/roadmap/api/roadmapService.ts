import { RoadmapServiceInterface, NodeCompletionResult } from '../types/service-types';
import { RoadmapItem, RoadmapNode, ExerciseContent } from '../types';
import { Language, LanguageLevel } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export class RoadmapService implements RoadmapServiceInterface {
  // Implement the getRoadmapsForLanguage method
  async getRoadmapsForLanguage(language: Language): Promise<RoadmapItem[]> {
    try {
      // Normalize language to lowercase for consistent comparison
      const normalizedLanguage = language.toLowerCase();
      
      console.log(`Getting roadmaps for language: "${normalizedLanguage}"`);
      
      const { data, error } = await supabase
        .rpc('get_roadmaps_by_language', {
          requested_language: normalizedLanguage
        });

      if (error) {
        console.error('Error from get_roadmaps_by_language RPC:', error);
        throw error;
      }

      console.log(`Received roadmaps data:`, data);

      if (!data || data.length === 0) {
        // Fetch languages for debugging
        const { data: debugData } = await supabase
          .from('roadmap_languages')
          .select('*');
        
        console.log('Available roadmap_languages:', debugData);
      }

      const roadmaps: RoadmapItem[] = data.map((roadmap: any) => ({
        id: roadmap.id,
        name: roadmap.name,
        description: roadmap.description,
        level: roadmap.level,
        language: language,
        languages: [normalizedLanguage], // Add languages array
        nodeCount: roadmap.node_count,
        createdAt: new Date(roadmap.created_at),
        updatedAt: new Date(roadmap.updated_at || roadmap.created_at)
      }));

      return roadmaps;
    } catch (error) {
      console.error('Error fetching roadmaps:', error);
      return [];
    }
  }

  // Implement the getUserRoadmaps method
  async getUserRoadmaps(language: Language): Promise<RoadmapItem[]> {
    try {
      // Normalize language to lowercase for consistent comparison
      const normalizedLanguage = language.toLowerCase();
      
      console.log(`Getting user roadmaps for language: "${normalizedLanguage}"`);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return [];

      const { data, error } = await supabase
        .rpc('get_user_roadmaps_by_language', {
          user_id_param: userData.user.id,
          requested_language: normalizedLanguage
        });

      if (error) {
        console.error('Error from get_user_roadmaps_by_language RPC:', error);
        throw error;
      }

      console.log(`Received user roadmaps data:`, data);

      const roadmaps: RoadmapItem[] = data.map((roadmap: any) => ({
        id: roadmap.id,
        roadmapId: roadmap.roadmap_id,
        name: roadmap.name || "Untitled Roadmap",
        description: roadmap.description || "",
        level: roadmap.level || "A1",
        language: normalizedLanguage,
        currentNodeId: roadmap.current_node_id,
        completedNodes: roadmap.completed_nodes || [],
        totalNodes: roadmap.total_nodes || 0,
        createdAt: new Date(roadmap.created_at),
        updatedAt: new Date(roadmap.updated_at || roadmap.created_at)
      }));

      return roadmaps;
    } catch (error) {
      console.error('Error fetching user roadmaps:', error);
      return [];
    }
  }

  // Update recordNodeCompletion to properly track completion based on accuracy and count
  async recordNodeCompletion(nodeId: string, accuracy: number): Promise<NodeCompletionResult> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('User not authenticated');

      // First, get the node details to get the roadmap ID
      const { data: nodeData, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('roadmap_id, language')
        .eq('id', nodeId)
        .single();

      if (nodeError) throw nodeError;

      // Check if a progress record already exists
      const { data: existingProgress, error: existingError } = await supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('node_id', nodeId)
        .single();

      const now = new Date();
      
      // Check if completion is being tracked already
      if (!existingError && existingProgress) {
        // Update existing progress
        const newCompletionCount = existingProgress.completion_count + 1;
        // Only mark as completed if either:
        // 1. Completion count reaches 3 OR
        // 2. Accuracy is 95% or higher
        const isComplete = newCompletionCount >= 3 || accuracy >= 95;

        const { data, error } = await supabase
          .from('roadmap_nodes_progress')
          .update({
            completion_count: newCompletionCount,
            is_completed: isComplete,
            last_practiced_at: now.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('id', existingProgress.id)
          .select()
          .single();

        if (error) throw error;

        // If this completes the node, also update the roadmap_progress table
        if (isComplete && !existingProgress.is_completed) {
          await updateRoadmapNodeProgress(userData.user.id, nodeData.roadmap_id, nodeId, true, now);
          
          // Update current_node_id in user_roadmaps if needed
          await updateCurrentNodeInUserRoadmap(userData.user.id, nodeData.roadmap_id, nodeId, nodeData.language);
        }

        return {
          completionCount: newCompletionCount,
          isCompleted: isComplete,
          lastPracticedAt: now
        };
      } else {
        // Create new progress record
        const isComplete = accuracy >= 95;

        const { data, error: insertError } = await supabase
          .from('roadmap_nodes_progress')
          .insert({
            user_id: userData.user.id,
            roadmap_id: nodeData.roadmap_id,
            node_id: nodeId,
            language: nodeData.language,
            completion_count: 1,
            is_completed: isComplete,
            last_practiced_at: now.toISOString()
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // If accuracy >= 95%, also create a record in roadmap_progress
        if (isComplete) {
          await updateRoadmapNodeProgress(userData.user.id, nodeData.roadmap_id, nodeId, true, now);
          
          // Update current_node_id in user_roadmaps if needed
          await updateCurrentNodeInUserRoadmap(userData.user.id, nodeData.roadmap_id, nodeId, nodeData.language);
        }

        return {
          completionCount: 1,
          isCompleted: isComplete,
          lastPracticedAt: now
        };
      }
    } catch (error) {
      console.error('Error recording node completion:', error);
      throw error;
    }
  }

  // Helper function to update roadmap_progress table
  async updateRoadmapNodeProgress(
    userId: string, 
    roadmapId: string, 
    nodeId: string, 
    completed: boolean,
    completedAt: Date
  ) {
    try {
      // First check if a record already exists
      const { data: existingRecord, error: queryError } = await supabase
        .from('roadmap_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('roadmap_id', roadmapId)
        .eq('node_id', nodeId)
        .maybeSingle();
      
      if (queryError) throw queryError;
      
      // If record exists, update it
      if (existingRecord) {
        const { error } = await supabase
          .from('roadmap_progress')
          .update({
            completed,
            completed_at: completedAt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id);
        
        if (error) throw error;
      } else {
        // Otherwise insert a new record
        const { error } = await supabase
          .from('roadmap_progress')
          .insert({
            user_id: userId,
            roadmap_id: roadmapId,
            node_id: nodeId,
            completed,
            completed_at: completed ? completedAt.toISOString() : null
          });
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating roadmap progress:', error);
    }
  }

  // Helper function to update the current_node_id in user_roadmaps when a node is completed
  async updateCurrentNodeInUserRoadmap(
    userId: string,
    roadmapId: string,
    completedNodeId: string,
    language: string
  ) {
    try {
      // Get the completed node's position
      const { data: completedNode, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('position')
        .eq('id', completedNodeId)
        .single();
      
      if (nodeError) throw nodeError;
      
      // Find the next node in the roadmap based on position
      const { data: nextNodes, error: nextNodeError } = await supabase
        .from('roadmap_nodes')
        .select('id, position')
        .eq('roadmap_id', roadmapId)
        .eq('language', language)
        .gt('position', completedNode.position)
        .order('position', { ascending: true })
        .limit(1);
      
      if (nextNodeError) throw nextNodeError;
      
      if (nextNodes && nextNodes.length > 0) {
        // There is a next node, update user_roadmaps
        const nextNodeId = nextNodes[0].id;
        
        // Find the user_roadmap that needs to be updated
        const { data: userRoadmaps, error: roadmapError } = await supabase
          .from('user_roadmaps')
          .select('id')
          .eq('user_id', userId)
          .eq('roadmap_id', roadmapId)
          .eq('language', language);
        
        if (roadmapError) throw roadmapError;
        
        if (userRoadmaps && userRoadmaps.length > 0) {
          // Update each user roadmap that matches
          for (const userRoadmap of userRoadmaps) {
            const { error: updateError } = await supabase
              .from('user_roadmaps')
              .update({ current_node_id: nextNodeId })
              .eq('id', userRoadmap.id);
            
            if (updateError) throw updateError;
          }
        }
      }
    } catch (error) {
      console.error('Error updating current node in user roadmap:', error);
    }
  }

  // Update getNodeExerciseContent function to use audioUrl instead of audio_url
  async getNodeExerciseContent(nodeId: string): Promise<ExerciseContent | null> {
    try {
      // First check if the node has a default exercise
      const { data: nodeData, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('default_exercise_id, language')
        .eq('id', nodeId)
        .single();
      
      if (nodeError) throw nodeError;
      
      // If node has a default exercise, fetch that
      if (nodeData.default_exercise_id) {
        const { data: exerciseData, error: exerciseError } = await supabase
          .from('default_exercises')
          .select('*')
          .eq('id', nodeData.default_exercise_id)
          .single();
        
        if (exerciseError) throw exerciseError;
        
        if (exerciseData) {
          return {
            id: exerciseData.id,
            title: exerciseData.title,
            text: exerciseData.text,
            language: exerciseData.language as Language,
            audioUrl: exerciseData.audio_url, // Use audioUrl property name in return value
            tags: exerciseData.tags || []
          };
        }
      }
      
      // If no default exercise, return null
      return null;
    } catch (error) {
      console.error('Error getting node exercise:', error);
      return null;
    }
  }
}

export const roadmapService = new RoadmapService();
