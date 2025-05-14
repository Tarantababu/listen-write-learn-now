
import { useState, useEffect } from 'react';
import { useRoadmap } from '@/hooks/use-roadmap';
import { nodeAccessService } from '../services/NodeAccessService';

export function useNodeAccess() {
  const { nodes, currentNodeId, completedNodes } = useRoadmap();
  const [accessibleNodeIds, setAccessibleNodeIds] = useState<string[]>([]);

  useEffect(() => {
    // Only calculate accessible nodes when we have nodes loaded
    if (nodes.length > 0) {
      const accessible = nodeAccessService.getAccessibleNodes(nodes);
      setAccessibleNodeIds(accessible);
    }
  }, [nodes, completedNodes, currentNodeId]);

  const isNodeAccessible = (nodeId: string): boolean => {
    return accessibleNodeIds.includes(nodeId) || completedNodes.includes(nodeId);
  };

  const isNodeLocked = (nodeId: string): boolean => {
    return !isNodeAccessible(nodeId);
  };

  const isNodeCompleted = (nodeId: string): boolean => {
    return completedNodes.includes(nodeId);
  };

  const isCurrentNode = (nodeId: string): boolean => {
    return nodeId === currentNodeId;
  };

  return {
    accessibleNodeIds,
    isNodeAccessible,
    isNodeLocked,
    isNodeCompleted,
    isCurrentNode
  };
}
