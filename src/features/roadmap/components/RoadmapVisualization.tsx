
import React from 'react';
import { useRoadmap } from '../context/RoadmapContext';
import { RoadmapNode } from '../types';
import { Loader2 } from 'lucide-react';
import RoadmapPath from './RoadmapPath';
import LevelBadge from '@/components/LevelBadge';

interface RoadmapVisualizationProps {
  onNodeSelect: (node: RoadmapNode) => void;
}

const RoadmapVisualization: React.FC<RoadmapVisualizationProps> = ({ onNodeSelect }) => {
  const { 
    currentRoadmap, 
    nodes, 
    completedNodes,
    isLoading,
    roadmaps 
  } = useRoadmap();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p>Loading roadmap...</p>
      </div>
    );
  }

  if (!currentRoadmap) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">No roadmap selected</p>
      </div>
    );
  }

  // Find the roadmap details using the roadmapId from currentRoadmap
  const roadmapDetails = roadmaps.find(r => r.id === currentRoadmap.roadmapId);
  const roadmapName = roadmapDetails?.name || "Learning Path";
  const roadmapLevel = roadmapDetails?.level;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{roadmapName}</h2>
          <div className="flex items-center mt-1">
            {roadmapLevel && <LevelBadge level={roadmapLevel} className="mr-2" />}
            <span className="text-sm text-muted-foreground">
              {completedNodes.length} of {nodes.length} completed
            </span>
          </div>
        </div>
      </div>

      <RoadmapPath
        nodes={nodes}
        onNodeSelect={onNodeSelect}
      />
    </div>
  );
};

export default RoadmapVisualization;
