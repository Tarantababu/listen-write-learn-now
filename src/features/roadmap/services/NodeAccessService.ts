
import { BaseService } from './BaseService';
import { RoadmapNode } from '../types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Service for managing node access in roadmaps
 */
class NodeAccessService extends BaseService {
  /**
   * Check if a user can access a specific node
   */
  public async canAccessNode(nodeId: string) {
    try {
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return this.error("Authentication required");
      }
      
      // Get the node to determine which roadmap it belongs to
      const { data: nodeData, error: nodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('roadmap_id, position')
        .eq('id', nodeId)
        .single();
        
      if (nodeError) {
        return this.error(`Node not found: ${nodeError.message}`);
      }
      
      // Get user's progress for this roadmap
      const { data: progressData, error: progressError } = await this.supabase
        .from('roadmap_progress')
        .select('node_id, completed')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', nodeData.roadmap_id)
        .eq('completed', true);
      
      if (progressError) {
        return this.error(`Error fetching progress: ${progressError.message}`);
      }
      
      // If no completed nodes and this is not the first position, deny access
      if (progressData.length === 0 && nodeData.position > 1) {
        return this.success(false);
      }
      
      // Get all nodes for this roadmap to check position
      const { data: allNodesData, error: allNodesError } = await this.supabase
        .from('roadmap_nodes')
        .select('id, position')
        .eq('roadmap_id', nodeData.roadmap_id)
        .order('position');
        
      if (allNodesError) {
        return this.error(`Error fetching nodes: ${allNodesError.message}`);
      }
      
      // Check if all previous nodes are completed or if this is the next node
      const completedNodeIds = progressData.map(p => p.node_id);
      
      // First node is always accessible
      if (nodeData.position === 1) {
        return this.success(true);
      }
      
      // Find previous node
      const previousNode = allNodesData.find(n => n.position === nodeData.position - 1);
      if (!previousNode) {
        return this.error('Node position sequence is invalid');
      }
      
      // Check if previous node is completed
      const canAccess = completedNodeIds.includes(previousNode.id);
      
      return this.success(canAccess);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get all accessible node IDs for a user in a roadmap
   */
  public async getAccessibleNodes(roadmapId: string) {
    try {
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return this.error("Authentication required");
      }
      
      // Get all nodes for this roadmap
      const { data: allNodesData, error: allNodesError } = await this.supabase
        .from('roadmap_nodes')
        .select('id, position')
        .eq('roadmap_id', roadmapId)
        .order('position');
        
      if (allNodesError) {
        return this.error(`Error fetching nodes: ${allNodesError.message}`);
      }
      
      // Get user's progress for this roadmap
      const { data: progressData, error: progressError } = await this.supabase
        .from('roadmap_progress')
        .select('node_id, completed')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', roadmapId)
        .eq('completed', true);
      
      if (progressError) {
        return this.error(`Error fetching progress: ${progressError.message}`);
      }
      
      const completedNodeIds = progressData.map(p => p.node_id);
      const accessibleNodeIds: string[] = [];
      
      // First node is always accessible
      if (allNodesData.length > 0) {
        const firstNode = allNodesData.find(n => n.position === 1);
        if (firstNode) {
          accessibleNodeIds.push(firstNode.id);
        }
      }
      
      // Add completed nodes
      accessibleNodeIds.push(...completedNodeIds);
      
      // Add nodes that come right after completed nodes
      allNodesData.forEach(node => {
        const prevNode = allNodesData.find(n => n.position === node.position - 1);
        if (prevNode && completedNodeIds.includes(prevNode.id)) {
          accessibleNodeIds.push(node.id);
        }
      });
      
      // Remove duplicates
      const uniqueAccessibleNodeIds = [...new Set(accessibleNodeIds)];
      
      return this.success(uniqueAccessibleNodeIds);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Create and export singleton instance
export const nodeAccessService = new NodeAccessService();
