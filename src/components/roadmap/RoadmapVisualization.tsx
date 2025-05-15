
import React from 'react';
import { useRoadmap } from '@/hooks/use-roadmap';
import { RoadmapNode } from '@/types';
import { Check, Lock, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RoadmapVisualizationProps {
  onNodeSelect: (node: RoadmapNode) => void;
}

const RoadmapVisualization: React.FC<RoadmapVisualizationProps> = ({ onNodeSelect }) => {
  const { 
    currentRoadmap, 
    nodes, 
    completedNodes, 
    isLoading, 
    roadmaps,
    currentNodeId,
    availableNodes
  } = useRoadmap();
  
  const getNodeStatus = (node: RoadmapNode): 'completed' | 'available' | 'locked' => {
    if (completedNodes.includes(node.id)) {
      return 'completed';
    }

    if (node.id === currentNodeId || availableNodes.includes(node.id)) {
      return 'available';
    }

    return 'locked';
  };

  if (isLoading) {
    return <div>Loading roadmap...</div>;
  }

  if (!currentRoadmap) {
    return <div>No roadmap selected.</div>;
  }

  const handleNodeClick = (node: RoadmapNode) => {
    // Only allow clicking on available or completed nodes
    if (getNodeStatus(node) !== 'locked') {
      onNodeSelect(node);
    }
  };

  // Find the roadmap name from the roadmaps array
  const roadmapName = roadmaps.find(r => r.id === currentRoadmap.roadmapId)?.name || 'Learning Path';
  const roadmapLevel = roadmaps.find(r => r.id === currentRoadmap.roadmapId)?.level || currentRoadmap.level;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{roadmapName}</h2>
        <div className="flex items-center space-x-2">
          <span>Level:</span>
          <span className="font-medium">{roadmapLevel}</span>
        </div>
      </div>
      
      <div className="grid gap-3">
        {nodes.map((node) => (
          <TooltipProvider key={node.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleNodeClick(node)}
                  disabled={getNodeStatus(node) === 'locked'}
                  className={cn(
                    "w-full p-3 rounded-lg flex items-center justify-between transition-all",
                    getNodeStatus(node) === 'completed' && "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300",
                    getNodeStatus(node) === 'available' && "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300",
                    getNodeStatus(node) === 'locked' && "bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center">
                    <span className="mr-2">{node.position}.</span>
                    <span>{node.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {node.defaultExerciseId && (
                      <BookOpen className="h-4 w-4" />
                    )}
                    {getNodeStatus(node) === 'locked' && <Lock className="h-4 w-4" />}
                    {getNodeStatus(node) === 'completed' && <Check className="h-4 w-4" />}
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{node.description || node.title}</p>
                {node.defaultExerciseId && <p className="text-xs text-muted-foreground">Has default exercise</p>}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
};

export default RoadmapVisualization;
