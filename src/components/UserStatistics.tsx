import React, { useEffect, useState, useMemo } from 'react';
import { format, subDays, isSameDay, subMonths } from 'date-fns';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, BookOpen, CalendarDays, GraduationCap, Target, TrendingUp, Sparkles, ArrowRight, Play, Plus, X } from 'lucide-react';
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
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight } from 'lucide-react';
import { useCurriculumExercises } from '@/hooks/use-curriculum-exercises';
import { isStreakActive } from '@/utils/visitorTracking';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  const navigate = useNavigate();
  const [completions, setCompletions] = useState<CompletionData[]>([]);
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null
  });
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([]);
  const [totalMasteredWords, setTotalMasteredWords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showStartModal, setShowStartModal] = useState(false);

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

  // Determine if user is a first-time user (no progress on curriculum)
  const isFirstTimeUser = stats.completed === 0 && stats.inProgress === 0;
  const hasStartedLearning = stats.completed > 0 || stats.inProgress > 0;

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

  // Refresh curriculum data on component mount
  React.useEffect(() => {
    console.log("UserStatistics: Refreshing curriculum data");
    refreshCurriculumData();
  }, [refreshCurriculumData]);

  // Handle modal actions
  const handleStartLearningPlan = () => {
    setShowStartModal(false);
    navigate('/dashboard/curriculum');
  };

  const handleCreateOwnExercise = () => {
    setShowStartModal(false);
    navigate('/dashboard/exercises');
  };

  if (showLoading) {
    return <SkeletonUserStats />;
  }

  // Render First-time User Learning Plan Card
  const renderFirstTimeUserCard = () => (
    <Card className="w-full border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-secondary/20 to-transparent rounded-full blur-xl" />
      
      <CardHeader className="pb-4 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              <CardTitle className="text-2xl font-bold">
                Ready to Start Learning?
              </CardTitle>
            </div>
            <p className="text-muted-foreground max-w-md">
              Choose your path to language mastery. We'll guide you every step of the way.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 relative">
        <div className="text-center py-8 space-y-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xl font-bold">Begin Your Language Journey</h3>
            <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Start with our structured learning plan designed by language experts, or jump right in by creating your own exercises.
            </p>
          </div>

          <Button 
            onClick={() => setShowStartModal(true)}
            size="lg" 
            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Render Existing User Learning Plan Card
  const renderExistingUserCard = () => (
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
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1 bg-primary/10 rounded-full">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}%` : '0%'}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowStartModal(true)}
              className="hover:bg-primary/5 hover:border-primary/40"
            >
              <Plus className="h-4 w-4 mr-1" />
              Options
            </Button>
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
        ) : (
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
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          {isFirstTimeUser ? "Welcome to Your Language Journey" : "Your Learning Journey"}
        </h2>
        <p className="text-muted-foreground">
          {isFirstTimeUser 
            ? "Let's get you started on the path to language mastery" 
            : "Track your progress and continue building your language skills"
          }
        </p>
      </div>
      
      {/* Conditional Language Level Display - only show for existing users */}
      {hasStartedLearning && <LanguageLevelDisplay masteredWords={totalMasteredWords} />}
      
      {/* Learning Plan Progress Card - Adaptive based on user status */}
      {isFirstTimeUser ? renderFirstTimeUserCard() : renderExistingUserCard()}

      {/* Start Modal - Now available for all users */}
      <Dialog open={showStartModal} onOpenChange={setShowStartModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              Choose Your Learning Path
            </DialogTitle>
            <DialogDescription className="text-base">
              {isFirstTimeUser 
                ? "How would you like to begin your language learning journey?"
                : "Continue with your current path or try something new"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-6">
            <div 
              onClick={handleStartLearningPlan}
              className="p-4 border-2 border-primary/20 rounded-lg hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all duration-200 group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Play className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    {isFirstTimeUser ? "Start with Learning Plan" : "Continue Learning Plan"}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isFirstTimeUser 
                      ? "Follow our expertly designed curriculum with structured exercises and progressive difficulty."
                      : "Continue with your structured curriculum and track your progress."
                    }
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>

            <div 
              onClick={handleCreateOwnExercise}
              className="p-4 border-2 border-muted hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all duration-200 group rounded-lg"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted group-hover:bg-primary/20 rounded-lg transition-colors">
                  <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Create Your Own Exercise</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isFirstTimeUser 
                      ? "Jump right in by creating custom exercises tailored to your specific learning needs."
                      : "Create additional custom exercises to supplement your learning plan."
                    }
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserStatistics;