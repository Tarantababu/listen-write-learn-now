
import React, { useEffect, useState } from 'react';
import { useRoadmap } from '@/hooks/use-roadmap';
import { RoadmapNode } from '../types';
import { Loader2, CheckCircle2, Circle, CircleDashed } from 'lucide-react';
import RoadmapPath from './RoadmapPath';
import LevelBadge from '@/components/LevelBadge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { nodeAccessService } from '../services/NodeAccessService';
import { Progress } from '@/components/ui/progress';

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
    selectRoadmap,
    nodeProgress
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
      accessibleNodeIds,
      nodeProgress
    });
    
    if (currentRoadmap && (!nodes || nodes.length === 0)) {
      console.log("No nodes found for current roadmap, attempting to reload");
      // Attempt to reload the current roadmap if no nodes are found
      selectRoadmap?.(currentRoadmap.id).catch(err => {
        console.error("Failed to reload roadmap:", err);
        toast({
          variant: "destructive",
          title: "Failed to load curriculum content",
          description: "Please try refreshing the page"
        });
      });
    }
  }, [currentRoadmap, nodes, currentNodeId, selectRoadmap, accessibleNodeIds, nodeProgress]);

  // Loading state
  if (isLoading || isAccessLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p>Loading your curriculum...</p>
      </div>
    );
  }

  // No roadmap selected
  if (!currentRoadmap) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No curriculum selected</p>
      </div>
    );
  }

  // Find the roadmap details using the roadmapId from currentRoadmap
  const roadmapDetails = roadmaps?.find(r => r.id === currentRoadmap.roadmapId);
  const roadmapName = roadmapDetails?.name || "Curriculum";
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
    
    // Get the node progress information
    const nodeProgressInfo = nodeProgress?.find(np => np.nodeId === node.id);
    const completionCount = nodeProgressInfo?.completionCount || 0;
    const isCompleted = nodeProgressInfo?.isCompleted || false;
    const lastPracticedAt = nodeProgressInfo?.lastPracticedAt;
    
    return {
      ...node,
      status,
      completionCount,
      isCompleted,
      lastPracticedAt
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
            This curriculum doesn't have any lessons yet. Please check back later or select a different curriculum.
          </p>
        </div>
      </div>
    );
  }

  const totalNodes = nodes.length;
  const completedCount = completedNodes.length;
  const progressPercentage = Math.round((completedCount / totalNodes) * 100);

  return (
    <div className={cn("space-y-6", className)}>
      <motion.div 
        className="flex flex-col space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{roadmapName}</h2>
            <div className="flex items-center mt-1">
              {roadmapLevel && <LevelBadge level={roadmapLevel} className="mr-2" />}
              <span className="text-sm text-muted-foreground">
                {completedCount} of {totalNodes} lessons completed
              </span>
            </div>
          </div>
          
          {currentNode && (
            <Button 
              onClick={() => handleNodeClick(currentNode)}
              className="bg-primary hover:bg-primary/80"
            >
              Continue Learning
            </Button>
          )}
        </div>
        
        <div className="w-full">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>{progressPercentage}% complete</span>
            <span>{completedCount}/{totalNodes} lessons</span>
          </div>
        </div>
      </motion.div>
      
      <RoadmapPath 
        nodes={enrichedNodes} 
        onNodeSelect={handleNodeClick} 
      />
      
      <div className="flex items-center justify-around mt-4 pt-4 border-t">
        <div className="flex items-center">
          <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
          <span className="text-xs">Completed</span>
        </div>
        <div className="flex items-center">
          <Circle className="h-4 w-4 text-secondary fill-secondary mr-2" />
          <span className="text-xs">Current</span>
        </div>
        <div className="flex items-center">
          <Circle className="h-4 w-4 text-foreground mr-2" />
          <span className="text-xs">Available</span>
        </div>
        <div className="flex items-center">
          <CircleDashed className="h-4 w-4 text-muted-foreground mr-2" />
          <span className="text-xs">Locked</span>
        </div>
      </div>
    </div>
  );
};

export default RoadmapVisualization;
