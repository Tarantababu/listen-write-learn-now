
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SentenceMiningProgress, SentenceMiningSession } from '@/types/sentence-mining';
import { Target, Zap, TrendingUp, Calendar, Award, BookOpen } from 'lucide-react';

interface ProgressTrackerProps {
  progress: SentenceMiningProgress | null;
  currentSession: SentenceMiningSession | null;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  progress,
  currentSession
}) => {
  console.log('ProgressTracker received progress:', progress);
  console.log('ProgressTracker received currentSession:', currentSession);

  if (!progress) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>No progress data available yet.</p>
              <p className="text-sm mt-2">Start your first session to see your progress!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sessionAccuracy = currentSession 
    ? (currentSession.correct_exercises / Math.max(currentSession.total_exercises, 1) * 100)
    : 0;

  const sessionProgress = currentSession 
    ? (currentSession.total_exercises / 10 * 100) // Assuming 10 exercises per session
    : 0;

  return (
    <div className="space-y-6">
      {/* Current Session Progress */}
      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-blue-500" />
              Current Session Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Exercises Completed</span>
                <Badge variant="outline">
                  {currentSession.total_exercises}/10
                </Badge>
              </div>
              <Progress value={sessionProgress} className="w-full" />
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {currentSession.correct_exercises}
                  </div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(sessionAccuracy)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Streak</span>
              </div>
              <div className="text-2xl font-bold">{progress.streak} days</div>
              <Progress value={Math.min(progress.streak * 10, 100)} className="w-full" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Total Sessions</span>
              </div>
              <div className="text-2xl font-bold">{progress.totalSessions}</div>
              <div className="text-sm text-muted-foreground">
                {progress.totalExercises} exercises completed
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Words Learned</span>
              </div>
              <div className="text-2xl font-bold">{progress.wordsLearned || 0}</div>
              <div className="text-sm text-muted-foreground">
                {progress.averageAccuracy}% average accuracy
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Difficulty Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-indigo-500" />
            Difficulty Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(progress.difficultyProgress).map(([difficulty, stats]) => (
              <div key={difficulty} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{difficulty}</span>
                  <Badge variant="outline">
                    {stats.accuracy}% accuracy
                  </Badge>
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
