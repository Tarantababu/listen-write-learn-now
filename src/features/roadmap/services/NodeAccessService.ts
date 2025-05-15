
import { BaseService } from './BaseService';
import { ServiceResult } from '../types/service-types';

export class NodeAccessService extends BaseService {
  /**
   * Check if a user has access to a specific node
   */
  public async canAccessNode(nodeId: string): ServiceResult<boolean> {
    try {
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return this.success(false);
      }
      
      console.log(`Checking access for node: ${nodeId}`);
      
      // First get the node details to get the roadmap ID and position
      const { data: nodeData, error: nodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('roadmap_id, position, language')
        .eq('id', nodeId)
        .single();
        
      if (nodeError) {
        console.error(`Error fetching node data: ${nodeError.message}`);
        return this.error(`Error fetching node data: ${nodeError.message}`);
      }
      
      // Get the user roadmap for this roadmap
      const { data: userRoadmap, error: roadmapError } = await this.supabase
        .from('user_roadmaps')
        .select('id, current_node_id')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', nodeData.roadmap_id)
        .eq('language', nodeData.language)
        .maybeSingle();
        
      if (roadmapError) {
        console.error(`Error fetching user roadmap: ${roadmapError.message}`);
        return this.error(`Error fetching user roadmap: ${roadmapError.message}`);
      }
      
      // If user doesn't have this roadmap, they can't access the node
      if (!userRoadmap) {
        console.log('User does not have access to this roadmap');
        return this.success(false);
      }
      
      // If the node is the current node, allow access
      if (userRoadmap.current_node_id === nodeId) {
        console.log('This is the user\'s current node - access granted');
        return this.success(true);
      }
      
      // Get all completed nodes for this user and roadmap
      const { data: progressData, error: progressError } = await this.supabase
        .from('roadmap_progress')
        .select('node_id')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', nodeData.roadmap_id)
        .eq('completed', true);
        
      if (progressError) {
        console.error(`Error fetching progress data: ${progressError.message}`);
        return this.error(`Error fetching progress data: ${progressError.message}`);
      }
      
      // If the node is already completed, allow access
      const completedNodeIds = progressData.map(p => p.node_id);
      if (completedNodeIds.includes(nodeId)) {
        console.log('Node is already completed - access granted');
        return this.success(true);
      }
      
      // Get all nodes in order to determine if previous nodes are completed
      const { data: nodesData, error: nodesError } = await this.supabase
        .from('roadmap_nodes')
        .select('id, position')
        .eq('roadmap_id', nodeData.roadmap_id)
        .eq('language', nodeData.language)
        .order('position');
        
      if (nodesError) {
        console.error(`Error fetching nodes: ${nodesError.message}`);
        return this.error(`Error fetching nodes: ${nodesError.message}`);
      }
      
      // Find all nodes with position less than this node
      const previousNodes = nodesData
        .filter(n => n.position < nodeData.position)
        .map(n => n.id);
        
      // Check if all previous nodes are completed
      const allPreviousNodesCompleted = previousNodes.every(id => 
        completedNodeIds.includes(id)
      );
      
      console.log(`All previous nodes completed: ${allPreviousNodesCompleted}`);
      return this.success(allPreviousNodesCompleted);
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Get all accessible node IDs for a user's roadmap
   */
  public async getAccessibleNodes(roadmapId: string, language: string): ServiceResult<string[]> {
    try {
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return this.success([]);
      }
      
      // Get all nodes for this roadmap
      const { data: nodes, error: nodesError } = await this.supabase
        .from('roadmap_nodes')
        .select('id, position')
        .eq('roadmap_id', roadmapId)
        .eq('language', language)
        .order('position');
        
      if (nodesError) {
        return this.error(`Error fetching nodes: ${nodesError.message}`);
      }
      
      // Get all completed nodes
      const { data: progress, error: progressError } = await this.supabase
        .from('roadmap_progress')
        .select('node_id')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', roadmapId)
        .eq('completed', true);
        
      if (progressError) {
        return this.error(`Error fetching progress: ${progressError.message}`);
      }
      
      // Get user roadmap to find current node
      const { data: userRoadmap, error: roadmapError } = await this.supabase
        .from('user_roadmaps')
        .select('current_node_id')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', roadmapId)
        .eq('language', language)
        .maybeSingle();
        
      if (roadmapError) {
        return this.error(`Error fetching user roadmap: ${roadmapError.message}`);
      }
      
      const completedNodeIds = progress.map(p => p.node_id);
      const currentNodeId = userRoadmap?.current_node_id;
      
      // First node is always accessible
      const accessibleNodeIds: string[] = [];
      if (nodes.length > 0) {
        accessibleNodeIds.push(nodes[0].id);
      }
      
      // Add current node to accessible nodes
      if (currentNodeId && !accessibleNodeIds.includes(currentNodeId)) {
        accessibleNodeIds.push(currentNodeId);
      }
      
      // Add all completed nodes
      completedNodeIds.forEach(id => {
        if (!accessibleNodeIds.includes(id)) {
          accessibleNodeIds.push(id);
        }
      });
      
      // For each completed node, the next node becomes accessible
      completedNodeIds.forEach(completedId => {
        const completedNode = nodes.find(n => n.id === completedId);
        if (completedNode) {
          const nextNode = nodes.find(n => n.position === completedNode.position + 1);
          if (nextNode && !accessibleNodeIds.includes(nextNode.id)) {
            accessibleNodeIds.push(nextNode.id);
          }
        }
      });
      
      return this.success(accessibleNodeIds);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Create and export singleton instance
export const nodeAccessService = new NodeAccessService();
