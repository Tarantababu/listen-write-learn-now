
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
        .select('roadmap_id, position, language, is_bonus')
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
        console.log(`Node ${nodeId} is the current node - access granted`);
        return this.success(true);
      }
      
      // If it's a bonus node, check if the user has progressed enough to access it
      if (nodeData.is_bonus) {
        // Find the regular node before this bonus node to check if it's completed
        const { data: previousRegularNodes, error: prevNodeError } = await this.supabase
          .from('roadmap_nodes')
          .select('id')
          .eq('roadmap_id', nodeData.roadmap_id)
          .eq('language', nodeData.language)
          .eq('is_bonus', false)
          .lt('position', nodeData.position)
          .order('position', { ascending: false })
          .limit(1);
          
        if (prevNodeError) {
          console.error(`Error fetching previous nodes: ${prevNodeError.message}`);
          return this.error(`Error fetching previous nodes: ${prevNodeError.message}`);
        }
        
        // If there is no regular node before this, use the first node in the roadmap
        if (!previousRegularNodes || previousRegularNodes.length === 0) {
          console.log('No regular node found before this bonus node');
          
          // If it's the very first node or there are no nodes before it, allow access
          const { data: firstNode, error: firstNodeError } = await this.supabase
            .from('roadmap_nodes')
            .select('id')
            .eq('roadmap_id', nodeData.roadmap_id)
            .eq('language', nodeData.language)
            .order('position', { ascending: true })
            .limit(1)
            .single();
            
          if (firstNodeError) {
            console.error(`Error fetching first node: ${firstNodeError.message}`);
            return this.error(`Error fetching first node: ${firstNodeError.message}`);
          }
          
          // If this is the first node, allow access
          if (firstNode.id === nodeId) {
            console.log(`Node ${nodeId} is the first node - access granted`);
            return this.success(true);
          }
          
          // Check if there's any completed node before accessing a bonus node
          const { data: anyCompleted, error: anyCompletedError } = await this.supabase
            .from('roadmap_progress')
            .select('id')
            .eq('user_id', auth.userId)
            .eq('roadmap_id', nodeData.roadmap_id)
            .eq('completed', true)
            .limit(1);
            
          if (anyCompletedError) {
            console.error(`Error checking for any completed nodes: ${anyCompletedError.message}`);
            return this.error(`Error checking for any completed nodes: ${anyCompletedError.message}`);
          }
          
          // If user has completed at least one node, they can access this bonus node
          const canAccess = anyCompleted && anyCompleted.length > 0;
          console.log(`User ${canAccess ? 'can' : 'cannot'} access bonus node ${nodeId} based on completion of any node`);
          return this.success(canAccess);
        }
        
        // Check if the previous regular node is completed
        const prevNodeId = previousRegularNodes[0].id;
        const { data: prevNodeProgress, error: prevProgressError } = await this.supabase
          .from('roadmap_progress')
          .select('completed')
          .eq('user_id', auth.userId)
          .eq('node_id', prevNodeId)
          .eq('completed', true)
          .maybeSingle();
          
        if (prevProgressError) {
          console.error(`Error checking previous node progress: ${prevProgressError.message}`);
          return this.error(`Error checking previous node progress: ${prevProgressError.message}`);
        }
        
        // User can access this bonus node if they've completed the previous regular node
        const canAccess = !!prevNodeProgress;
        console.log(`User ${canAccess ? 'can' : 'cannot'} access bonus node ${nodeId} based on completion of previous node ${prevNodeId}`);
        return this.success(canAccess);
      }
      
      // For regular (non-bonus) nodes...
      
      // If the position is 0 (first node), allow access
      if (nodeData.position === 0) {
        console.log(`Node ${nodeId} is the first node - access granted`);
        return this.success(true);
      }
      
      // Check if the previous node is completed
      const { data: previousNode, error: prevNodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', nodeData.roadmap_id)
        .eq('language', nodeData.language)
        .lt('position', nodeData.position)
        .order('position', { ascending: false })
        .limit(1)
        .single();
        
      if (prevNodeError) {
        console.error(`Error fetching previous node: ${prevNodeError.message}`);
        return this.error(`Error fetching previous node: ${prevNodeError.message}`);
      }
      
      // Check if the previous node is completed
      const { data: prevNodeProgress, error: prevProgressError } = await this.supabase
        .from('roadmap_progress')
        .select('completed')
        .eq('user_id', auth.userId)
        .eq('node_id', previousNode.id)
        .eq('completed', true)
        .maybeSingle();
        
      if (prevProgressError) {
        console.error(`Error checking previous node progress: ${prevProgressError.message}`);
        return this.error(`Error checking previous node progress: ${prevProgressError.message}`);
      }
      
      // User can access this node if they've completed the previous node
      const canAccess = !!prevNodeProgress;
      console.log(`User ${canAccess ? 'can' : 'cannot'} access node ${nodeId} based on completion of previous node ${previousNode.id}`);
      return this.success(canAccess);
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Get all nodes that the user can access
   */
  public async getAccessibleNodes(roadmapId: string): ServiceResult<string[]> {
    try {
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return this.success([]);
      }
      
      console.log(`Getting accessible nodes for roadmap: ${roadmapId}`);
      
      // Get the user roadmap
      const { data: userRoadmap, error: userRoadmapError } = await this.supabase
        .from('user_roadmaps')
        .select('*')
        .eq('id', roadmapId)
        .single();
        
      if (userRoadmapError) {
        console.error(`Error fetching user roadmap: ${userRoadmapError.message}`);
        return this.error(`Error fetching user roadmap: ${userRoadmapError.message}`);
      }
      
      // Get all completed nodes
      const { data: completedProgress, error: progressError } = await this.supabase
        .from('roadmap_progress')
        .select('node_id')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('completed', true);
        
      if (progressError) {
        console.error(`Error fetching completed nodes: ${progressError.message}`);
        return this.error(`Error fetching completed nodes: ${progressError.message}`);
      }
      
      const completedNodeIds = (completedProgress || []).map(p => p.node_id);
      console.log(`Found ${completedNodeIds.length} completed nodes`);
      
      // Get all nodes for this roadmap
      const { data: nodes, error: nodesError } = await this.supabase
        .from('roadmap_nodes')
        .select('id, position, is_bonus')
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', userRoadmap.language)
        .order('position', { ascending: true });
        
      if (nodesError) {
        console.error(`Error fetching roadmap nodes: ${nodesError.message}`);
        return this.error(`Error fetching roadmap nodes: ${nodesError.message}`);
      }
      
      const accessibleNodeIds: string[] = [];
      let previousNodeCompleted = true; // First node is always accessible
      
      // Determine which nodes are accessible
      for (const node of nodes) {
        const isCompleted = completedNodeIds.includes(node.id);
        
        if (isCompleted) {
          // Completed nodes are always accessible
          accessibleNodeIds.push(node.id);
          previousNodeCompleted = true;
        } else if (node.is_bonus) {
          // Bonus nodes are accessible if any node has been completed
          if (completedNodeIds.length > 0) {
            accessibleNodeIds.push(node.id);
          }
        } else if (node.position === 0 || previousNodeCompleted) {
          // First node or nodes after completed nodes are accessible
          accessibleNodeIds.push(node.id);
          previousNodeCompleted = false; // Reset for next regular node
        }
      }
      
      console.log(`Returning ${accessibleNodeIds.length} accessible nodes`);
      return this.success(accessibleNodeIds);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Create and export singleton instance
export const nodeAccessService = new NodeAccessService();
