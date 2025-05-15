
import React from 'react';
import { CurriculumNode, CurriculumNodeProgress } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCurriculum } from '@/hooks/use-curriculum';
import { Lock, CheckCircle, BookOpen, Award, Circle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface CurriculumNodeCardProps {
  node: CurriculumNode;
  progress?: CurriculumNodeProgress;
  isAvailable: boolean;
  onClick: (node: CurriculumNode) => void;
}

const CurriculumNodeCard: React.FC<CurriculumNodeCardProps> = ({ 
  node, 
  progress, 
  isAvailable,
  onClick 
}) => {
  const { nodeLoading } = useCurriculum();
  
  const completionPercentage = progress ? Math.min((progress.completedExerciseCount / 3) * 100, 100) : 0;
  
  // Determine the status and icon
  let statusIcon;
  let statusText;
  
  if (progress?.isCompleted) {
    statusIcon = <CheckCircle className="h-5 w-5 text-green-500" />;
    statusText = 'Completed';
  } else if (!isAvailable) {
    statusIcon = <Lock className="h-5 w-5 text-muted-foreground" />;
    statusText = 'Locked';
  } else if (progress?.completedExerciseCount) {
    statusIcon = <BookOpen className="h-5 w-5 text-amber-500" />;
    statusText = `In Progress (${progress.completedExerciseCount}/3)`;
  } else {
    statusIcon = <Circle className="h-5 w-5 text-muted-foreground" />;
    statusText = 'Not Started';
  }
  
  return (
    <Card className={`transition-all ${
      !isAvailable ? 'opacity-70' : 
      progress?.isCompleted ? 'border-green-500/30' : 
      progress?.completedExerciseCount ? 'border-amber-500/30' : ''
    }`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base flex items-center">
            {node.isBonus && (
              <Award className="h-4 w-4 text-amber-500 mr-2" />
            )}
            {node.title}
          </CardTitle>
          {statusIcon}
        </div>
        <CardDescription className="text-xs">
          {statusText}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="text-sm">
          {node.description || 'Practice this exercise to improve your skills'}
        </div>
        
        {progress && progress.completedExerciseCount > 0 && !progress.isCompleted && (
          <div className="mt-4">
            <Progress value={completionPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {progress.completedExerciseCount}/3 completions
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button
          variant={progress?.isCompleted ? "secondary" : "default"}
          className="w-full"
          disabled={!isAvailable || nodeLoading}
          onClick={() => onClick(node)}
        >
          {progress?.isCompleted ? 'Practice Again' : 'Start Exercise'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CurriculumNodeCard;
