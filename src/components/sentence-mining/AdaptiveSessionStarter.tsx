
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Brain, Zap, Target, TrendingUp } from 'lucide-react';
import { SmartSessionConfig } from '@/services/enhancedAdaptiveDifficultyEngine';

interface AdaptiveSessionStarterProps {
  sessionConfig: SmartSessionConfig | null;
  loadingOptimalDifficulty: boolean;
  isInitializingSession: boolean;
  onStartSession: () => void;
}

export const AdaptiveSessionStarter: React.FC<AdaptiveSessionStarterProps> = ({
  sessionConfig,
  loadingOptimalDifficulty,
  isInitializingSession,
  onStartSession
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-blue-500';
      case 'advanced': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return Zap;
      case 'intermediate': return Brain;
      case 'advanced': return Target;
      default: return Brain;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loadingOptimalDifficulty) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin" />
              <div className="absolute -inset-4 border-2 border-blue-200 dark:border-blue-800 rounded-full animate-pulse opacity-30" />
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-medium">Analyzing Your Performance</h3>
              <p className="text-sm text-muted-foreground">
                AI is determining the optimal difficulty level for your next session...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sessionConfig) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Unable to analyze optimal difficulty. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const DifficultyIcon = getDifficultyIcon(sessionConfig.suggestedDifficulty);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          AI-Recommended Session
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recommended Difficulty Display */}
        <div className="text-center space-y-4">
          <div className="flex flex-col items-center space-y-3">
            <div className={`w-16 h-16 rounded-full ${getDifficultyColor(sessionConfig.suggestedDifficulty)} flex items-center justify-center`}>
              <DifficultyIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold capitalize">{sessionConfig.suggestedDifficulty}</h3>
              <p className="text-sm text-muted-foreground">Recommended Difficulty</p>
            </div>
          </div>

          {/* Confidence Indicator */}
          <div className="flex items-center justify-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">AI Confidence:</span>
            <Badge 
              variant="outline" 
              className={`${getConfidenceColor(sessionConfig.confidence)} font-medium`}
            >
              {Math.round(sessionConfig.confidence * 100)}%
            </Badge>
          </div>
        </div>

        {/* AI Reasoning */}
        {sessionConfig.reasoning.length > 0 && (
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Why this difficulty?</div>
                <ul className="text-sm space-y-1">
                  {sessionConfig.reasoning.map((reason, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Start Session Button */}
        <div className="pt-4">
          <Button
            onClick={onStartSession}
            disabled={isInitializingSession}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {isInitializingSession ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Initializing Session...
              </>
            ) : (
              <>
                <Brain className="h-5 w-5 mr-2" />
                Start Adaptive Session
              </>
            )}
          </Button>
        </div>

        {/* Confidence Notice */}
        {sessionConfig.confidence < 0.6 && (
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Note:</strong> Limited performance data available. The system will adapt quickly as you practice.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
