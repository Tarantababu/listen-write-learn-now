
import { supabase } from '@/integrations/supabase/client';

class NodeAccessService {
  /**
   * Checks if the current user can access a specific node
   * This is a server-side validation to ensure access control
   */
  async canAccessNode(nodeId: string) {
    try {
      // Get the current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Get the node to check its position
      const { data: nodeData, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('id, roadmap_id, position')
        .eq('id', nodeId)
        .single();

      if (nodeError) throw nodeError;
      if (!nodeData) return { data: false, error: null };

      // For the first node in a roadmap (position = 1), always allow access
      if (nodeData.position === 1) {
        return { data: true, error: null };
      }

      // For other nodes, check if the user has completed the previous node(s)
      const { data: completedNodes, error: progressError } = await supabase
        .from('roadmap_progress')
        .select('node_id')
        .eq('user_id', userData.user.id)
        .eq('roadmap_id', nodeData.roadmap_id)
        .eq('completed', true);

      if (progressError) throw progressError;

      // If no completed nodes, only first node is accessible
      if (!completedNodes || completedNodes.length === 0) {
        return { data: false, error: null };
      }

      // Get all nodes in this roadmap
      const { data: roadmapNodes, error: nodesError } = await supabase
        .from('roadmap_nodes')
        .select('id, position')
        .eq('roadmap_id', nodeData.roadmap_id)
        .order('position');

      if (nodesError) throw nodesError;

      // Find the position of the previous node
      const previousNodePosition = nodeData.position - 1;
      const previousNode = roadmapNodes.find(node => node.position === previousNodePosition);
      
      if (!previousNode) {
        // If there's no previous node (shouldn't happen), allow access
        return { data: true, error: null };
      }

      // Check if the previous node has been completed
      const isPreviousNodeCompleted = completedNodes.some(node => node.node_id === previousNode.id);
      
      return { data: isPreviousNodeCompleted, error: null };
    } catch (error) {
      console.error('Error checking node access:', error);
      return { data: false, error };
    }
  }

  /**
   * Get all accessible nodes for a roadmap
   */
  async getAccessibleNodes(roadmapId: string, language: string) {
    try {
      // Get the current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Get all nodes in the roadmap
      const { data: roadmapNodes, error: nodesError } = await supabase
        .from('roadmap_nodes')
        .select('id, position')
        .eq('roadmap_id', roadmapId)
        .eq('language', language)
        .order('position');

      if (nodesError) throw nodesError;
      if (!roadmapNodes || roadmapNodes.length === 0) {
        return { data: [], error: null };
      }

      // Get all completed nodes for this roadmap
      const { data: completedNodes, error: completedError } = await supabase
        .from('roadmap_progress')
        .select('node_id')
        .eq('user_id', userData.user.id)
        .eq('roadmap_id', roadmapId)
        .eq('completed', true);

      if (completedError) throw completedError;

      const completedNodeIds = completedNodes?.map(node => node.node_id) || [];

      // First node is always accessible
      const accessibleNodeIds = new Set<string>();
      
      // Add the first node
      const firstNode = roadmapNodes.find(node => node.position === 1);
      if (firstNode) {
        accessibleNodeIds.add(firstNode.id);
      }

      // Add all completed nodes
      completedNodeIds.forEach(nodeId => {
        accessibleNodeIds.add(nodeId);
      });

      // For each completed node, make the next node accessible
      for (const completedNodeId of completedNodeIds) {
        const completedNode = roadmapNodes.find(node => node.id === completedNodeId);
        if (completedNode) {
          const nextNode = roadmapNodes.find(node => node.position === completedNode.position + 1);
          if (nextNode) {
            accessibleNodeIds.add(nextNode.id);
          }
        }
      }

      return { data: Array.from(accessibleNodeIds), error: null };
    } catch (error) {
      console.error('Error getting accessible nodes:', error);
      return { data: [], error };
    }
  }
}

export const nodeAccessService = new NodeAccessService();
