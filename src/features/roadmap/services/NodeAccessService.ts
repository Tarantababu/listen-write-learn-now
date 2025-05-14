
import { BaseService } from './BaseService';
import { ServiceResponse } from '../types/service-types';
import { RoadmapNode } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { userService } from './UserService';

class NodeAccessService extends BaseService {
  /**
   * Get a list of nodes that the user has access to in a roadmap
   */
  async getAccessibleNodes(roadmapId: string): Promise<ServiceResponse<string[]>> {
    try {
      // Get current user
      const user = await userService.getCurrentUser();
      if (!user) {
        return {
          status: 'error',
          error: 'User not authenticated'
        };
      }
      
      // Get all nodes for this roadmap
      const { data: nodes, error: nodesError } = await supabase
        .from('roadmap_nodes')
        .select('id, position')
        .eq('roadmap_id', roadmapId)
        .order('position');
        
      if (nodesError) throw nodesError;
      if (!nodes || nodes.length === 0) {
        return {
          status: 'success',
          data: [] // No nodes in this roadmap
        };
      }
      
      // Get completed nodes
      const { data: progress, error: progressError } = await supabase
        .from('roadmap_progress')
        .select('node_id')
        .eq('roadmap_id', roadmapId)
        .eq('user_id', user.id)
        .eq('completed', true);
        
      if (progressError) throw progressError;
      
      // All completed node IDs
      const completedNodeIds = progress ? progress.map(p => p.node_id) : [];
      
      // Calculate accessible nodes
      // First node is always accessible
      let accessibleNodes: string[] = nodes.length > 0 ? [nodes[0].id] : [];
      
      // A node is accessible if the previous node is completed
      for (let i = 1; i < nodes.length; i++) {
        const prevNode = nodes[i-1];
        if (completedNodeIds.includes(prevNode.id)) {
          accessibleNodes.push(nodes[i].id);
        }
      }
      
      return {
        status: 'success',
        data: accessibleNodes
      };
    } catch (error) {
      return this.handleServiceError('getAccessibleNodes', error);
    }
  }
}

export const nodeAccessService = new NodeAccessService();
