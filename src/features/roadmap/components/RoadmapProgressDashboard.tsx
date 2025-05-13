
import React from 'react';
import { useRoadmap } from '../hooks/use-hook-imports';
import type { RoadmapItem, RoadmapNode } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress"

const RoadmapProgressDashboard: React.FC = () => {
  const roadmapContext = useRoadmap();
  
  // Safely access properties with type checking
  const nodes = roadmapContext?.nodes || [];
  const roadmaps = roadmapContext?.roadmaps || [];
  const completedNodes = roadmapContext?.completedNodes || [];
  
  // Make sure to check that currentRoadmap is not an array before accessing properties
  const currentRoadmap = roadmapContext?.currentRoadmap;
  
  let roadmapId: string | undefined;
  if (currentRoadmap && !Array.isArray(currentRoadmap)) {
    roadmapId = currentRoadmap.roadmapId;
  }

  // Calculate overall progress
  const overallProgress = nodes.length > 0 ? (completedNodes.length / nodes.length) * 100 : 0;

  return (
    <Card className="border rounded-lg">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Your Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-md font-medium">Overall Progress</h3>
          <Progress value={overallProgress} />
          <p className="text-sm text-muted-foreground">
            {completedNodes.length} / {nodes.length} nodes completed
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoadmapProgressDashboard;
