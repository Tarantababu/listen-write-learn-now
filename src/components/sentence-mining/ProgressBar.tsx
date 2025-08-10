
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  progress: {
    correct: number;
    total: number;
  };
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const percentage = progress.total > 0 ? (progress.correct / progress.total) * 100 : 0;
  
  return (
    <div className="space-y-2">
      <Progress value={percentage} className="w-full" />
      <div className="text-sm text-muted-foreground text-center">
        {progress.correct} / {progress.total} correct ({Math.round(percentage)}%)
      </div>
    </div>
  );
};
