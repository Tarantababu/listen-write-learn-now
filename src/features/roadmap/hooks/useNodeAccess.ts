
import { useState, useCallback } from 'react';
import { nodeAccessService } from '../services/NodeAccessService';
import { toast } from '@/components/ui/use-toast';
import { Language } from '@/types';

export function useNodeAccess() {
  const [accessibleNodes, setAccessibleNodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  /**
   * Check if a specific node is accessible
   */
  const checkNodeAccess = useCallback(async (nodeId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: hasAccess, error } = await nodeAccessService.canAccessNode(nodeId);
      
      if (error) {
        console.error('Error checking node access:', error);
        toast({
          variant: "destructive",
          title: "Error checking access",
          description: error
        });
        return false;
      }
      
      return hasAccess || false;
    } catch (error) {
      console.error('Error in checkNodeAccess:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Get all accessible nodes for a roadmap
   */
  const loadAccessibleNodes = useCallback(async (roadmapId: string, language: Language) => {
    setIsLoading(true);
    try {
      // Fixing parameter count here - we need to check the NodeAccessService implementation
      // and adjust accordingly
      const { data: nodeIds, error } = await nodeAccessService.getAccessibleNodes(roadmapId);
      
      if (error) {
        console.error('Error loading accessible nodes:', error);
        toast({
          variant: "destructive",
          title: "Error loading accessible nodes",
          description: error
        });
        return [];
      }
      
      setAccessibleNodes(nodeIds || []);
      return nodeIds || [];
    } catch (error) {
      console.error('Error in loadAccessibleNodes:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Check if a node is in the accessible nodes list
   */
  const isNodeAccessible = useCallback((nodeId: string): boolean => {
    return accessibleNodes.includes(nodeId);
  }, [accessibleNodes]);
  
  return {
    accessibleNodes,
    isLoading,
    checkNodeAccess,
    loadAccessibleNodes,
    isNodeAccessible
  };
}
