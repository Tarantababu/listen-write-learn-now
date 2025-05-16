
import React from 'react';
import { useRoadmap } from '@/hooks/use-roadmap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { RoadmapItem } from '../types';

export const RoadmapProgressDashboard = () => {
  const { currentRoadmap, nodes, completedNodes, roadmaps } = useRoadmap();
  
  if (!currentRoadmap) {
    return (
      <div className="flex justify-center items-center h-24">
        <p className="text-muted-foreground">No roadmap selected</p>
      </div>
    );
  }
  
  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex justify-center items-center h-24">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p>Loading nodes...</p>
      </div>
    );
  }
  
  // Find the roadmap details from the roadmaps array
  const roadmapDetails = roadmaps.find(r => r.id === currentRoadmap.roadmapId);
  const roadmapName = roadmapDetails?.name || "Learning Path";
  
  const totalNodes = nodes.length;
  const completedCount = completedNodes.length;
  const completionPercentage = Math.round((completedCount / totalNodes) * 100);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={completionPercentage} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{completionPercentage}% Complete</span>
              <span>{completedCount} of {totalNodes} lessons</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Individual Nodes Progress */}
        {nodes.map((node) => {
          const isCompleted = completedNodes.includes(node.id);
          return (
            <Card key={node.id} className={isCompleted ? "border-green-500/50" : ""}>
              <CardHeader className="p-4">
                <CardTitle className="text-base flex items-center">
                  <span className="mr-2">{node.position + 1}.</span>
                  {node.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{isCompleted ? 'Completed' : 'Not completed'}</span>
                  {node.isBonus && <span className="text-amber-500">Bonus</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RoadmapProgressDashboard;
