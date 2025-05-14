
import React from 'react';
import { useRoadmap } from '../hooks/use-hook-imports';
import LevelBadge from '@/components/LevelBadge';
import { Progress } from '@/components/ui/progress';
import { RoadmapItem } from '../types';

interface RoadmapProgressDashboardProps {
  className?: string;
}

const RoadmapProgressDashboard: React.FC<RoadmapProgressDashboardProps> = ({ className }) => {
  const roadmapContext = useRoadmap();
  const nodes = roadmapContext?.nodes || [];
  const roadmaps = roadmapContext?.roadmaps || [];
  const completedNodes = roadmapContext?.completedNodes || [];
  const currentRoadmap = roadmapContext?.currentRoadmap as RoadmapItem;

  // Find the roadmap details
  const roadmapDetails = currentRoadmap?.roadmapId 
    ? roadmaps?.find(r => r.id === currentRoadmap.roadmapId) 
    : null;

  // Calculate completion percentage
  const totalNodes = nodes?.length || 0;
  const completedCount = completedNodes?.length || 0;
  const progressPercentage = totalNodes > 0 ? Math.round((completedCount / totalNodes) * 100) : 0;

  if (!currentRoadmap || !roadmapDetails) {
    return null;
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">{roadmapDetails.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <LevelBadge level={roadmapDetails.level} />
              <span className="text-sm text-muted-foreground">{roadmapDetails.language}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{progressPercentage}%</p>
            <p className="text-sm text-muted-foreground">Complete</p>
          </div>
        </div>
        
        <Progress value={progressPercentage} className="h-2" />
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-2 rounded-md bg-background border">
            <p className="text-lg font-bold">{totalNodes}</p>
            <p className="text-xs text-muted-foreground">Total Lessons</p>
          </div>
          <div className="p-2 rounded-md bg-background border">
            <p className="text-lg font-bold">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="p-2 rounded-md bg-background border">
            <p className="text-lg font-bold">{totalNodes - completedCount}</p>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapProgressDashboard;
