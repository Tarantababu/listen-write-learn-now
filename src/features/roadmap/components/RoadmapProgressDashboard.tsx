
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useRoadmap } from '@/hooks/use-roadmap'; // This is the correct import path
import { CheckCircle, Circle } from 'lucide-react';

interface RoadmapProgressDashboardProps {
  className?: string;
}

const RoadmapProgressDashboard: React.FC<RoadmapProgressDashboardProps> = ({ className }) => {
  const { currentRoadmap, nodes, completedNodes } = useRoadmap();

  if (!currentRoadmap) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Curriculum Progress</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">No curriculum selected.</p>
        </CardContent>
      </Card>
    );
  }

  const totalNodes = nodes.length;
  const completedCount = completedNodes.length;
  const progressPercentage = totalNodes > 0 ? Math.round((completedCount / totalNodes) * 100) : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Curriculum Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">{currentRoadmap.name}</h3>
            <p className="text-sm text-muted-foreground">
              {completedCount} of {totalNodes} lessons completed
            </p>
          </div>
        </div>
        <Progress value={progressPercentage} />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{progressPercentage}%</span>
          <span>{completedCount}/{totalNodes} Lessons</span>
        </div>
        <div className="mt-2 flex items-center justify-around">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-primary mr-2" />
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
        </div>
      </CardContent>
    </Card>
  );
};

export default RoadmapProgressDashboard;
