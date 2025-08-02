
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { WordMasteryInsights } from '@/components/WordMasteryInsights';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LanguageLevelProgress } from '@/components/LanguageLevelProgress';
import { BookOpen, Target, Zap, Calendar } from 'lucide-react';
import { getUserLevel } from '@/utils/levelSystem';
import { useWordMastery } from '@/hooks/useWordMastery';

interface UserStats {
  totalExercises: number;
  totalBidirectionalExercises: number;
  totalReadingExercises: number;
  totalSentenceMiningExercises: number;
  averageAccuracy: number;
  currentStreak: number;
}

const UserStatistics = () => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the new word mastery hook
  const { stats: wordMasteryStats, isLoading: wordMasteryLoading } = useWordMastery();

  useEffect(() => {
    if (user) {
      fetchUserStats();
    } else {
      setLoading(false);
    }
  }, [user, settings.selectedLanguage]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const language = settings.selectedLanguage;

      // Fetch exercise counts
      const [exercisesResult, bidirectionalResult, readingResult, sentenceMiningResult, streakResult] = await Promise.all([
        // Regular exercises count
        supabase
          .from('exercises')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('language', language)
          .eq('archived', false),
        
        // Bidirectional exercises count
        supabase
          .from('bidirectional_exercises')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('target_language', language),
        
        // Reading exercises count
        supabase
          .from('reading_exercises')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('language', language)
          .eq('archived', false),
        
        // Sentence mining sessions count
        supabase
          .from('sentence_mining_sessions')
          .select('total_exercises, correct_exercises')
          .eq('user_id', user.id)
          .eq('language', language),
        
        // Current streak
        supabase
          .from('user_language_streaks')
          .select('current_streak')
          .eq('user_id', user.id)
          .eq('language', language)
          .maybeSingle()
      ]);

      // Calculate sentence mining stats
      const sentenceMiningSessions = sentenceMiningResult.data || [];
      const totalSentenceMiningExercises = sentenceMiningSessions.reduce((sum, session) => sum + session.total_exercises, 0);
      const totalSentenceMiningCorrect = sentenceMiningSessions.reduce((sum, session) => sum + session.correct_exercises, 0);

      // Calculate overall accuracy (simplified)
      const totalCorrect = totalSentenceMiningCorrect; // Could include other exercise types
      const totalAttempts = totalSentenceMiningExercises; // Could include other exercise types
      const averageAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

      setStats({
        totalExercises: exercisesResult.count || 0,
        totalBidirectionalExercises: bidirectionalResult.count || 0,
        totalReadingExercises: readingResult.count || 0,
        totalSentenceMiningExercises,
        averageAccuracy,
        currentStreak: streakResult.data?.current_streak || 0,
      });
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError('Failed to load user statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading || wordMasteryLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-8 w-1/2 mb-1" />
                <Skeleton className="h-3 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Sign in to view your learning statistics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const userLevel = getUserLevel(wordMasteryStats?.totalMastered || 0);

  return (
    <div className="space-y-6">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Words Mastered</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {wordMasteryStats?.totalMastered?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all exercise types
            </p>
            <div className="mt-2">
              <Badge variant="secondary" className={`text-white ${userLevel.color}`}>
                {userLevel.level}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Exercises</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats?.totalExercises || 0) + 
                (stats?.totalBidirectionalExercises || 0) + 
                (stats?.totalReadingExercises || 0)).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Dictation, Reading & Translation exercises
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sentence Mining</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.totalSentenceMiningExercises || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Exercises completed
            </p>
            {stats && stats.averageAccuracy > 0 && (
              <div className="mt-2">
                <Badge variant="outline">
                  {stats.averageAccuracy}% accuracy
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.currentStreak || 0}</div>
            <p className="text-xs text-muted-foreground">
              Days in a row
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Language Level Progress */}
      <LanguageLevelProgress masteredWords={wordMasteryStats?.totalMastered || 0} />

      {/* Enhanced Word Mastery Insights */}
      <WordMasteryInsights language={settings.selectedLanguage} />
    </div>
  );
};

export default UserStatistics;
