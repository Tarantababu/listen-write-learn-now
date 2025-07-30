
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SentenceMiningSession } from '@/types/sentence-mining';
import { Target, CheckCircle, XCircle } from 'lucide-react';

interface SessionStatsProps {
  session: SentenceMiningSession;
}

export const SessionStats: React.FC<SessionStatsProps> = ({ session }) => {
  const accuracy = session.total_exercises > 0 
    ? Math.round((session.correct_exercises / session.total_exercises) * 100)
    : 0;

  const progressValue = Math.min((session.total_exercises / 10) * 100, 100);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-blue-500" />
          Session Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progress</span>
            <Badge variant="outline">
              {session.total_exercises}/10 exercises
            </Badge>
          </div>
          <Progress value={progressValue} className="w-full" />
          
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {session.correct_exercises}
                </div>
                <div className="text-xs text-muted-foreground">Correct</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <div className="text-lg font-semibold text-red-600">
                  {session.total_exercises - session.correct_exercises}
                </div>
                <div className="text-xs text-muted-foreground">Incorrect</div>
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {accuracy}%
              </div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
