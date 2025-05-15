
import React from 'react';
import { useCurriculumPath } from '@/hooks/use-curriculum-path';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle, Circle, XCircle } from 'lucide-react';

const CurriculumPathProgressDashboard: React.FC = () => {
  const { 
    nodes = [], 
    completedNodes = [],
    curriculumPaths = [],
    currentCurriculumPath,
    isLoading
  } = useCurriculumPath();
  
  if (isLoading) {
    return <div className="text-center py-6">Loading progress data...</div>;
  }
  
  if (!currentCurriculumPath) {
    return <div className="text-center py-6">No curriculum path selected.</div>;
  }
  
  // Calculate the progress percentage
  const totalNodes = nodes.length;
  const completedCount = completedNodes.length;
  const progressPercentage = totalNodes > 0 ? Math.round((completedCount / totalNodes) * 100) : 0;
  
  // Find the curriculum path details
  const curriculumPathDetails = curriculumPaths.find(p => p.id === currentCurriculumPath.curriculumPathId);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completed: {completedCount}/{totalNodes} exercises</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Exercises</h3>
        <div className="space-y-2">
          {nodes.map((node) => {
            const isCompleted = completedNodes.includes(node.id);
            const isCurrent = node.id === currentCurriculumPath.currentNodeId;
            
            return (
              <div
                key={node.id}
                className={`p-3 rounded-md border flex justify-between items-center ${
                  isCompleted 
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                    : isCurrent 
                      ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                      : 'bg-background'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : isCurrent ? (
                    <Circle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                  )}
                  <span className={`${isCompleted ? 'text-green-900 dark:text-green-300' : isCurrent ? 'text-blue-900 dark:text-blue-300' : ''}`}>
                    {node.title}
                  </span>
                </div>
                <div>
                  {node.isBonus && (
                    <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 px-2 py-1 rounded">
                      Bonus
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CurriculumPathProgressDashboard;
