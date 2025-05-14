
import { BaseService } from './BaseService';
import { ServiceResult } from '../types/service-types';
import { Language } from '@/types';

class NodeAccessService extends BaseService {
  /**
   * Check if the current user can access a specific roadmap node
   */
  public async canAccessNode(nodeId: string): ServiceResult<boolean> {
    try {
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return this.error('User must be authenticated to access roadmap nodes');
      }

      // Check if the node exists
      const { data: node, error: nodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('id, roadmap_id, position')
        .eq('id', nodeId)
        .single();

      if (nodeError) {
        return this.error(`Node not found: ${nodeError.message}`);
      }

      // Check if the user has this roadmap assigned
      const { data: userRoadmap, error: userRoadmapError } = await this.supabase
        .from('user_roadmaps')
        .select('id')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', node.roadmap_id)
        .single();

      if (userRoadmapError) {
        return this.error('User does not have access to this roadmap');
      }

      // If it's the first node, user always has access
      if (node.position === 1) {
        return this.success(true);
      }

      // For nodes after the first one, check if previous nodes are completed
      // or if the node is already marked as the current node
      const { data: currentNode, error: currentNodeError } = await this.supabase
        .from('user_roadmaps')
        .select('current_node_id')
        .eq('id', userRoadmap.id)
        .single();

      if (currentNodeError) {
        return this.error('Could not verify current node');
      }

      // If this is the current node, the user can access it
      if (currentNode.current_node_id === nodeId) {
        return this.success(true);
      }

      // Get the previous node position
      const prevPosition = node.position - 1;
      
      // Check if the previous node exists
      const { data: prevNode, error: prevNodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', node.roadmap_id)
        .eq('position', prevPosition)
        .single();

      if (prevNodeError) {
        return this.error('Could not verify previous node status');
      }

      // Check if the previous node is completed
      const { data: progress, error: progressError } = await this.supabase
        .from('roadmap_progress')
        .select('completed')
        .eq('user_id', auth.userId)
        .eq('node_id', prevNode.id)
        .single();

      if (progressError) {
        // If there's no progress entry, the node is not completed
        return this.success(false);
      }

      return this.success(progress.completed);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get all accessible nodes for a roadmap
   */
  public async getAccessibleNodes(roadmapId: string, language: Language): ServiceResult<string[]> {
    try {
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return this.error('User must be authenticated to access roadmap nodes');
      }
      
      // Get all nodes for this roadmap
      const { data: nodes, error: nodesError } = await this.supabase
        .from('roadmap_nodes')
        .select('id, position')
        .eq('roadmap_id', roadmapId)
        .eq('language', language)
        .order('position');

      if (nodesError) {
        return this.error(`Failed to fetch nodes: ${nodesError.message}`);
      }

      if (!nodes || nodes.length === 0) {
        return this.success([]);
      }

      // Always include the first node
      const accessibleNodeIds = [nodes[0].id];
      
      // Get completed nodes
      const { data: completedNodes, error: completedError } = await this.supabase
        .from('roadmap_progress')
        .select('node_id')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', roadmapId)
        .eq('completed', true);

      if (completedError) {
        return this.error(`Failed to fetch completed nodes: ${completedError.message}`);
      }
      
      // Get current node from user roadmap
      const { data: userRoadmap, error: userRoadmapError } = await this.supabase
        .from('user_roadmaps')
        .select('current_node_id')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', roadmapId)
        .eq('language', language)
        .single();
      
      if (!userRoadmapError && userRoadmap && userRoadmap.current_node_id) {
        accessibleNodeIds.push(userRoadmap.current_node_id);
      }

      // Add completed node IDs
      if (completedNodes && completedNodes.length > 0) {
        const completedNodeIds = completedNodes.map(item => item.node_id);
        accessibleNodeIds.push(...completedNodeIds);

        // For each completed node, add the next node
        for (const node of nodes) {
          const nodeIndex = nodes.findIndex(n => n.id === node.id);
          if (completedNodeIds.includes(node.id) && nodeIndex < nodes.length - 1) {
            const nextNode = nodes[nodeIndex + 1];
            if (nextNode && !accessibleNodeIds.includes(nextNode.id)) {
              accessibleNodeIds.push(nextNode.id);
            }
          }
        }
      }

      // Remove duplicates and return
      return this.success([...new Set(accessibleNodeIds)]);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export const nodeAccessService = new NodeAccessService();
