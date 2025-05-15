
import React, { useEffect, useState } from 'react';
import { useRoadmap } from '@/hooks/use-roadmap';
import { RoadmapNode } from '../types';
import { Loader2 } from 'lucide-react';
import RoadmapPath from './RoadmapPath';
import LevelBadge from '@/components/LevelBadge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { nodeAccessService } from '../services/NodeAccessService';

interface RoadmapVisualizationProps {
  onNodeSelect: (node: RoadmapNode) => void;
  className?: string;
}

const RoadmapVisualization: React.FC<RoadmapVisualizationProps> = ({ 
  onNodeSelect,
  className
}) => {
  const { 
    currentRoadmap, 
    nodes, 
    completedNodes,
    isLoading,
    roadmaps,
    currentNodeId,
    selectRoadmap
  } = useRoadmap();
  
  const [accessibleNodeIds, setAccessibleNodeIds] = useState<string[]>([]);
  const [isAccessLoading, setIsAccessLoading] = useState(false);
  
  // Load accessible nodes
  useEffect(() => {
    const loadAccessibleNodes = async () => {
      if (!currentRoadmap) return;
      
      setIsAccessLoading(true);
      try {
        const { data, error } = await nodeAccessService.getAccessibleNodes(
          currentRoadmap.roadmapId, 
          currentRoadmap.language
        );
        
        if (error) {
          console.error("Error loading accessible nodes:", error);
          return;
        }
        
        setAccessibleNodeIds(data || []);
      } catch (err) {
        console.error("Failed to load accessible nodes:", err);
      } finally {
        setIsAccessLoading(false);
      }
    };
    
    loadAccessibleNodes();
  }, [currentRoadmap, completedNodes]);
  
  // Handle node click - check access before selection
  const handleNodeClick = async (node: RoadmapNode) => {
    // If node is marked as completed or is the current node, allow access
    if (completedNodes.includes(node.id) || node.id === currentNodeId) {
      onNodeSelect(node);
      return;
    }
    
    // For other nodes, check access server-side
    try {
      const { data: hasAccess, error } = await nodeAccessService.canAccessNode(node.id);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not verify access to this lesson"
        });
        return;
      }
      
      if (hasAccess) {
        onNodeSelect(node);
      } else {
        toast({
          variant: "destructive",
          title: "Lesson locked",
          description: "You need to complete previous lessons first"
        });
      }
    } catch (err) {
      console.error("Error checking node access:", err);
      toast({
        variant: "destructive",
        title: "Access error",
        description: "An error occurred while checking lesson access"
      });
    }
  };
  
  useEffect(() => {
    console.log("RoadmapVisualization rendered with:", { 
      currentRoadmap,
      nodes: nodes?.length || 0,
      currentNodeId,
      accessibleNodeIds
    });
    
    if (currentRoadmap && (!nodes || nodes.length === 0)) {
      console.log("No nodes found for current roadmap, attempting to reload");
      // Attempt to reload the current roadmap if no nodes are found
      selectRoadmap?.(currentRoadmap.id).catch(err => {
        console.error("Failed to reload roadmap:", err);
        toast({
          variant: "destructive",
          title: "Failed to load roadmap content",
          description: "Please try refreshing the page"
        });
      });
    }
  }, [currentRoadmap, nodes, currentNodeId, selectRoadmap, accessibleNodeIds]);

  // Loading state
  if (isLoading || isAccessLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p>Loading your learning path...</p>
      </div>
    );
  }

  // No roadmap selected
  if (!currentRoadmap) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No learning path selected</p>
      </div>
    );
  }

  // Find the roadmap details using the roadmapId from currentRoadmap
  const roadmapDetails = roadmaps?.find(r => r.id === currentRoadmap.roadmapId);
  const roadmapName = roadmapDetails?.name || "Learning Path";
  const roadmapLevel = roadmapDetails?.level;
  
  // Find current node
  const currentNode = nodes?.find(n => n.id === currentNodeId);
  
  // Enrich nodes with accessibility information
  const enrichedNodes = nodes?.map(node => {
    // Determine node status
    let status: 'locked' | 'available' | 'completed' | 'current' = 'locked';
    
    if (completedNodes.includes(node.id)) {
      status = 'completed';
    } else if (node.id === currentNodeId) {
      status = 'current';
    } else if (accessibleNodeIds.includes(node.id)) {
      status = 'available';
    }
    
    return {
      ...node,
      status
    };
  });

  // No nodes available
  if (!nodes || nodes.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        <motion.div 
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div>
            <h2 className="text-xl font-bold">{roadmapName}</h2>
            <div className="flex items-center mt-1">
              {roadmapLevel && <LevelBadge level={roadmapLevel} className="mr-2" />}
            </div>
          </div>
        </motion.div>
        
        <div className="p-8 text-center rounded-lg border border-dashed border-muted-foreground/50">
          <h3 className="font-medium text-muted-foreground">No content available</h3>
          <p className="text-sm text-muted-foreground mt-2">
            This roadmap doesn't have any nodes yet. Please check back later or select a different roadmap.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h2 className="text-xl font-bold">{roadmapName}</h2>
          <div className="flex items-center mt-1">
            {roadmapLevel && <LevelBadge level={roadmapLevel} className="mr-2" />}
            <span className="text-sm text-muted-foreground">
              {completedNodes?.length || 0} of {nodes.length} completed
            </span>
          </div>
        </div>
        
        {currentNode && (
          <Button 
            onClick={() => handleNodeClick(currentNode)}
            className="bg-secondary hover:bg-secondary/80"
          >
            Continue Learning
          </Button>
        )}
      </motion.div>
      
      <RoadmapPath 
        nodes={enrichedNodes} 
        onNodeSelect={handleNodeClick} 
      />
    </div>
  );
};

export default RoadmapVisualization;
