
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Eye, Brain, TrendingUp, AlertTriangle } from 'lucide-react';
import { VocabularyTrackingService, VocabularyClassification } from '@/services/vocabularyTrackingService';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { FlagIcon } from 'react-flag-kit';
import { getLanguageFlagCode, capitalizeLanguage } from '@/utils/languageUtils';

export const EnhancedVocabularyStats: React.FC = () => {
  const { settings } = useUserSettingsContext();
  const [vocabularyStats, setVocabularyStats] = useState<VocabularyClassification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVocabularyStats();
  }, [settings.selectedLanguage]);

  const loadVocabularyStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to view vocabulary statistics');
        return;
      }

      const stats = await VocabularyTrackingService.getVocabularyStats(
        user.id,
        settings.selectedLanguage
      );
      
      setVocabularyStats(stats);
    } catch (err) {
      console.error('Error loading vocabulary stats:', err);
      setError('Failed to load vocabulary statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!vocabularyStats) {
    return null;
  }

  const activePercentage = vocabularyStats.totalWordsEncountered > 0 
    ? Math.round((vocabularyStats.activeVocabulary / vocabularyStats.totalWordsEncountered) * 100)
    : 0;

  const passivePercentage = vocabularyStats.totalWordsEncountered > 0 
    ? Math.round((vocabularyStats.passiveVocabulary / vocabularyStats.totalWordsEncountered) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Language Context Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FlagIcon code={getLanguageFlagCode(settings.selectedLanguage)} size={16} />
        <span>Vocabulary Progress for {capitalizeLanguage(settings.selectedLanguage)}</span>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Words</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vocabularyStats.totalWordsEncountered.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Words encountered in exercises
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passive Vocabulary</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vocabularyStats.passiveVocabulary.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mb-2">
              Words you recognize
            </p>
            <div className="flex items-center gap-2">
              <Progress value={passivePercentage} className="flex-1" />
              <Badge variant="secondary" className="text-xs">
                {passivePercentage}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vocabulary</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vocabularyStats.activeVocabulary.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mb-2">
              Words you can use correctly
            </p>
            <div className="flex items-center gap-2">
              <Progress value={activePercentage} className="flex-1" />
              <Badge variant="secondary" className="text-xs">
                {activePercentage}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mastery Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mastery Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {vocabularyStats.masteryDistribution.beginner}
              </div>
              <div className="text-xs text-muted-foreground">Beginner</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-yellow-600">
                {vocabularyStats.masteryDistribution.intermediate}
              </div>
              <div className="text-xs text-muted-foreground">Intermediate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600">
                {vocabularyStats.masteryDistribution.advanced}
              </div>
              <div className="text-xs text-muted-foreground">Advanced</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {vocabularyStats.masteryDistribution.mastered}
              </div>
              <div className="text-xs text-muted-foreground">Mastered</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Struggling Words Alert */}
      {vocabularyStats.strugglingWords > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium">
                {vocabularyStats.strugglingWords} word{vocabularyStats.strugglingWords > 1 ? 's' : ''} need{vocabularyStats.strugglingWords === 1 ? 's' : ''} extra practice
              </span>
              <Badge variant="outline" className="ml-auto">
                Focus needed
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
