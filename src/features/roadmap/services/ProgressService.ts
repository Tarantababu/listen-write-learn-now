
import { BaseService } from './BaseService';
import { 
  ProgressServiceInterface,
  ServiceResult,
  RoadmapProgressDetails,
  NodeProgressDetails
} from '../types/service-types';
import { NodeCompletionResult } from '../types';

export class ProgressService extends BaseService implements ProgressServiceInterface {
  /**
   * Get detailed progress information for a user's roadmap
   */
  public async getRoadmapProgress(roadmapId: string): ServiceResult<RoadmapProgressDetails> {
    try {
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return this.error('User must be authenticated to access roadmap progress');
      }
      
      // Get the user roadmap
      const { data: userRoadmap, error: userRoadmapError } = await this.supabase
        .from('user_roadmaps')
        .select('*')
        .eq('id', roadmapId)
        .single();
        
      if (userRoadmapError) throw userRoadmapError;
      
      // Get all nodes for this roadmap to calculate total
      const { data: nodes, error: nodesError } = await this.supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', userRoadmap.language);
        
      if (nodesError) throw nodesError;
      
      // Get all completed nodes for this user and roadmap
      const { data: completedProgress, error: progressError } = await this.supabase
        .from('roadmap_progress')
        .select('*')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('completed', true);
        
      if (progressError) throw progressError;
      
      // Get detailed node progress
      const { data: nodeProgress, error: nodeProgressError } = await this.supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', userRoadmap.language);
        
      if (nodeProgressError) throw nodeProgressError;
      
      // Convert node progress to a map
      const nodeProgressMap: Record<string, NodeProgressDetails> = {};
      
      nodeProgress?.forEach(progress => {
        nodeProgressMap[progress.node_id] = {
          nodeId: progress.node_id,
          completionCount: progress.completion_count,
          isCompleted: progress.is_completed,
          lastPracticedAt: progress.last_practiced_at ? new Date(progress.last_practiced_at) : undefined
        };
      });
      
      // Calculate total and completed nodes
      const totalNodes = nodes.length;
      const completedNodes = completedProgress?.length || 0;
      
      // Calculate which nodes are available (first node or nodes after completed nodes)
      let availableCount = 0;
      const nodeIds = nodes.map(node => node.id);
      
      nodeIds.forEach((nodeId, index) => {
        if (index === 0) {
          // First node is always available
          availableCount++;
        } else if (index > 0) {
          // Check if previous node is completed
          const prevNodeId = nodeIds[index - 1];
          const isCompleted = completedProgress?.some(p => p.node_id === prevNodeId);
          
          if (isCompleted) {
            availableCount++;
          }
        }
      });
      
      // Calculate progress percentage
      const progressPercentage = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;
      
      const result: RoadmapProgressDetails = {
        totalNodes,
        completedNodes,
        availableNodes: availableCount,
        currentNodeId: userRoadmap.current_node_id,
        progressPercentage,
        nodeProgress: nodeProgressMap
      };
      
      return this.success(result);
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Record completion of a node with an accuracy score
   */
  public async recordNodeCompletion(nodeId: string, accuracy: number): ServiceResult<NodeCompletionResult> {
    try {
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return this.error('User must be authenticated to record node completion');
      }
      
      // Get the node to get the roadmap ID
      const { data: node, error: nodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('roadmap_id, position')
        .eq('id', nodeId)
        .single();
        
      if (nodeError) throw nodeError;
      
      // Get the user roadmap
      const { data: userRoadmap, error: userRoadmapError } = await this.supabase
        .from('user_roadmaps')
        .select('*')
        .eq('roadmap_id', node.roadmap_id)
        .eq('user_id', auth.userId)
        .single();
        
      if (userRoadmapError) throw userRoadmapError;
      
      // Only increment if accuracy is high enough (95% or better)
      if (accuracy >= 95) {
        // Call the function to increment node completion
        const { error } = await this.supabase
          .rpc('increment_node_completion', {
            node_id_param: nodeId,
            user_id_param: auth.userId,
            language_param: userRoadmap.language,
            roadmap_id_param: node.roadmap_id
          });
          
        if (error) throw error;
        
        // Get updated node progress
        const { data: nodeProgress, error: nodeProgressError } = await this.supabase
          .from('roadmap_nodes_progress')
          .select('completion_count, is_completed')
          .eq('node_id', nodeId)
          .eq('user_id', auth.userId)
          .single();
          
        if (nodeProgressError) throw nodeProgressError;
        
        // Check if node is now completed
        if (nodeProgress.is_completed) {
          // Find next node in sequence
          const { data: nextNode, error: nextNodeError } = await this.supabase
            .from('roadmap_nodes')
            .select('id')
            .eq('roadmap_id', node.roadmap_id)
            .eq('language', userRoadmap.language)
            .eq('position', node.position + 1)
            .maybeSingle();
            
          let nextNodeId = undefined;
          
          // Update current node if a next node was found
          if (!nextNodeError && nextNode) {
            nextNodeId = nextNode.id;
            
            const { error: updateError } = await this.supabase
              .from('user_roadmaps')
              .update({ 
                current_node_id: nextNode.id,
                updated_at: new Date().toISOString()
              })
              .eq('id', userRoadmap.id);
              
            if (updateError) throw updateError;
          }
          
          return this.success({
            isCompleted: true,
            completionCount: nodeProgress.completion_count,
            nextNodeId
          });
        }
        
        return this.success({
          isCompleted: false,
          completionCount: nodeProgress.completion_count
        });
      } 
      
      // If accuracy is too low, don't increment
      return this.success({
        isCompleted: false,
        completionCount: 0
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Mark a node as completed manually (without incremental progress)
   */
  public async markNodeAsCompleted(nodeId: string): ServiceResult<void> {
    try {
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return this.error('User must be authenticated to mark node as completed');
      }
      
      // Get the node to get the roadmap ID
      const { data: node, error: nodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('roadmap_id, position')
        .eq('id', nodeId)
        .single();
        
      if (nodeError) throw nodeError;
      
      // Get the user roadmap
      const { data: userRoadmap, error: userRoadmapError } = await this.supabase
        .from('user_roadmaps')
        .select('*')
        .eq('roadmap_id', node.roadmap_id)
        .eq('user_id', auth.userId)
        .single();
        
      if (userRoadmapError) throw userRoadmapError;
      
      // Mark node as completed in roadmap_progress
      const { error: progressError } = await this.supabase
        .from('roadmap_progress')
        .upsert({
          user_id: auth.userId,
          roadmap_id: node.roadmap_id,
          node_id: nodeId,
          completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (progressError) throw progressError;
      
      // Also mark as completed in roadmap_nodes_progress
      const { error: nodeProgressError } = await this.supabase
        .from('roadmap_nodes_progress')
        .upsert({
          user_id: auth.userId,
          roadmap_id: node.roadmap_id,
          node_id: nodeId,
          language: userRoadmap.language,
          completion_count: 3, // Set to max
          is_completed: true,
          last_practiced_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (nodeProgressError) throw nodeProgressError;
      
      // Find next node in sequence
      const { data: nextNode, error: nextNodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', node.roadmap_id)
        .eq('language', userRoadmap.language)
        .eq('position', node.position + 1)
        .maybeSingle();
        
      // Update current node if a next node was found
      if (!nextNodeError && nextNode) {
        const { error: updateError } = await this.supabase
          .from('user_roadmaps')
          .update({ 
            current_node_id: nextNode.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', userRoadmap.id);
          
        if (updateError) throw updateError;
      }
      
      return this.success(undefined);
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Reset progress for a roadmap
   */
  public async resetProgress(roadmapId: string): ServiceResult<void> {
    try {
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return this.error('User must be authenticated to reset progress');
      }
      
      // Get the user roadmap to get parent roadmap ID
      const { data: userRoadmap, error: userRoadmapError } = await this.supabase
        .from('user_roadmaps')
        .select('*')
        .eq('id', roadmapId)
        .single();
        
      if (userRoadmapError) throw userRoadmapError;
      
      // Delete progress records
      const { error: progressError } = await this.supabase
        .from('roadmap_progress')
        .delete()
        .eq('user_id', auth.userId)
        .eq('roadmap_id', userRoadmap.roadmap_id);
        
      if (progressError) throw progressError;
      
      // Delete detailed node progress records
      const { error: nodeProgressError } = await this.supabase
        .from('roadmap_nodes_progress')
        .delete()
        .eq('user_id', auth.userId)
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', userRoadmap.language);
        
      if (nodeProgressError) throw nodeProgressError;
      
      // Find first node to reset current node
      const { data: firstNode, error: firstNodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', userRoadmap.language)
        .order('position', { ascending: true })
        .limit(1)
        .maybeSingle();
        
      // Update user roadmap to point to first node
      const { error: roadmapError } = await this.supabase
        .from('user_roadmaps')
        .update({ 
          current_node_id: firstNode?.id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', roadmapId);
        
      if (roadmapError) throw roadmapError;
      
      return this.success(undefined);
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Get progress for a specific node
   */
  public async getNodeProgress(nodeId: string): ServiceResult<NodeProgressDetails> {
    try {
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return this.error('User must be authenticated to get node progress');
      }
      
      // Get the node to get the roadmap ID
      const { data: node, error: nodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('roadmap_id, language')
        .eq('id', nodeId)
        .single();
        
      if (nodeError) throw nodeError;
      
      // Get node progress
      const { data: progress, error: progressError } = await this.supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', auth.userId)
        .eq('node_id', nodeId)
        .eq('language', node.language)
        .maybeSingle();
        
      if (progressError && progressError.code !== 'PGRST116') {
        throw progressError;
      }
      
      // If no progress record exists, return default values
      if (!progress) {
        return this.success({
          nodeId,
          completionCount: 0,
          isCompleted: false
        });
      }
      
      // Return formatted progress
      return this.success({
        nodeId: progress.node_id,
        completionCount: progress.completion_count,
        isCompleted: progress.is_completed,
        lastPracticedAt: progress.last_practiced_at ? new Date(progress.last_practiced_at) : undefined
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Create and export singleton instance
export const progressService = new ProgressService();
