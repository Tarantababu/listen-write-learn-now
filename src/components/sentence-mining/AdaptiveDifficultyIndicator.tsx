
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Target, Lightbulb } from 'lucide-react';
import { DifficultyLevel } from '@/types/sentence-mining';
import { AdaptiveDifficultyEngine, DifficultyAnalysis } from '@/services/adaptiveDifficultyEngine';

interface AdaptiveDifficultyIndicatorProps {
  userId: string;
  language: string;
  currentDifficulty: DifficultyLevel;
  onDifficultyChange?: (newDifficulty: DifficultyLevel) => void;
}

export const AdaptiveDifficultyIndicator: React.FC<AdaptiveDifficultyIndicatorProps> = ({
  userId,
  language,
  currentDifficulty,
  onDifficultyChange
}) => {
  const [analysis, setAnalysis] = useState<DifficultyAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);

  useEffect(() => {
    analyzeDifficulty();
  }, [userId, language, currentDifficulty]);

  const analyzeDifficulty = async () => {
    if (!userId || !language) return;
    
    setLoading(true);
    try {
      const result = await AdaptiveDifficultyEngine.analyzeUserPerformance(
        userId,
        language,
        currentDifficulty
      );
      setAnalysis(result);
      setShowSuggestion(result.shouldAdjust);
    } catch (error) {
      console.error('Error analyzing difficulty:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptSuggestion = () => {
    if (analysis && onDifficultyChange) {
      onDifficultyChange(analysis.suggestedLevel);
      AdaptiveDifficultyEngine.recordDifficultyAdjustment(
        userId,
        language,
        analysis.currentLevel,
        analysis.suggestedLevel,
        'User accepted AI suggestion'
      );
      setShowSuggestion(false);
    }
  };

  const handleDismissSuggestion = () => {
    setShowSuggestion(false);
  };

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSuggestionIcon = () => {
    if (!analysis) return <Target className="h-4 w-4" />;
    
    if (analysis.suggestedLevel === 'advanced' && analysis.currentLevel !== 'advanced') {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (analysis.suggestedLevel === 'beginner' && analysis.currentLevel !== 'beginner') {
      return <TrendingDown className="h-4 w-4 text-blue-600" />;
    }
    return <Lightbulb className="h-4 w-4 text-yellow-600" />;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Analyzing performance...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" />
            Adaptive Difficulty
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Level</span>
            <Badge 
              variant="outline" 
              className={`${getDifficultyColor(currentDifficulty)} text-white border-none capitalize`}
            >
              {currentDifficulty}
            </Badge>
          </div>
          
          {analysis && (
            <div className="mt-3 text-xs text-muted-foreground">
              <div>Confidence: {Math.round(analysis.confidence * 100)}%</div>
            </div>
          )}
        </CardContent>
      </Card>

      {showSuggestion && analysis && (
        <Alert className="border-l-4 border-l-blue-500">
          <div className="flex items-start gap-2">
            {getSuggestionIcon()}
            <div className="flex-1">
              <AlertDescription>
                <div className="space-y-3">
                  <div>
                    <strong className="text-sm">AI Suggestion:</strong>
                    <div className="text-sm mt-1">
                      Switch to <span className="font-medium capitalize">{analysis.suggestedLevel}</span> difficulty
                    </div>
                  </div>
                  
                  <div className="text-xs space-y-1">
                    {analysis.reasons.map((reason, index) => (
                      <div key={index} className="flex items-start gap-1">
                        <span className="text-muted-foreground">•</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={handleAcceptSuggestion}
                      className="text-xs h-7"
                    >
                      Accept
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleDismissSuggestion}
                      className="text-xs h-7"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}
    </div>
  );
};
