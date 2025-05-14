
import { useEffect, useState } from 'react';
import { nodeAccessService } from '../services/NodeAccessService';

interface UseNodeAccessProps {
  roadmapId?: string;
  nodeId?: string;
}

interface UseNodeAccessResult {
  hasAccess: boolean;
  isLoading: boolean;
  error: string | null;
  checkAccess: (nodeId: string) => Promise<boolean>;
  accessibleNodeIds: string[];
  loadAccessibleNodes: (roadmapId: string) => Promise<void>;
}

/**
 * Hook to check if a user can access a specific node in a roadmap
 */
export const useNodeAccess = ({ roadmapId, nodeId }: UseNodeAccessProps): UseNodeAccessResult => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessibleNodeIds, setAccessibleNodeIds] = useState<string[]>([]);

  // Check access when nodeId changes
  useEffect(() => {
    if (nodeId) {
      checkAccess(nodeId);
    }
  }, [nodeId]);

  // Load accessible nodes when roadmapId changes
  useEffect(() => {
    if (roadmapId) {
      loadAccessibleNodes(roadmapId);
    }
  }, [roadmapId]);

  // Function to check access to a specific node
  const checkAccess = async (nodeId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: accessError } = await nodeAccessService.canAccessNode(nodeId);
      
      if (accessError) {
        setError(accessError);
        setHasAccess(false);
        return false;
      }
      
      setHasAccess(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error checking access';
      setError(errorMessage);
      setHasAccess(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to load all accessible nodes for a roadmap
  const loadAccessibleNodes = async (roadmapId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: nodesError } = await nodeAccessService.getAccessibleNodes(roadmapId);
      
      if (nodesError) {
        setError(nodesError);
        setAccessibleNodeIds([]);
        return;
      }
      
      setAccessibleNodeIds(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading accessible nodes';
      setError(errorMessage);
      setAccessibleNodeIds([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    hasAccess,
    isLoading,
    error,
    checkAccess,
    accessibleNodeIds,
    loadAccessibleNodes
  };
};
