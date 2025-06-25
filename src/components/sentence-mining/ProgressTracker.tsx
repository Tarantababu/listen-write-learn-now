
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SentenceMiningProgress, SentenceMiningSession } from '@/types/sentence-mining';
import { Target, Zap, TrendingUp, Calendar } from 'lucide-react';

interface ProgressTrackerProps {
  progress: SentenceMiningProgress | null;
  currentSession: SentenceMiningSession | null;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  progress,
  currentSession,
}) => {
  if (!progress) {
    return null;
  }

  const sessionAccuracy = currentSession 
    ? (currentSession.totalCorrect / Math.max(currentSession.totalAttempts, 1)) * 100
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Exercises</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{progress.totalExercises}</div>
          <p className="text-xs text-muted-foreground">
            {progress.totalCorrect} correct
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overall Accuracy</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(progress.averageAccuracy)}%</div>
          <Progress value={progress.averageAccuracy} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{progress.streak}</div>
          <p className="text-xs text-muted-foreground">
            consecutive correct
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sessions</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{progress.totalSessions}</div>
          <p className="text-xs text-muted-foreground">
            total completed
          </p>
        </CardContent>
      </Card>

      {currentSession && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Current Session
              <Badge variant="outline" className="capitalize">
                {currentSession.difficulty}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium">Exercises Completed</p>
                <p className="text-2xl font-bold">{currentSession.exercises.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Session Accuracy</p>
                <p className="text-2xl font-bold">{Math.round(sessionAccuracy)}%</p>
              </div>
              <div>
                <p className="text-sm font-medium">Correct Answers</p>
                <p className="text-2xl font-bold">
                  {currentSession.totalCorrect}/{currentSession.totalAttempts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
