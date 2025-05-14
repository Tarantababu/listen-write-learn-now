
import React from 'react';
import { useRoadmap } from '@/hooks/use-roadmap';
import { RoadmapNode } from '@/types';
import { Check, Lock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    selectRoadmap
  } = useRoadmap();
  
  const getNodeStatus = (node: RoadmapNode): 'completed' | 'available' | 'locked' => {
    if (completedNodes.includes(node.id)) {
      return 'completed';
    }

    if (node.id === currentNodeId) {
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
    onNodeSelect(node);
  };

  return (
    <div>
      <h2>{currentRoadmap.name}</h2>
      <p>Current Node ID: {currentNodeId}</p>
      <div>
        {nodes.map((node) => (
          <div key={node.id}>
            <button
              onClick={() => handleNodeClick(node)}
              disabled={getNodeStatus(node) === 'locked'}
              className={cn(
                "p-2 rounded",
                getNodeStatus(node) === 'completed' && "bg-green-500 text-white",
                getNodeStatus(node) === 'available' && "bg-blue-500 text-white",
                getNodeStatus(node) === 'locked' && "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              {node.title}
              {getNodeStatus(node) === 'locked' && <Lock className="inline-block ml-2 h-4 w-4" />}
              {getNodeStatus(node) === 'completed' && <Check className="inline-block ml-2 h-4 w-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoadmapVisualization;
