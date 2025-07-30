
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Clock, Zap } from 'lucide-react';
import { SentenceMiningSession } from '@/types/sentence-mining';

interface EnhancedProgressIndicatorProps {
  session: SentenceMiningSession;
  isGeneratingNext?: boolean;
}

export const EnhancedProgressIndicator: React.FC<EnhancedProgressIndicatorProps> = ({
  session,
  isGeneratingNext = false
}) => {
  const accuracy = session.total_exercises > 0 
    ? Math.round((session.correct_exercises / session.total_exercises) * 100) 
    : 0;

  const sessionProgress = Math.min((session.total_exercises / 10) * 100, 100); // Assuming 10 exercises per session

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="h-4 w-4" />
          Session Progress
          {isGeneratingNext && (
            <Badge variant="secondary" className="ml-auto">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                Generating
              </div>
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Session Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Exercises
            </span>
            <span className="font-medium">{session.total_exercises}</span>
          </div>
          <Progress value={sessionProgress} className="h-2" />
        </div>

        {/* Accuracy */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Accuracy
            </span>
            <span className={`font-medium ${
              accuracy >= 80 ? 'text-green-600' : accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {accuracy}%
            </span>
          </div>
          <Progress 
            value={accuracy} 
            className="h-2"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {session.correct_exercises}
            </div>
            <div className="text-xs text-green-700 dark:text-green-300">Correct</div>
          </div>
          
          <div className="text-center p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <div className="text-lg font-semibold text-red-600 dark:text-red-400">
              {session.total_exercises - session.correct_exercises}
            </div>
            <div className="text-xs text-red-700 dark:text-red-300">Incorrect</div>
          </div>
        </div>

        {/* Session Duration */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Session Time
          </span>
          <span>{Math.floor((Date.now() - new Date(session.started_at).getTime()) / 60000)} min</span>
        </div>
      </CardContent>
    </Card>
  );
};
