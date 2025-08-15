
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, Clock, Award, Brain } from 'lucide-react';
import { AdaptiveLearningInsights as InsightsType } from '@/services/adaptiveLearningEngine';

interface AdaptiveLearningInsightsProps {
  insights: InsightsType;
  className?: string;
}

export const AdaptiveLearningInsights: React.FC<AdaptiveLearningInsightsProps> = ({
  insights,
  className = ""
}) => {
  const getPerformanceLevelColor = (level: string) => {
    switch (level) {
      case 'struggling': return 'text-red-600 bg-red-50';
      case 'improving': return 'text-orange-600 bg-orange-50';
      case 'proficient': return 'text-blue-600 bg-blue-50';
      case 'mastering': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPerformanceLevelIcon = (level: string) => {
    switch (level) {
      case 'struggling': return <Target className="h-4 w-4" />;
      case 'improving': return <TrendingUp className="h-4 w-4" />;
      case 'proficient': return <Brain className="h-4 w-4" />;
      case 'mastering': return <Award className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Performance Level */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg ${getPerformanceLevelColor(insights.performanceLevel)}`}>
            {getPerformanceLevelIcon(insights.performanceLevel)}
          </div>
          <div>
            <h3 className="font-semibold capitalize">Performance Level</h3>
            <Badge variant="outline" className={getPerformanceLevelColor(insights.performanceLevel)}>
              {insights.performanceLevel}
            </Badge>
          </div>
        </div>

        {/* Progress Metrics */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Accuracy Trend</span>
              <span className={`flex items-center gap-1 ${
                insights.progressMetrics.accuracyTrend > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {insights.progressMetrics.accuracyTrend > 0 ? 
                  <TrendingUp className="h-3 w-3" /> : 
                  <TrendingDown className="h-3 w-3" />
                }
                {Math.abs(insights.progressMetrics.accuracyTrend)}%
              </span>
            </div>
            <Progress value={Math.abs(insights.progressMetrics.accuracyTrend) * 10} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Consistency</span>
              <span className="font-medium">{insights.progressMetrics.consistencyScore}%</span>
            </div>
            <Progress value={insights.progressMetrics.consistencyScore} className="h-2" />
          </div>
        </div>
      </Card>

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Recommendations
          </h3>
          <div className="space-y-3">
            {insights.recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-foreground">{rec.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {rec.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(rec.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Next Session Suggestion */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Next Session
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Suggested Difficulty</span>
            <Badge variant="outline" className="capitalize">
              {insights.nextSessionSuggestion.difficulty}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estimated Duration</span>
            <span className="text-sm font-medium">
              {insights.nextSessionSuggestion.estimatedDuration} min
            </span>
          </div>
          {insights.nextSessionSuggestion.focusWords.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground">Focus Words</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {insights.nextSessionSuggestion.focusWords.slice(0, 4).map((word, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {word}
                  </Badge>
                ))}
                {insights.nextSessionSuggestion.focusWords.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{insights.nextSessionSuggestion.focusWords.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
