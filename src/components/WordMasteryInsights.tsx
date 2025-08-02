
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useWordMastery } from '@/hooks/useWordMastery';
import { BookOpen, Target, Zap, TrendingUp } from 'lucide-react';
import { getUserLevel, getLevelProgress, getWordsToNextLevel } from '@/utils/levelSystem';
import { Language } from '@/types';

interface WordMasteryInsightsProps {
  language?: Language;
}

export const WordMasteryInsights: React.FC<WordMasteryInsightsProps> = ({ language }) => {
  const { stats, breakdown, recentAchievements, isLoading, error } = useWordMastery(language);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-8 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p>Unable to load word mastery insights</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No word mastery data available</p>
            <p className="text-sm mt-1">Start practicing to see your progress!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const userLevel = getUserLevel(stats.totalMastered);
  const levelProgress = getLevelProgress(stats.totalMastered);
  const wordsToNext = getWordsToNextLevel(stats.totalMastered);

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Words Mastered</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMastered.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all exercise types
            </p>
            <div className="mt-2">
              <Badge variant="secondary" className={`text-white ${userLevel.color}`}>
                {userLevel.level} - {userLevel.title}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Level Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{levelProgress}%</div>
            <p className="text-xs text-muted-foreground">
              {wordsToNext > 0 ? `${wordsToNext.toLocaleString()} words to next level` : 'Max level achieved!'}
            </p>
            <div className="mt-2">
              <Progress value={levelProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mastery Breakdown */}
      {breakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mastery Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {breakdown.map((item) => {
                const sourceName = {
                  'sentence_mining': 'Sentence Mining',
                  'regular_exercises': 'Dictation Exercises',
                  'bidirectional': 'Bidirectional Translation'
                }[item.source];

                const sourceIcon = {
                  'sentence_mining': <Zap className="h-4 w-4" />,
                  'regular_exercises': <BookOpen className="h-4 w-4" />,
                  'bidirectional': <Target className="h-4 w-4" />
                }[item.source];

                return (
                  <div key={item.source} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {sourceIcon}
                        <span className="text-sm font-medium">{sourceName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {item.count.toLocaleString()} words
                        </span>
                        <Badge variant="outline">
                          {item.percentage}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={item.percentage} className="w-full" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAchievements.slice(0, 5).map((achievement, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{achievement.word}</p>
                      <p className="text-xs text-muted-foreground">
                        via {achievement.source.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {achievement.masteredAt.toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
