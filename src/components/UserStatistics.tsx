import React, { useEffect, useState, useMemo } from 'react';
import { format, subDays, isSameDay, subMonths } from 'date-fns';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, BookOpen, CalendarDays, GraduationCap } from 'lucide-react';
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

  // Calculate mastered words trend
  const masteredWordsTrend = (() => {
    // Simulating a small increase from yesterday to today for trend display
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    return compareWithPreviousDay({
      [today]: masteredWords.size,
      [yesterday]: Math.max(0, masteredWords.size - Math.floor(masteredWords.size * 0.02))
    });
  })();

  // Calculate streak trend - update this to handle broken streaks correctly
  const streakTrend = (() => {
    // If streak is 0, it means streak is broken
    if (streak === 0) {
      return {
        value: -100,
        // -100% decrease
        label: 'Streak broken'
      };
    }

    // Otherwise streak is maintained or increased
    return {
      value: 0,
      // 0% change (maintained)
      label: 'Streak maintained'
    };
  })();

  // Refresh curriculum data on component mount
  React.useEffect(() => {
    console.log("UserStatistics: Refreshing curriculum data");
    refreshCurriculumData();
  }, [refreshCurriculumData]);
  if (showLoading) {
    return <SkeletonUserStats />;
  }
  return <div className="space-y-6">
      <h2 className="text-xl font-semibold">Your Language Progress</h2>
      
      {/* Language Level Display */}
      <LanguageLevelDisplay masteredWords={totalMasteredWords} />
      
      {/* Key Statistics Cards - Now including the Curriculum Progress card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatsCard title="Mastered Words" value={totalMasteredWords} icon={<Trophy className="text-amber-500" />} description="Words from exercises completed with 95%+ accuracy at least 3 times" progress={getLevelProgress(totalMasteredWords)} progressColor="bg-gradient-to-r from-amber-500 to-yellow-400" trend={masteredWordsTrend} className="animate-fade-in" />
        
        <StatsCard title="Learning Streak" value={streak} icon={<CalendarDays className="text-green-500" />} description="Consecutive days with high accuracy completions" trend={streakTrend} className="animate-fade-in" />

        <StatsCard title="Vocabulary Items" value={vocabulary.filter(item => item.language === currentLanguage).length} icon={<BookOpen className="text-purple-500" />} description="Words saved to your vocabulary list" trend={vocabTrend} className="animate-fade-in" />
        
        {/* Curriculum Progress Card moved here as requested */}
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xl font-semibold">Learning Plan Progress</CardTitle>
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {showCurriculumLoading ? <div>
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  
                  <Skeleton className="h-2 w-full" />
                  
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
                    {[1, 2, 3].map(i => <div key={i} className="p-2 rounded">
                        <Skeleton className="h-5 w-full mb-1" />
                        <Skeleton className="h-3 w-full" />
                      </div>)}
                  </div>
                </div>
                
                <div className="mt-5">
                  <Skeleton className="h-9 w-full" />
                </div>
              </div> : stats.total > 0 ? <>
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Foundational Exercises</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {stats.completed}/{stats.total} complete
                    </span>
                  </div>
                  
                  <Progress value={stats.total > 0 ? Math.round(stats.completed / stats.total * 100) : 0} className="h-2" />
                  
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded">
                      <p className="font-semibold text-green-600 dark:text-green-400">{stats.completed}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                      <p className="font-semibold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
                      <p className="text-xs text-muted-foreground">In Progress</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/20 p-2 rounded">
                      <p className="font-semibold">{stats.total - stats.completed - stats.inProgress}</p>
                      <p className="text-xs text-muted-foreground">Not Started</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5">
                  <Button asChild variant="default" size="sm" className="w-full">
                    <Link to="/dashboard/curriculum" className="flex items-center justify-center">
                      View Learning Plan <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </> : <div className="py-4">
                <p className="text-center text-muted-foreground mb-4">
                  Explore our comprehensive curriculum of language learning exercises.
                </p>
                <Button asChild variant="default" size="sm" className="w-full">
                  <Link to="/dashboard/curriculum">
                    Browse Learning Plan <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>}
          </CardContent>
        </Card>
      </div>
      
      {/* Activity Heatmap */}
      <StatsHeatmap activityData={activityHeatmap} isLoading={isLoading} />
    </div>;
};
export default UserStatistics;