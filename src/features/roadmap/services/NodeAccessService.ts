
import { RoadmapNode } from '../types';

// Simple service to check node accessibility based on roadmap progression
export class NodeAccessService {
  /**
   * Checks if a specific node can be accessed based on completed nodes
   * @param node The node to check access for
   * @param completedNodeIds Array of completed node IDs
   * @param allNodes All nodes in the roadmap
   * @returns Boolean indicating if the node can be accessed
   */
  canAccessNode(node: RoadmapNode, completedNodeIds: string[], allNodes: RoadmapNode[]): boolean {
    // Current position
    const position = node.position;

    // Bonus nodes can always be accessed
    if (node.isBonus) {
      return true;
    }

    // If it's the first node (position 0), it's always accessible
    if (position === 0) {
      return true;
    }

    // Check if all nodes with lower positions are completed
    const previousNodes = allNodes.filter(n => n.position < position && !n.isBonus);
    
    // All previous nodes must be completed to access this node
    // If there are no previous nodes, then this node is accessible
    if (previousNodes.length === 0) {
      return true;
    }

    // Check if all previous nodes are completed
    return previousNodes.every(prevNode => completedNodeIds.includes(prevNode.id));
  }
  
  /**
   * Get all nodes that can be accessed based on completed nodes
   * @param allNodes All nodes in the roadmap
   * @param completedNodeIds Array of completed node IDs
   * @returns Array of accessible nodes
   */
  getAccessibleNodes(allNodes: RoadmapNode[], completedNodeIds: string[]): RoadmapNode[] {
    if (!allNodes || allNodes.length === 0) return [];
    
    return allNodes.filter(node => this.canAccessNode(node, completedNodeIds, allNodes));
  }
}

// Export a singleton instance
export const nodeAccessService = new NodeAccessService();
