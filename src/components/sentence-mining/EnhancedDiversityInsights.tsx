
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Target, TrendingUp, BarChart3, Lightbulb, RefreshCw } from 'lucide-react';
import { WordDiversityMetrics, WordPoolStats } from '@/services/wordDiversityEngine';

interface EnhancedDiversityInsightsProps {
  diversityMetrics: WordDiversityMetrics | null;
  wordPoolStats: WordPoolStats | null;
  insights: string[];
  exerciseCount: number;
  sessionQuality: number;
}

export const EnhancedDiversityInsights: React.FC<EnhancedDiversityInsightsProps> = ({
  diversityMetrics,
  wordPoolStats,
  insights,
  exerciseCount,
  sessionQuality
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-4">
      {/* Main Diversity Metrics */}
      {diversityMetrics && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5" />
              Learning Diversity Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Diversity</span>
                  <Badge variant={getScoreBadgeVariant(diversityMetrics.overallScore)}>
                    {diversityMetrics.overallScore}%
                  </Badge>
                </div>
                <Progress value={diversityMetrics.overallScore} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Vocabulary Variety</span>
                  <span className={`text-sm font-medium ${getScoreColor(diversityMetrics.vocabularyVariety)}`}>
                    {diversityMetrics.vocabularyVariety}%
                  </span>
                </div>
                <Progress value={diversityMetrics.vocabularyVariety} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Context Diversity</span>
                  <span className={`text-sm font-medium ${getScoreColor(diversityMetrics.contextDiversity)}`}>
                    {diversityMetrics.contextDiversity}%
                  </span>
                </div>
                <Progress value={diversityMetrics.contextDiversity} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Practice Distribution</span>
                  <span className={`text-sm font-medium ${getScoreColor(diversityMetrics.temporalDistribution)}`}>
                    {diversityMetrics.temporalDistribution}%
                  </span>
                </div>
                <Progress value={diversityMetrics.temporalDistribution} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Word Pool Statistics */}
      {wordPoolStats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5" />
              Intelligent Word Pool
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Available Words</span>
                  <span className="text-sm font-bold text-green-600">
                    {wordPoolStats.availableWords}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Ready for practice
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cooling Down</span>
                  <span className="text-sm font-bold text-yellow-600">
                    {wordPoolStats.coolingDownWords}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Recently practiced
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Mastered Words</span>
                  <span className="text-sm font-bold text-blue-600">
                    {wordPoolStats.masteredWords}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  High confidence
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pool Utilization</span>
                  <span className="text-sm font-bold">
                    {Math.round((wordPoolStats.availableWords / wordPoolStats.totalWords) * 100)}%
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {wordPoolStats.totalWords} total words
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Performance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Session Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Exercises</span>
                <span className="text-sm font-bold">
                  {exerciseCount}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Completed this session
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Selection Quality</span>
                <Badge variant={getScoreBadgeVariant(sessionQuality)}>
                  {Math.round(sessionQuality)}%
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                AI word selection
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5" />
              AI Learning Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg"
                >
                  <BarChart3 className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {insight}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3" />
          Diversity metrics update automatically during practice
        </div>
      </div>
    </div>
  );
};
