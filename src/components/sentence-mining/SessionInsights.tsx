
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SentenceMiningProgress, SentenceMiningSession } from '@/types/sentence-mining';
import { Lightbulb, Target, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface SessionInsightsProps {
  progress: SentenceMiningProgress;
  currentSession: SentenceMiningSession | null;
}

export const SessionInsights: React.FC<SessionInsightsProps> = ({
  progress,
  currentSession
}) => {
  const getInsights = () => {
    const insights = [];

    // Streak insights
    if (progress.streak >= 7) {
      insights.push({
        type: 'success',
        icon: CheckCircle,
        title: 'Great Streak!',
        description: `You've maintained a ${progress.streak}-day streak. Keep it up!`,
      });
    } else if (progress.streak === 0) {
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        title: 'Start Your Streak',
        description: 'Practice daily to build momentum and improve retention.',
      });
    }

    // Accuracy insights
    if (progress.averageAccuracy >= 80) {
      insights.push({
        type: 'success',
        icon: Target,
        title: 'High Accuracy',
        description: `Your ${progress.averageAccuracy}% accuracy shows excellent progress!`,
      });
    } else if (progress.averageAccuracy < 60) {
      insights.push({
        type: 'info',
        icon: TrendingUp,
        title: 'Room for Improvement',
        description: 'Consider reviewing vocabulary and practicing more frequently.',
      });
    }

    // Simplified insight for cloze exercises
    if (progress.totalExercises >= 10 && progress.averageAccuracy < 70) {
      insights.push({
        type: 'info',
        icon: Lightbulb,
        title: 'Focus Area',
        description: 'Consider practicing more fill-in-the-blank exercises to improve vocabulary recognition.',
      });
    }

    return insights;
  };

  const insights = getInsights();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Insights & Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Keep practicing to unlock personalized insights!
            </p>
          ) : (
            insights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <Alert key={index} className={`border-l-4 ${
                  insight.type === 'success' ? 'border-l-green-500' :
                  insight.type === 'warning' ? 'border-l-yellow-500' :
                  'border-l-blue-500'
                }`}>
                  <Icon className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">{insight.title}</div>
                      <div className="text-sm">{insight.description}</div>
                    </div>
                  </AlertDescription>
                </Alert>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
