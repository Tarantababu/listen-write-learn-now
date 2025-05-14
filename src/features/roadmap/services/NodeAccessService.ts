
import { RoadmapNode } from '../types';
import { BaseService } from './BaseService';

class NodeAccessService extends BaseService {
  /**
   * Determine which nodes are accessible based on completion status and dependencies
   */
  getAccessibleNodes(nodes: RoadmapNode[]): string[] {
    if (!nodes || nodes.length === 0) {
      return [];
    }

    // Sort nodes by position
    const sortedNodes = [...nodes].sort((a, b) => a.position - b.position);
    
    // Get completed nodes from the nodes with status 'completed'
    const completedNodeIds = nodes
      .filter(node => node.status === 'completed')
      .map(node => node.id);
      
    // The first node is always accessible
    const accessibleNodeIds: string[] = [];
    
    // Check each node and determine if it's accessible
    for (let i = 0; i < sortedNodes.length; i++) {
      const currentNode = sortedNodes[i];
      
      // The first node is always accessible
      if (i === 0) {
        accessibleNodeIds.push(currentNode.id);
        continue;
      }
      
      // If this node is already completed, it's accessible
      if (completedNodeIds.includes(currentNode.id)) {
        accessibleNodeIds.push(currentNode.id);
        continue;
      }
      
      // If the previous node is completed, this node is accessible
      const previousNode = sortedNodes[i - 1];
      if (previousNode && completedNodeIds.includes(previousNode.id)) {
        accessibleNodeIds.push(currentNode.id);
      }
      
      // Bonus nodes are always accessible
      if (currentNode.isBonus) {
        accessibleNodeIds.push(currentNode.id);
      }
    }
    
    return accessibleNodeIds;
  }
}

export const nodeAccessService = new NodeAccessService();
