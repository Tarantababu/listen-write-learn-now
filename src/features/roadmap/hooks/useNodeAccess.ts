
import { useCallback } from 'react';
import { RoadmapNode } from '../types';
import { nodeAccessService } from '../services/NodeAccessService';

export function useNodeAccess() {
  /**
   * Determine if a node can be accessed based on its position and completion status
   */
  const canAccessNode = useCallback(
    (node: RoadmapNode, completedNodeIds: string[], allNodes: RoadmapNode[]): boolean => {
      return nodeAccessService.canAccessNode(node, completedNodeIds, allNodes);
    },
    []
  );

  /**
   * Get all nodes that can be accessed based on the current completion state
   */
  const getAccessibleNodes = useCallback(
    (nodes: RoadmapNode[], completedNodeIds: string[]): RoadmapNode[] => {
      return nodeAccessService.getAccessibleNodes(nodes, completedNodeIds);
    },
    []
  );

  return { canAccessNode, getAccessibleNodes };
}
