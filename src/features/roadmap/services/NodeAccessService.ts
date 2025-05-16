
import { RoadmapNode } from "../types";

class NodeAccessService {
  /**
   * Determine if a node can be accessed based on its position and other nodes' completion status
   */
  canAccessNode(node: RoadmapNode, completedNodeIds: string[], allNodes: RoadmapNode[]): boolean {
    // First node is always accessible
    if (node.position === 1) return true;

    // Any completed node is accessible
    if (completedNodeIds.includes(node.id)) return true;

    // Find the previous node in sequence
    const previousNodes = allNodes.filter(n => n.position < node.position)
      .sort((a, b) => b.position - a.position);
    
    // If there's no previous node, this node is accessible
    if (previousNodes.length === 0) return true;

    // The previous node must be completed
    const previousNode = previousNodes[0];
    return completedNodeIds.includes(previousNode.id);
  }

  /**
   * Get all nodes that can be accessed based on the current completion state
   */
  getAccessibleNodes(nodes: RoadmapNode[], completedNodeIds: string[]): RoadmapNode[] {
    if (!nodes || nodes.length === 0) return [];
    
    // Sort nodes by position to ensure correct sequence
    const sortedNodes = [...nodes].sort((a, b) => a.position - b.position);
    
    // Return all nodes that can be accessed
    return sortedNodes.filter(node => this.canAccessNode(node, completedNodeIds, sortedNodes));
  }
}

// Create and export singleton instance
export const nodeAccessService = new NodeAccessService();
