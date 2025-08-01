
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Eye, Brain, Languages } from 'lucide-react';
import { VocabularyStats as VocabularyStatsType } from '@/types/sentence-mining';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { FlagIcon } from 'react-flag-kit';
import { getLanguageFlagCode, capitalizeLanguage } from '@/utils/languageUtils';

interface VocabularyStatsProps {
  stats: VocabularyStatsType;
}

export const VocabularyStats: React.FC<VocabularyStatsProps> = ({ stats }) => {
  const { settings } = useUserSettingsContext();
  
  const activePercentage = stats.totalWordsEncountered > 0 
    ? Math.round((stats.activeVocabulary / stats.totalWordsEncountered) * 100)
    : 0;

  // Ensure we're showing stats for the correct language
  const isCorrectLanguage = stats.language === settings.selectedLanguage;
  
  if (!isCorrectLanguage) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Language Mismatch</CardTitle>
            <Languages className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Statistics loading for {capitalizeLanguage(settings.selectedLanguage)}...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Language Context Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <FlagIcon code={getLanguageFlagCode(stats.language)} size={16} />
        <span>Statistics for {capitalizeLanguage(stats.language)}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passive Vocabulary</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.passiveVocabulary.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Words you've encountered in {capitalizeLanguage(stats.language)}
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
              Words you can use correctly in {capitalizeLanguage(stats.language)}
            </p>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {activePercentage}% mastery
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
