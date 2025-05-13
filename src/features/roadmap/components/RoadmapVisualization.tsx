
import React from 'react';
import { useRoadmap } from '../context/RoadmapContext';
import { RoadmapNode } from '../types';
import { Loader2 } from 'lucide-react';
import RoadmapPath from './RoadmapPath';
import LevelBadge from '@/components/LevelBadge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
    currentNodeId
  } = useRoadmap();

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
  const roadmapDetails = roadmaps.find(r => r.id === currentRoadmap.roadmapId);
  const roadmapName = roadmapDetails?.name || "Learning Path";
  const roadmapLevel = roadmapDetails?.level;
  
  // Find current node
  const currentNode = nodes.find(n => n.id === currentNodeId);

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
              {completedNodes.length} of {nodes.length} completed
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
