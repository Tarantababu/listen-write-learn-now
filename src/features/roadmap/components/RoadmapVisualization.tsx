
import React, { useMemo } from 'react';
import { useRoadmap } from '@/hooks/use-roadmap';
import { RoadmapNode } from '@/types';
import { Card } from '@/components/ui/card';
import { Check, Lock, Play, ChevronRight } from 'lucide-react';

interface RoadmapVisualizationProps {
  onNodeSelect: (node: RoadmapNode) => void;
}

const RoadmapVisualization: React.FC<RoadmapVisualizationProps> = ({ onNodeSelect }) => {
  const { 
    nodes, 
    completedNodes,
    nodeProgress,
    currentRoadmap,
    currentNodeId
  } = useRoadmap();

  // Calculate which nodes are available based on position and completion status
  const nodesWithStatus = useMemo(() => {
    // Sort nodes by position to ensure correct order
    const sortedNodes = [...nodes].sort((a, b) => a.position - b.position);
    
    // Track completed node positions
    const completedPositions = new Set(
      sortedNodes
        .filter(node => completedNodes.includes(node.id))
        .map(node => node.position)
    );
    
    // Add nodes with completion status from nodeProgress
    for (const progress of nodeProgress) {
      const node = sortedNodes.find(n => n.id === progress.nodeId);
      if (node && progress.isCompleted) {
        completedPositions.add(node.position);
      }
    }

    // Build the nodes with status
    return sortedNodes.map((node, index) => {
      // A node is completed if it's in completedNodes or marked as completed in nodeProgress
      const isCompleted = completedNodes.includes(node.id) || 
                         nodeProgress.some(np => np.nodeId === node.id && np.isCompleted);
      
      // A node is current if it matches the currentNodeId
      const isCurrent = node.id === currentNodeId;
      
      // A node is available if:
      // 1. It's the first node (position 0 or 1), OR
      // 2. The previous node is completed, OR
      // 3. It's already completed (you can review it)
      const previousPosition = node.position - 1;
      const isFirstNode = node.position === 0 || node.position === 1;
      const isPreviousNodeCompleted = completedPositions.has(previousPosition);
      
      const isAvailable = isFirstNode || isPreviousNodeCompleted || isCompleted;
      
      // Determine the status for styling and accessibility
      let status: 'locked' | 'available' | 'completed' | 'current' = 'locked';
      
      if (isCompleted) status = 'completed';
      else if (isCurrent) status = 'current';
      else if (isAvailable) status = 'available';
      
      // Get completion count if available
      const progressInfo = nodeProgress.find(np => np.nodeId === node.id);
      const completionCount = progressInfo?.completionCount || 0;
      
      return {
        ...node,
        status,
        progressCount: completionCount,
        isCompleted
      };
    });
  }, [nodes, completedNodes, currentNodeId, nodeProgress]);

  const handleNodeClick = (node: RoadmapNode) => {
    // Only allow clicking on available nodes
    if (node.status === 'locked') return;
    onNodeSelect(node);
  };

  // If there are no nodes yet, show a placeholder
  if (nodesWithStatus.length === 0) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-muted-foreground">No lessons available yet</p>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className="flex flex-col gap-3 md:gap-4 w-full max-w-3xl mx-auto">
        {nodesWithStatus.map((node, index) => {
          // Style based on node status
          const isCompleted = node.status === 'completed';
          const isLocked = node.status === 'locked';
          const isCurrent = node.status === 'current';
          const isAvailable = node.status === 'available' || isCurrent;
          
          // Progress info
          const progressInfo = nodeProgress.find(np => np.nodeId === node.id);
          const completionCount = progressInfo?.completionCount || 0;
          const isFullyCompleted = isCompleted || (progressInfo?.isCompleted === true);
          const progressPercent = Math.min(completionCount / 3 * 100, 100);
          
          return (
            <div key={node.id} className="relative">
              {/* Connector line */}
              {index > 0 && (
                <div
                  className={`absolute left-6 -top-3 h-3 w-[2px] ${
                    isAvailable || isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                />
              )}
              
              <Card
                onClick={() => handleNodeClick(node)}
                className={`flex items-center gap-4 p-4 cursor-pointer transition-all border ${
                  isLocked
                    ? 'bg-muted/40 border-muted cursor-not-allowed opacity-70'
                    : isCompleted || isFullyCompleted
                      ? 'bg-green-50 border-green-200 hover:border-green-300 dark:bg-green-950/20 dark:border-green-800 dark:hover:border-green-700'
                      : isCurrent
                        ? 'bg-blue-50 border-blue-200 hover:border-blue-300 dark:bg-blue-950/20 dark:border-blue-800 dark:hover:border-blue-700'
                        : 'hover:border-primary/50'
                }`}
              >
                {/* Status icon */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isLocked
                      ? 'bg-muted border border-muted-foreground/30 text-muted-foreground/50'
                      : isCompleted || isFullyCompleted
                        ? 'bg-green-100 border border-green-200 text-green-600 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400'
                        : isCurrent
                          ? 'bg-blue-100 border border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400'
                          : 'bg-primary/10 border border-primary/20 text-primary'
                  }`}
                >
                  {isLocked && <Lock className="w-5 h-5" />}
                  {(isCompleted || isFullyCompleted) && <Check className="w-5 h-5" />}
                  {isCurrent && <Play className="w-5 h-5" />}
                  {isAvailable && !isCurrent && !isCompleted && !isFullyCompleted && (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <h3
                    className={`font-medium ${
                      isLocked
                        ? 'text-muted-foreground/70'
                        : ''
                    }`}
                  >
                    {node.title}
                  </h3>
                  
                  {/* Progress indicator */}
                  {completionCount > 0 && !isLocked && (
                    <div className="flex items-center mt-1 text-sm">
                      <div className="flex-1 h-1 bg-muted rounded-full mr-2">
                        <div 
                          className={`h-1 rounded-full ${isFullyCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {completionCount}/3 
                        {isFullyCompleted && <span className="ml-1 text-green-600 dark:text-green-400">(Mastered)</span>}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoadmapVisualization;
