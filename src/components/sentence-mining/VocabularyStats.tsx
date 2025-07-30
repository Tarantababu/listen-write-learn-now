
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Eye, Brain } from 'lucide-react';
import { VocabularyStats as VocabularyStatsType } from '@/types/sentence-mining';

interface VocabularyStatsProps {
  stats: VocabularyStatsType;
}

export const VocabularyStats: React.FC<VocabularyStatsProps> = ({ stats }) => {
  const activePercentage = stats.totalWordsEncountered > 0 
    ? Math.round((stats.activeVocabulary / stats.totalWordsEncountered) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Passive Vocabulary</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.passiveVocabulary.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Words you've encountered
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Vocabulary</CardTitle>
          <Brain className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeVocabulary.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Words you can use correctly
          </p>
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              {activePercentage}% mastery
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
