
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SentenceMiningProgress } from '@/types/sentence-mining';
import { Brain, TrendingUp } from 'lucide-react';

interface ExerciseTypeStatsProps {
  progress: SentenceMiningProgress;
}

export const ExerciseTypeStats: React.FC<ExerciseTypeStatsProps> = ({
  progress
}) => {
  // For cloze-only, show simplified stats
  const clozeStats = {
    attempted: progress.totalExercises,
    correct: progress.totalCorrect,
    accuracy: progress.averageAccuracy
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-indigo-500" />
          Exercise Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Fill in the Blank</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {clozeStats.attempted} attempts
                </Badge>
                <Badge 
                  variant={clozeStats.accuracy >= 70 ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {Math.round(clozeStats.accuracy)}% accuracy
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress value={clozeStats.accuracy} className="w-full" />
              </div>
              <div className="text-sm text-muted-foreground">
                {clozeStats.correct}/{clozeStats.attempted}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
