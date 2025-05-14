
import { BaseService } from './BaseService';
import { ServiceResult } from '../types/service-types';
import { RoadmapNode } from '../types';
import { Language } from '@/types';

/**
 * Service for controlling node access and enforcing linear progression
 */
export class NodeAccessService extends BaseService {
  /**
   * Check if a node is accessible for the current user
   * This performs server-side validation to ensure proper linear progression
   */
  public async canAccessNode(nodeId: string): ServiceResult<boolean> {
    try {
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return this.error('User must be authenticated to access roadmap nodes');
      }
      
      // Get the node to get its position and roadmap ID
      const { data: node, error: nodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('id, roadmap_id, position, language')
        .eq('id', nodeId)
        .single();
        
      if (nodeError) throw nodeError;
      
      // Get the user roadmap
      const { data: userRoadmap, error: userRoadmapError } = await this.supabase
        .from('user_roadmaps')
        .select('*')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', node.roadmap_id)
        .eq('language', node.language)
        .single();
        
      if (userRoadmapError) throw userRoadmapError;
      
      // If this is the current node, it's accessible
      if (userRoadmap.current_node_id === nodeId) {
        return this.success(true);
      }
      
      // Get all nodes for this roadmap with positions less than the requested node
      const { data: previousNodes, error: previousNodesError } = await this.supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', node.roadmap_id)
        .eq('language', node.language)
        .lt('position', node.position)
        .order('position', { ascending: true });
        
      if (previousNodesError) throw previousNodesError;
      
      if (previousNodes.length === 0) {
        // This is the first node, so it's accessible
        return this.success(true);
      }
      
      // Get completion status for all previous nodes
      const previousNodeIds = previousNodes.map(n => n.id);
      
      const { data: completedNodes, error: completedNodesError } = await this.supabase
        .from('roadmap_progress')
        .select('node_id, completed')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', node.roadmap_id)
        .in('node_id', previousNodeIds)
        .eq('completed', true);
        
      if (completedNodesError) throw completedNodesError;
      
      // Check if all previous nodes are completed
      const completedNodeIds = new Set(completedNodes.map(n => n.node_id));
      const allPreviousNodesCompleted = previousNodeIds.every(id => completedNodeIds.has(id));
      
      console.log(`Node access check for ${nodeId}:`, {
        previousNodeIds,
        completedNodeIds: Array.from(completedNodeIds),
        allPreviousNodesCompleted
      });
      
      return this.success(allPreviousNodesCompleted);
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Get all accessible nodes for the current user and roadmap
   * This returns nodes that are either:
   * 1. The current node
   * 2. Nodes that have been completed
   * 3. The next immediate node after a completed node
   */
  public async getAccessibleNodes(roadmapId: string, language: Language): ServiceResult<string[]> {
    try {
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return this.error('User must be authenticated to access roadmap nodes');
      }
      
      // Get all nodes for this roadmap ordered by position
      const { data: nodes, error: nodesError } = await this.supabase
        .from('roadmap_nodes')
        .select('id, position')
        .eq('roadmap_id', roadmapId)
        .eq('language', language)
        .order('position', { ascending: true });
        
      if (nodesError) throw nodesError;
      
      // Get user's current node
      const { data: userRoadmap, error: userRoadmapError } = await this.supabase
        .from('user_roadmaps')
        .select('current_node_id')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', roadmapId)
        .eq('language', language)
        .single();
        
      if (userRoadmapError) throw userRoadmapError;
      
      // Get all completed nodes
      const { data: completedProgress, error: progressError } = await this.supabase
        .from('roadmap_progress')
        .select('node_id')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', roadmapId)
        .eq('completed', true);
        
      if (progressError) throw progressError;
      
      // Build the set of accessible node IDs
      const completedNodeIds = new Set(completedProgress.map(p => p.node_id));
      const accessibleNodeIds: string[] = [];
      let previousNodeCompleted = true; // First node is always accessible
      
      for (const node of nodes) {
        if (
          previousNodeCompleted || // Previous node is completed
          completedNodeIds.has(node.id) || // This node is completed
          node.id === userRoadmap.current_node_id // This is the current node
        ) {
          accessibleNodeIds.push(node.id);
        }
        
        // Update for next iteration
        previousNodeCompleted = completedNodeIds.has(node.id);
      }
      
      return this.success(accessibleNodeIds);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Create and export singleton instance
export const nodeAccessService = new NodeAccessService();
