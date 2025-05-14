import React, { useEffect } from 'react';
import { useRoadmap } from '../context/RoadmapContext';
import { RoadmapNode } from '../types';
import { Loader2 } from 'lucide-react';
import RoadmapPath from './RoadmapPath';
import LevelBadge from '@/components/LevelBadge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

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
  
  useEffect(() => {
    console.log("RoadmapVisualization rendered with:", { 
      currentRoadmap,
      nodes: nodes?.length || 0,
      currentNodeId
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
  }, [currentRoadmap, nodes, currentNodeId, selectRoadmap]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p>Loading your learning path...</p>
      </div>
    );
  }

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
  
  // Debug info about the nodes
  console.log("Current roadmap nodes:", {
    count: nodes?.length || 0,
    nodeIds: nodes?.map(n => n.id) || [],
    currentNodeId,
    currentNode: currentNode ? { id: currentNode.id, title: currentNode.title } : null
  });

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
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Button 
              onClick={() => onNodeSelect(currentNode)}
              className="bg-secondary hover:bg-secondary/90"
            >
              Continue Learning
            </Button>
          </motion.div>
        )}
      </motion.div>

      <RoadmapPath
        nodes={nodes}
        onNodeSelect={onNodeSelect}
      />
    </div>
  );
};

export default RoadmapVisualization;
