
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, Zap, Target } from 'lucide-react';
import { SmartSessionConfig } from '@/services/enhancedAdaptiveDifficultyEngine';
import { DifficultyLevel } from '@/types/sentence-mining';

interface MinimalistSessionStarterProps {
  sessionConfig: SmartSessionConfig | null;
  loadingOptimalDifficulty: boolean;
  isInitializingSession: boolean;
  onStartSession: (difficulty?: DifficultyLevel) => void;
}

export const MinimalistSessionStarter: React.FC<MinimalistSessionStarterProps> = ({
  sessionConfig,
  loadingOptimalDifficulty,
  isInitializingSession,
  onStartSession
}) => {
  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return Zap;
      case 'intermediate': return Brain;
      case 'advanced': return Target;
      default: return Brain;
    }
  };

  const handleStartSession = () => {
    if (!sessionConfig) return;
    
    const validLevels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
    const suggestedDifficulty = sessionConfig.suggestedDifficulty;
    
    if (!validLevels.includes(suggestedDifficulty)) {
      onStartSession();
    } else {
      onStartSession(suggestedDifficulty);
    }
  };

  if (loadingOptimalDifficulty) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-8">
          <div className="flex flex-col items-center justify-center space-y-6 py-12">
            <div className="relative">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="absolute -inset-2 border border-primary/20 rounded-full animate-pulse" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Personalizing Your Session</h3>
              <p className="text-muted-foreground">
                AI is analyzing your progress to find the perfect difficulty level
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sessionConfig) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-8">
          <div className="text-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const DifficultyIcon = getDifficultyIcon(sessionConfig.suggestedDifficulty);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold">Ready to Practice?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Simplified Difficulty Display */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <DifficultyIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-lg capitalize">{sessionConfig.suggestedDifficulty}</div>
              <div className="text-sm text-muted-foreground">Recommended level</div>
            </div>
            <Badge variant="secondary" className="ml-2">
              {Math.round(sessionConfig.confidence * 100)}% match
            </Badge>
          </div>
        </div>

        {/* Single Primary Action */}
        <div className="space-y-4">
          <Button
            onClick={handleStartSession}
            disabled={isInitializingSession}
            className="w-full h-14 text-lg font-semibold"
            size="lg"
          >
            {isInitializingSession ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Starting Session...
              </>
            ) : (
              <>
                <Brain className="h-5 w-5 mr-2" />
                Start Learning
              </>
            )}
          </Button>
          
          {sessionConfig.confidence < 0.7 && (
            <p className="text-center text-sm text-muted-foreground">
              We'll adjust the difficulty as you practice
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
