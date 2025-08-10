
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, BookOpen } from 'lucide-react';

interface VocabularyProgressIndicatorProps {
  vocabularyStats: any;
  sessionProgress?: {
    exercisesCompleted: number;
    totalExercises: number;
    newWordsEncountered: number;
    wordsReviewed: number;
  };
}

export const VocabularyProgressIndicator: React.FC<VocabularyProgressIndicatorProps> = ({
  vocabularyStats,
  sessionProgress
}) => {
  if (!vocabularyStats) return null;

  const passivePercentage = vocabularyStats.totalWordsEncountered > 0 
    ? Math.round((vocabularyStats.passiveVocabulary / vocabularyStats.totalWordsEncountered) * 100)
    : 0;

  const activePercentage = vocabularyStats.totalWordsEncountered > 0 
    ? Math.round((vocabularyStats.activeVocabulary / vocabularyStats.totalWordsEncountered) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Passive Vocabulary</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {vocabularyStats.passiveVocabulary}
          </div>
          <div className="flex items-center gap-2">
            <Progress value={passivePercentage} className="flex-1" />
            <Badge variant="outline" className="text-xs">
              {passivePercentage}%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Words you recognize
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Active Vocabulary</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 mb-1">
            {vocabularyStats.activeVocabulary}
          </div>
          <div className="flex items-center gap-2">
            <Progress value={activePercentage} className="flex-1" />
            <Badge variant="outline" className="text-xs">
              {activePercentage}%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Words you can use
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Session Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sessionProgress ? (
              <>
                <div className="flex justify-between text-sm">
                  <span>Exercises:</span>
                  <span className="font-medium">
                    {sessionProgress.exercisesCompleted}/{sessionProgress.totalExercises}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>New words:</span>
                  <Badge variant="secondary" className="text-xs">
                    +{sessionProgress.newWordsEncountered}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Reviewed:</span>
                  <Badge variant="outline" className="text-xs">
                    {sessionProgress.wordsReviewed}
                  </Badge>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Start a session to track progress
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
