
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Zap, Clock } from 'lucide-react';
import { SentenceMiningSession } from '@/types/sentence-mining';

interface MinimalistProgressCardProps {
  session: SentenceMiningSession;
  isGeneratingNext?: boolean;
}

export const MinimalistProgressCard: React.FC<MinimalistProgressCardProps> = ({
  session,
  isGeneratingNext = false
}) => {
  const accuracy = session.total_exercises > 0 
    ? Math.round((session.correct_exercises / session.total_exercises) * 100) 
    : 0;

  const sessionProgress = Math.min((session.total_exercises / 10) * 100, 100);
  const sessionDuration = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 60000);

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="pt-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Your Progress</h3>
          {isGeneratingNext && (
            <Badge variant="secondary" className="animate-pulse">
              Generating...
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Exercise Progress</span>
            <span className="font-medium">{session.total_exercises}/10</span>
          </div>
          <Progress value={sessionProgress} className="h-2" />
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary mr-1" />
            </div>
            <div className="text-2xl font-bold text-primary">{accuracy}%</div>
            <div className="text-xs text-muted-foreground">Accuracy</div>
          </div>
          
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center">
              <Target className="h-4 w-4 text-green-600 mr-1" />
            </div>
            <div className="text-2xl font-bold text-green-600">{session.correct_exercises}</div>
            <div className="text-xs text-muted-foreground">Correct</div>
          </div>
          
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center">
              <Clock className="h-4 w-4 text-muted-foreground mr-1" />
            </div>
            <div className="text-2xl font-bold">{sessionDuration}</div>
            <div className="text-xs text-muted-foreground">Minutes</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
