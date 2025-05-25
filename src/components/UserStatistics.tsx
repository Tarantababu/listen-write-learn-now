import React, { useEffect, useState, useMemo } from 'react';
import { format, subDays, isSameDay, subMonths } from 'date-fns';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, BookOpen, CalendarDays, GraduationCap, Target, TrendingUp } from 'lucide-react';
import StatsCard from './StatsCard';
import StatsHeatmap from './StatsHeatmap';
import { getUserLevel, getLevelProgress } from '@/utils/levelSystem';
import LanguageLevelDisplay from './LanguageLevelDisplay';
import { compareWithPreviousDay } from '@/utils/trendUtils';
import SkeletonUserStats from './SkeletonUserStats';
import { useDelayedLoading } from '@/hooks/use-delayed-loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight } from 'lucide-react';
import { useCurriculumExercises } from '@/hooks/use-curriculum-exercises';
import { isStreakActive } from '@/utils/visitorTracking';

interface CompletionData {
  date: Date;
  exerciseId: string;
  accuracy: number;
  words: number;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
}

interface DailyActivity {
  date: Date;
  count: number;
  exercises: number;
  masteredWords: number;
}

const UserStatistics: React.FC = () => {
  const {
    user
  } = useAuth();
  const {
    exercises
  } = useExerciseContext();
  const {
    vocabulary
  } = useVocabularyContext();
  const {
    settings
  } = useUserSettingsContext();
  const [completions, setCompletions] = useState<CompletionData[]>([]);
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null
  });
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([]);
  const [totalMasteredWords, setTotalMasteredWords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Use delayed loading to prevent UI flashing for quick loads
  const showLoading = useDelayedLoading(isLoading, 400);

  // Curriculum data for Learning Curriculum Card
  const {
    stats,
    loading: curriculumLoading,
    refreshData: refreshCurriculumData
  } = useCurriculumExercises();
  const showCurriculumLoading = useDelayedLoading(curriculumLoading, 400);

  // Helper function to normalize text (reused from textComparison.ts)
  const normalizeText = (text: string): string => {
    return text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]"']/g, '').replace(/\s+/g, ' ').trim();
  };

  // Fetch completion and streak data from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setCompletions([]);
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);

        // Fetch user's streak data for current language
        // Using maybeSingle() instead of single() to handle cases where no streak data exists
        const {
          data: streakData,
          error: streakError
        } = await supabase.from('user_language_streaks').select('current_streak, longest_streak, last_activity_date').eq('user_id', user.id).eq('language', settings.selectedLanguage).maybeSingle();
        if (streakError) {
          console.error('Error fetching streak data:', streakError);
        }

        // If streak data exists, use it; otherwise use default values
        if (streakData) {
          // Check if the streak is active based on last activity date
          const streakIsActive = isStreakActive(streakData.last_activity_date ? new Date(streakData.last_activity_date) : null);

          // If streak is broken, set current streak to 0, but keep longest streak
          setStreakData({
            currentStreak: streakIsActive ? streakData.current_streak : 0,
            longestStreak: streakData.longest_streak,
            lastActivityDate: streakData.last_activity_date ? new Date(streakData.last_activity_date) : null
          });
        } else {
          // No streak data found, use default values
          setStreakData({
            currentStreak: 0,
            longestStreak: 0,
            lastActivityDate: null
          });
        }

        // Fetch user's daily activity data
        const threeMonthsAgo = format(subMonths(new Date(), 3), 'yyyy-MM-dd');
        const {
          data: activityData,
          error: activityError
        } = await supabase.from('user_daily_activities').select('*').eq('user_id', user.id).eq('language', settings.selectedLanguage).gte('activity_date', threeMonthsAgo).order('activity_date', {
          ascending: false
        });
        if (activityError) {
          console.error('Error fetching daily activity data:', activityError);
        }
        if (activityData) {
          // Convert database activity data to our format
          const formattedActivities = activityData.map(item => ({
            date: new Date(item.activity_date),
            count: item.activity_count,
            exercises: item.exercises_completed,
            masteredWords: item.words_mastered
          }));
          setDailyActivities(formattedActivities);

          // Calculate the total mastered words by summing up all records
          const totalMastered = activityData.reduce((sum, item) => sum + (item.words_mastered || 0), 0);
          setTotalMasteredWords(totalMastered);
        }

        // Also fetch completion data for backward compatibility
        const {
          data: completionData,
          error: completionError
        } = await supabase.from('completions').select('exercise_id, created_at, accuracy').eq('user_id', user.id).order('created_at', {
          ascending: false
        });
        if (completionError) {
          console.error('Error fetching completion data:', completionError);
        } else {
          const exerciseTexts = exercises.reduce((acc: Record<string, string>, ex) => {
            acc[ex.id] = ex.text;
            return acc;
          }, {});
          const completionItems = completionData.map(completion => ({
            date: new Date(completion.created_at),
            exerciseId: completion.exercise_id,
            accuracy: completion.accuracy,
            words: exerciseTexts[completion.exercise_id] ? normalizeText(exerciseTexts[completion.exercise_id]).split(' ').length : 0
          }));
          setCompletions(completionItems);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [user, exercises, settings.selectedLanguage]);

  // Current language filter
  const currentLanguage = settings.selectedLanguage;

  // Create a set of masteredWords based on the total count for visualization purposes
  // Note: This is a placeholder set just to satisfy the component props
  const masteredWords = new Set(Array(totalMasteredWords).fill(0).map((_, i) => `word${i}`));

  // Note: We're now using the streak data directly from the database
  // and resetting it to 0 if the streak is broken
  const streak = streakData.currentStreak;

  // Heatmap data from daily activities
  const activityHeatmap = useMemo(() => {
    // If we have the new daily activities data, use that directly
    if (dailyActivities.length > 0) {
      return dailyActivities.map(activity => ({
        date: activity.date,
        count: activity.exercises || 0,
        masteredWords: activity.masteredWords || 0
      }));
    }

    // Fallback to the old method if no daily activities data
    const today = new Date();
    const last90Days = Array.from({
      length: 90
    }, (_, i) => subDays(today, i));
    const completionCounts: {
      [key: string]: number;
    } = completions.filter(completion => completion && exercises.find(ex => ex.id === completion.exerciseId)?.language === currentLanguage).reduce((acc: {
      [key: string]: number;
    }, completion) => {
      const dateKey = format(completion.date, 'yyyy-MM-dd');
      acc[dateKey] = (acc[dateKey] || 0) + 1;
      return acc;
    }, {});
    return last90Days.map(date => ({
      date,
      count: completionCounts[format(date, 'yyyy-MM-dd')] || 0,
      masteredWords: 0
    }));
  }, [dailyActivities, completions, exercises, currentLanguage]);

  // Calculate vocabulary trend for today vs yesterday
  const vocabTrend = (() => {
    const vocabularyByDay = vocabulary.filter(item => item.language === currentLanguage).reduce((acc: Record<string, number>, item) => {
      // Use creation date as timestamp
      const dateKey = format(new Date(), 'yyyy-MM-dd');
      acc[dateKey] = (acc[dateKey] || 0) + 1;
      return acc;
    }, {});
    return compareWithPreviousDay(vocabularyByDay);
  })();

  // Refresh curriculum data on component mount
  React.useEffect(() => {
    console.log("UserStatistics: Refreshing curriculum data");
    refreshCurriculumData();
  }, [refreshCurriculumData]);

  if (showLoading) {
    return <SkeletonUserStats />;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Your Learning Journey</h2>
        <p className="text-muted-foreground">
          Track your progress and continue building your language skills
        </p>
      </div>
      
      {/* Language Level Display */}
      <LanguageLevelDisplay masteredWords={totalMasteredWords} />
      
      {/* Featured Learning Plan Progress Card */}
      <Card className="w-full border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-primary" />
                Learning Plan Progress
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Your structured path to language mastery
              </p>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-primary/10 rounded-full">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}%` : '0%'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {showCurriculumLoading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-3 w-full" />
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-2 p-4 rounded-lg border">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          ) : stats.total > 0 ? (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Foundational Exercises</h3>
                  <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {stats.completed} of {stats.total} complete
                  </span>
                </div>
                
                <div className="space-y-2">
                  <Progress 
                    value={stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0} 
                    className="h-3" 
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Progress</span>
                    <span>{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% Complete</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wide">
                        Completed
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                        In Progress
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Remaining
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                      {stats.total - stats.completed - stats.inProgress}
                    </p>
                  </div>
                </div>
              </div>
              
              <Button asChild size="lg" className="w-full">
                <Link to="/dashboard/curriculum" className="flex items-center justify-center gap-2">
                  Continue Learning Plan 
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Start Your Learning Journey</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Explore our comprehensive curriculum designed to take you from beginner to advanced proficiency.
                </p>
              </div>
              <Button asChild size="lg" className="mt-4">
                <Link to="/dashboard/curriculum" className="flex items-center gap-2">
                  Browse Learning Plan 
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Secondary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <StatsCard 
          title="Vocabulary Collection" 
          value={vocabulary.filter(item => item.language === currentLanguage).length} 
          icon={<BookOpen className="text-purple-500" />} 
          description="Words and phrases saved for review" 
          trend={vocabTrend} 
          className="animate-fade-in" 
        />
      </div>
      
      {/* Activity Heatmap */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            Activity Overview
          </h3>
          <p className="text-sm text-muted-foreground">
            Your learning activity over the past 3 months
          </p>
        </div>
        <StatsHeatmap activityData={activityHeatmap} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default UserStatistics;