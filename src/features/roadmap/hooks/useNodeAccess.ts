
import { useState, useEffect } from 'react';
import { useRoadmap } from '@/hooks/use-roadmap';
import { nodeAccessService } from '../services/NodeAccessService';

/**
 * Hook to determine node access for the roadmap visualization
 */
export function useNodeAccess() {
  const { currentRoadmap, nodes, completedNodes } = useRoadmap();
  const [accessibleNodes, setAccessibleNodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAccessibleNodes = async () => {
      if (!currentRoadmap) {
        setAccessibleNodes([]);
        return;
      }

      setLoading(true);
      try {
        // Use the NodeAccessService to get accessible nodes
        const response = await nodeAccessService.getAccessibleNodes(currentRoadmap.id);
        if (response.status === 'success' && response.data) {
          setAccessibleNodes(response.data);
        } else {
          console.error('Error loading accessible nodes:', response.error);
          // Fallback: first node is always accessible
          const firstNode = nodes[0]?.id;
          setAccessibleNodes(firstNode ? [firstNode] : []);
        }
      } catch (error) {
        console.error('Error in useNodeAccess:', error);
        // Fallback: first node is always accessible
        const firstNode = nodes[0]?.id;
        setAccessibleNodes(firstNode ? [firstNode] : []);
      } finally {
        setLoading(false);
      }
    };

    loadAccessibleNodes();
  }, [currentRoadmap, nodes, completedNodes]);

  const isNodeAccessible = (nodeId: string): boolean => {
    return accessibleNodes.includes(nodeId);
  };

  const isNodeCompleted = (nodeId: string): boolean => {
    return completedNodes.includes(nodeId);
  };

  return {
    accessibleNodes,
    isNodeAccessible,
    isNodeCompleted,
    loading
  };
}
