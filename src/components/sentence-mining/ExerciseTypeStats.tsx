
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SentenceMiningProgress } from '@/types/sentence-mining';
import { Languages, CheckSquare, BookOpen, Brain, TrendingUp } from 'lucide-react';

interface ExerciseTypeStatsProps {
  progress: SentenceMiningProgress;
}

export const ExerciseTypeStats: React.FC<ExerciseTypeStatsProps> = ({
  progress
}) => {
  const exerciseTypeIcons = {
    translation: Languages,
    multiple_choice: CheckSquare,
    vocabulary_marking: BookOpen,
    cloze: Brain,
  };

  const exerciseTypeColors = {
    translation: 'text-blue-500',
    multiple_choice: 'text-green-500',
    vocabulary_marking: 'text-purple-500',
    cloze: 'text-orange-500',
  };

  const exerciseTypeNames = {
    translation: 'Translation',
    multiple_choice: 'Multiple Choice',
    vocabulary_marking: 'Vocabulary Marking',
    cloze: 'Fill in the Blank',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-indigo-500" />
          Exercise Type Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(progress.exerciseTypeProgress).map(([type, stats]) => {
            const Icon = exerciseTypeIcons[type as keyof typeof exerciseTypeIcons];
            const colorClass = exerciseTypeColors[type as keyof typeof exerciseTypeColors];
            const name = exerciseTypeNames[type as keyof typeof exerciseTypeNames];
            
            return (
              <div key={type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${colorClass}`} />
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {stats.attempted} attempts
                    </Badge>
                    <Badge 
                      variant={stats.accuracy >= 70 ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {stats.accuracy}% accuracy
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Progress value={stats.accuracy} className="w-full" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stats.correct}/{stats.attempted}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
