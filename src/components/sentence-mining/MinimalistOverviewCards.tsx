
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, BookOpen, Target } from 'lucide-react';
import { SentenceMiningProgress } from '@/types/sentence-mining';
import { VocabularyStats } from './VocabularyStats';
import { FlagIcon } from 'react-flag-kit';
import { getLanguageFlagCode, capitalizeLanguage } from '@/utils/languageUtils';

interface MinimalistOverviewCardsProps {
  progress: SentenceMiningProgress;
  language: string;
}

export const MinimalistOverviewCards: React.FC<MinimalistOverviewCardsProps> = ({
  progress,
  language
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Vocabulary Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FlagIcon code={getLanguageFlagCode(language)} size={18} />
            <span>{capitalizeLanguage(language)} Words</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VocabularyStats stats={progress.vocabularyStats} />
        </CardContent>
      </Card>

      {/* Progress Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-primary" />
            <span>Your Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{progress.totalSessions}</div>
              <div className="text-xs text-muted-foreground">Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{progress.averageAccuracy}%</div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>
          </div>
          <div className="pt-2 border-t text-center">
            <Badge variant="secondary" className="text-amber-600">
              {progress.streak} day streak
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Learning Stats Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-green-600" />
            <span>Learning Stats</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{progress.totalExercises}</div>
            <div className="text-sm text-muted-foreground">Total exercises completed</div>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            Keep practicing to improve your {language} skills!
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
