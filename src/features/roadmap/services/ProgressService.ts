
import { BaseService } from './BaseService';
import { ServiceResponse } from '../types/service-types';
import { supabase } from '@/integrations/supabase/client';

interface NodeCompletionParams {
  nodeId: string;
  userId: string;
  language: string;
  roadmapId: string;
}

interface NodeCompletionResult {
  isCompleted: boolean;
  completionCount: number;
}

class ProgressService extends BaseService {
  async incrementNodeCompletion(params: NodeCompletionParams): Promise<NodeCompletionResult | null> {
    try {
      const { nodeId, userId, language, roadmapId } = params;
      
      // Call the database function to increment node completion count
      const { data, error } = await supabase
        .rpc('increment_node_completion', {
          node_id_param: nodeId,
          user_id_param: userId,
          language_param: language,
          roadmap_id_param: roadmapId
        });

      if (error) {
        console.error("Error incrementing node completion:", error);
        throw error;
      }

      // Fetch the updated node progress
      const { data: progressData, error: progressError } = await supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('node_id', nodeId)
        .eq('language', language)
        .single();
      
      if (progressError) {
        console.error('Error fetching updated progress:', progressError);
        throw progressError;
      }
      
      return {
        isCompleted: progressData.is_completed,
        completionCount: progressData.completion_count
      };
    } catch (error) {
      this.handleError('incrementNodeCompletion', error);
      return null;
    }
  }

  async markNodeAsCompleted(params: NodeCompletionParams): Promise<boolean> {
    try {
      const { nodeId, userId, roadmapId, language } = params;
      
      // Check if already completed
      const { data: existingProgress, error: queryError } = await supabase
        .from('roadmap_progress')
        .select('id, completed')
        .eq('user_id', userId)
        .eq('roadmap_id', roadmapId)
        .eq('node_id', nodeId)
        .single();
      
      if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is 'not found'
        console.error('Error checking existing progress:', queryError);
        throw queryError;
      }
      
      if (existingProgress && existingProgress.completed) {
        // Already completed, nothing to do
        return true;
      }
      
      // Insert or update progress record
      if (existingProgress) {
        // Update existing record
        const { error } = await supabase
          .from('roadmap_progress')
          .update({
            completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('roadmap_progress')
          .insert({
            user_id: userId,
            roadmap_id: roadmapId,
            node_id: nodeId,
            completed: true,
            completed_at: new Date().toISOString()
          });

        if (error) throw error;
      }
      
      // Update node progress record
      const { error } = await supabase
        .from('roadmap_nodes_progress')
        .upsert({
          user_id: userId,
          roadmap_id: roadmapId,
          node_id: nodeId,
          language: language,
          completion_count: 3, // Set to 3 to mark as completed
          is_completed: true,
          last_practiced_at: new Date().toISOString()
        }, { onConflict: 'user_id,node_id,language' });

      if (error) throw error;
      
      return true;
    } catch (error) {
      this.handleError('markNodeAsCompleted', error);
      return false;
    }
  }

  async getNodeProgress(userId: string, language: string): Promise<ServiceResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('language', language);

      if (error) throw error;
      
      return {
        status: 'success',
        data,
        error: null
      };
    } catch (error) {
      return this.handleError('getNodeProgress', error);
    }
  }
  
  /**
   * Handle service errors consistently
   */
  protected handleError(methodName: string, error: any): ServiceResponse<any[]> {
    console.error(`ProgressService.${methodName} error:`, error);
    return {
      status: 'error',
      error: error?.message || 'An unexpected error occurred',
      data: null
    };
  }
}

export const progressService = new ProgressService();
