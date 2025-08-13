
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Brain, Award, Zap } from 'lucide-react';
import { DifficultyLevel } from '@/types/sentence-mining';

interface SessionMetrics {
  currentStreak: number;
  sessionAccuracy: number;
  averageComplexity: number;
  wordsEncountered: number;
  newWordsLearned: number;
  difficulty: DifficultyLevel;
  totalExercises: number;
  correctExercises: number;
}

interface EnhancedProgressTrackerProps {
  metrics: SessionMetrics;
  className?: string;
}

export const EnhancedProgressTracker: React.FC<EnhancedProgressTrackerProps> = ({
  metrics,
  className
}) => {
  const getComplexityLevel = (score: number) => {
    if (score >= 80) return { label: 'High', color: 'text-purple-600', bg: 'bg-purple-100' };
    if (score >= 60) return { label: 'Medium', color: 'text-blue-600', bg: 'bg-blue-100' };
    return { label: 'Low', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 85) return 'text-green-600';
    if (accuracy >= 70) return 'text-blue-600';
    return 'text-orange-600';
  };

  const complexityLevel = getComplexityLevel(metrics.averageComplexity);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Session Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Performance */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-1">
                <Target className="h-4 w-4" />
                Accuracy
              </span>
              <span className={`text-sm font-bold ${getAccuracyColor(metrics.sessionAccuracy)}`}>
                {Math.round(metrics.sessionAccuracy)}%
              </span>
            </div>
            <Progress value={metrics.sessionAccuracy} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-1">
                <Brain className="h-4 w-4" />
                Complexity
              </span>
              <Badge className={`text-xs ${complexityLevel.bg} ${complexityLevel.color}`}>
                {complexityLevel.label}
              </Badge>
            </div>
            <Progress value={metrics.averageComplexity} className="h-2" />
          </div>
        </div>

        {/* Session Stats */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Zap className="h-4 w-4 text-orange-500" />
            </div>
            <div className="text-lg font-bold text-orange-600">{metrics.currentStreak}</div>
            <div className="text-xs text-muted-foreground">Streak</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Award className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-lg font-bold text-blue-600">{metrics.newWordsLearned}</div>
            <div className="text-xs text-muted-foreground">New Words</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Target className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-lg font-bold text-green-600">
              {metrics.correctExercises}/{metrics.totalExercises}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
        </div>

        {/* Difficulty Badge */}
        <div className="flex justify-center pt-2 border-t">
          <Badge variant="outline" className="capitalize">
            {metrics.difficulty} Level Session
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
