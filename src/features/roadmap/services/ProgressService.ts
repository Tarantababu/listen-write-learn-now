
import { BaseService } from './BaseService';
import { 
  ProgressServiceInterface,
  ServiceResult,
  RoadmapProgressDetails,
  NodeProgressDetails,
  NodeCompletionResult
} from '../types/service-types';

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
        
      if (userRoadmapError) {
        console.error('Error fetching user roadmap:', userRoadmapError);
        throw userRoadmapError;
      }
      
      if (!userRoadmap) {
        return this.error(`No roadmap found with ID: ${roadmapId}`);
      }
      
      // Get all nodes for this roadmap to calculate total
      const { data: nodes, error: nodesError } = await this.supabase
        .from('roadmap_nodes')
        .select('id, is_bonus')
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', userRoadmap.language)
        .order('position', { ascending: true });
        
      if (nodesError) {
        console.error('Error fetching roadmap nodes:', nodesError);
        throw nodesError;
      }
      
      // Get all completed nodes for this user and roadmap
      const { data: completedProgress, error: progressError } = await this.supabase
        .from('roadmap_progress')
        .select('*')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('completed', true);
        
      if (progressError) {
        console.error('Error fetching roadmap progress:', progressError);
        throw progressError;
      }
      
      // Get detailed node progress
      const { data: nodeProgress, error: nodeProgressError } = await this.supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', userRoadmap.language);
        
      if (nodeProgressError) {
        console.error('Error fetching node progress:', nodeProgressError);
        throw nodeProgressError;
      }
      
      // Convert node progress to a map
      const nodeProgressMap: Record<string, NodeProgressDetails> = {};
      
      (nodeProgress || []).forEach(progress => {
        nodeProgressMap[progress.node_id] = {
          nodeId: progress.node_id,
          completionCount: progress.completion_count || 0,
          isCompleted: progress.is_completed || false,
          lastPracticedAt: progress.last_practiced_at ? new Date(progress.last_practiced_at) : undefined
        };
      });
      
      // Calculate total and completed non-bonus nodes for accurate percentage
      const regularNodes = nodes.filter(n => !n.is_bonus);
      const totalNodes = regularNodes.length;
      
      const completedNodeIds = (completedProgress || []).map(p => p.node_id);
      const completedRegularNodes = regularNodes.filter(n => completedNodeIds.includes(n.id)).length;
      
      // Calculate which nodes are available (first node or nodes after completed nodes)
      let availableCount = 0;
      const nodeIds = nodes.map(node => node.id);
      
      nodeIds.forEach((nodeId, index) => {
        const currentNode = nodes[index];
        
        // First node is always available
        if (index === 0) {
          availableCount++;
        } else if (index > 0) {
          // Regular nodes: check if previous node is completed
          const prevNodeId = nodeIds[index - 1];
          const isCompleted = completedNodeIds.includes(prevNodeId);
          
          if (isCompleted || currentNode.is_bonus) {
            availableCount++;
          }
        }
      });
      
      // Calculate progress percentage based only on non-bonus nodes
      const progressPercentage = totalNodes > 0 ? (completedRegularNodes / totalNodes) * 100 : 0;
      
      const result: RoadmapProgressDetails = {
        totalNodes,
        completedNodes: completedNodeIds.length,
        availableNodes: availableCount,
        currentNodeId: userRoadmap.current_node_id,
        progressPercentage: Math.round(progressPercentage * 10) / 10, // Round to 1 decimal place
        nodeProgress: nodeProgressMap
      };
      
      console.log('Progress calculated successfully:', {
        roadmapId,
        totalRegularNodes: totalNodes,
        completedRegularNodes,
        totalCompletedNodes: completedNodeIds.length,
        progressPercentage: result.progressPercentage
      });
      
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
      
      console.log(`Recording node completion: nodeId=${nodeId}, accuracy=${accuracy}%`);
      
      // Get the node to get the roadmap ID
      const { data: node, error: nodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('roadmap_id, position, is_bonus')
        .eq('id', nodeId)
        .single();
        
      if (nodeError) {
        console.error('Error fetching node:', nodeError);
        throw nodeError;
      }
      
      // Get the user roadmap
      const { data: userRoadmap, error: userRoadmapError } = await this.supabase
        .from('user_roadmaps')
        .select('*')
        .eq('roadmap_id', node.roadmap_id)
        .eq('user_id', auth.userId)
        .single();
        
      if (userRoadmapError) {
        console.error('Error fetching user roadmap:', userRoadmapError);
        throw userRoadmapError;
      }
      
      // Only increment if accuracy is high enough (95% or better)
      if (accuracy >= 95) {
        console.log('Accuracy is sufficient for node completion increment');
        
        // Call the function to increment node completion
        const { error } = await this.supabase
          .rpc('increment_node_completion', {
            node_id_param: nodeId,
            user_id_param: auth.userId,
            language_param: userRoadmap.language,
            roadmap_id_param: node.roadmap_id
          });
          
        if (error) {
          console.error('Error incrementing node completion:', error);
          throw error;
        }
        
        // Get updated node progress
        const { data: nodeProgress, error: nodeProgressError } = await this.supabase
          .from('roadmap_nodes_progress')
          .select('completion_count, is_completed')
          .eq('node_id', nodeId)
          .eq('user_id', auth.userId)
          .single();
          
        if (nodeProgressError) {
          console.error('Error fetching updated node progress:', nodeProgressError);
          throw nodeProgressError;
        }
        
        // Check if node is now completed
        if (nodeProgress.is_completed) {
          console.log('Node is now completed, finding next node');
          
          // Find next available node (skipping bonus nodes if they've already been completed)
          const { data: nextNodes, error: nextNodesError } = await this.supabase
            .from('roadmap_nodes')
            .select('id, is_bonus, position')
            .eq('roadmap_id', node.roadmap_id)
            .eq('language', userRoadmap.language)
            .gt('position', node.position)
            .order('position', { ascending: true });
            
          if (nextNodesError) {
            console.error('Error finding next nodes:', nextNodesError);
            throw nextNodesError;
          }
          
          let nextNodeId: string | undefined = undefined;
          
          // Find the next regular node or an uncompleted bonus node
          if (nextNodes && nextNodes.length > 0) {
            // First check for regular (non-bonus) nodes
            const nextRegularNode = nextNodes.find(n => !n.is_bonus);
            
            if (nextRegularNode) {
              nextNodeId = nextRegularNode.id;
            } else {
              // If no regular nodes, check for any bonus nodes
              // For bonus nodes, we need to check if they're already completed
              for (const bonusNode of nextNodes) {
                if (bonusNode.is_bonus) {
                  const { data: bonusProgress } = await this.supabase
                    .from('roadmap_progress')
                    .select('*')
                    .eq('user_id', auth.userId)
                    .eq('node_id', bonusNode.id)
                    .eq('completed', true)
                    .maybeSingle();
                    
                  if (!bonusProgress) {
                    // Found an uncompleted bonus node
                    nextNodeId = bonusNode.id;
                    break;
                  }
                }
              }
            }
          }
          
          // Update current node if a next node was found
          if (nextNodeId) {
            console.log(`Updating current node to: ${nextNodeId}`);
            
            const { error: updateError } = await this.supabase
              .from('user_roadmaps')
              .update({ 
                current_node_id: nextNodeId,
                updated_at: new Date().toISOString()
              })
              .eq('id', userRoadmap.id);
              
            if (updateError) {
              console.error('Error updating current node:', updateError);
              throw updateError;
            }
          } else {
            console.log('No next node found, user has completed all nodes');
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
      console.log('Accuracy too low, no progress recorded');
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
      
      console.log(`Manually marking node as completed: ${nodeId}`);
      
      // Get the node to get the roadmap ID
      const { data: node, error: nodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('roadmap_id, position, is_bonus')
        .eq('id', nodeId)
        .single();
        
      if (nodeError) {
        console.error('Error fetching node:', nodeError);
        throw nodeError;
      }
      
      // Get the user roadmap
      const { data: userRoadmap, error: userRoadmapError } = await this.supabase
        .from('user_roadmaps')
        .select('*')
        .eq('roadmap_id', node.roadmap_id)
        .eq('user_id', auth.userId)
        .single();
        
      if (userRoadmapError) {
        console.error('Error fetching user roadmap:', userRoadmapError);
        throw userRoadmapError;
      }
      
      const timestamp = new Date().toISOString();
      
      // Mark node as completed in roadmap_progress
      const { error: progressError } = await this.supabase
        .from('roadmap_progress')
        .upsert({
          user_id: auth.userId,
          roadmap_id: node.roadmap_id,
          node_id: nodeId,
          completed: true,
          completed_at: timestamp,
          updated_at: timestamp
        });
        
      if (progressError) {
        console.error('Error updating roadmap progress:', progressError);
        throw progressError;
      }
      
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
          last_practiced_at: timestamp,
          updated_at: timestamp
        });
        
      if (nodeProgressError) {
        console.error('Error updating node progress:', nodeProgressError);
        throw nodeProgressError;
      }
      
      // Find next available node (skipping bonus nodes if they've already been completed)
      const { data: nextNodes, error: nextNodesError } = await this.supabase
        .from('roadmap_nodes')
        .select('id, is_bonus, position')
        .eq('roadmap_id', node.roadmap_id)
        .eq('language', userRoadmap.language)
        .gt('position', node.position)
        .order('position', { ascending: true });
        
      if (nextNodesError) {
        console.error('Error finding next nodes:', nextNodesError);
        throw nextNodesError;
      }
      
      let nextNodeId: string | undefined = undefined;
      
      // Find the next regular node or an uncompleted bonus node
      if (nextNodes && nextNodes.length > 0) {
        // First check for regular (non-bonus) nodes
        const nextRegularNode = nextNodes.find(n => !n.is_bonus);
        
        if (nextRegularNode) {
          nextNodeId = nextRegularNode.id;
        } else {
          // If no regular nodes, check for any bonus nodes
          // For bonus nodes, we need to check if they're already completed
          for (const bonusNode of nextNodes) {
            if (bonusNode.is_bonus) {
              const { data: bonusProgress } = await this.supabase
                .from('roadmap_progress')
                .select('*')
                .eq('user_id', auth.userId)
                .eq('node_id', bonusNode.id)
                .eq('completed', true)
                .maybeSingle();
                
              if (!bonusProgress) {
                // Found an uncompleted bonus node
                nextNodeId = bonusNode.id;
                break;
              }
            }
          }
        }
      }
      
      // Update current node if a next node was found
      if (nextNodeId) {
        console.log(`Updating current node to: ${nextNodeId}`);
        
        const { error: updateError } = await this.supabase
          .from('user_roadmaps')
          .update({ 
            current_node_id: nextNodeId,
            updated_at: timestamp
          })
          .eq('id', userRoadmap.id);
          
        if (updateError) {
          console.error('Error updating current node:', updateError);
          throw updateError;
        }
      } else {
        console.log('No next node found, user has completed all nodes');
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
      
      console.log(`Resetting progress for roadmap: ${roadmapId}`);
      
      // Get the user roadmap to get parent roadmap ID
      const { data: userRoadmap, error: userRoadmapError } = await this.supabase
        .from('user_roadmaps')
        .select('*')
        .eq('id', roadmapId)
        .single();
        
      if (userRoadmapError) {
        console.error('Error fetching user roadmap:', userRoadmapError);
        throw userRoadmapError;
      }
      
      // Delete progress records
      const { error: progressError } = await this.supabase
        .from('roadmap_progress')
        .delete()
        .eq('user_id', auth.userId)
        .eq('roadmap_id', userRoadmap.roadmap_id);
        
      if (progressError) {
        console.error('Error deleting roadmap progress:', progressError);
        throw progressError;
      }
      
      // Delete detailed node progress records
      const { error: nodeProgressError } = await this.supabase
        .from('roadmap_nodes_progress')
        .delete()
        .eq('user_id', auth.userId)
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', userRoadmap.language);
        
      if (nodeProgressError) {
        console.error('Error deleting node progress:', nodeProgressError);
        throw nodeProgressError;
      }
      
      // Find first node to reset current node
      const { data: firstNode, error: firstNodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', userRoadmap.language)
        .order('position', { ascending: true })
        .limit(1)
        .maybeSingle();
        
      if (firstNodeError) {
        console.error('Error finding first node:', firstNodeError);
        throw firstNodeError;
      }
      
      // Update user roadmap to point to first node
      const { error: roadmapError } = await this.supabase
        .from('user_roadmaps')
        .update({ 
          current_node_id: firstNode?.id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', roadmapId);
        
      if (roadmapError) {
        console.error('Error updating user roadmap:', roadmapError);
        throw roadmapError;
      }
      
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
        
      if (nodeError) {
        console.error('Error fetching node:', nodeError);
        throw nodeError;
      }
      
      // Get node progress
      const { data: progress, error: progressError } = await this.supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', auth.userId)
        .eq('node_id', nodeId)
        .eq('language', node.language)
        .maybeSingle();
        
      if (progressError && progressError.code !== 'PGRST116') {
        console.error('Error fetching node progress:', progressError);
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
        completionCount: progress.completion_count || 0,
        isCompleted: progress.is_completed || false,
        lastPracticedAt: progress.last_practiced_at ? new Date(progress.last_practiced_at) : undefined
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Create and export singleton instance
export const progressService = new ProgressService();
