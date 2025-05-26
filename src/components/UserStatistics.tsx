import React, { useEffect, useState } from "react";
import { format, subMonths } from "date-fns";
import { useExerciseContext } from "@/contexts/ExerciseContext";
import { useVocabularyContext } from "@/contexts/VocabularyContext";
import { useUserSettingsContext } from "@/contexts/UserSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { GraduationCap, Target, Sparkles, ArrowRight, Play, Plus, Compass, Zap, Brain } from "lucide-react";
import LanguageLevelDisplay from "./LanguageLevelDisplay";
import SkeletonUserStats from "./SkeletonUserStats";
import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import { useCurriculumExercises } from "@/hooks/use-curriculum-exercises";
import { isStreakActive } from "@/utils/visitorTracking";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    return text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()[\]"']/g, "").replace(/\s+/g, " ").trim();
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
        } = await supabase.from("user_language_streaks").select("current_streak, longest_streak, last_activity_date").eq("user_id", user.id).eq("language", settings.selectedLanguage).maybeSingle();
        if (streakError) {
          console.error("Error fetching streak data:", streakError);
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
        const threeMonthsAgo = format(subMonths(new Date(), 3), "yyyy-MM-dd");
        const {
          data: activityData,
          error: activityError
        } = await supabase.from("user_daily_activities").select("*").eq("user_id", user.id).eq("language", settings.selectedLanguage).gte("activity_date", threeMonthsAgo).order("activity_date", {
          ascending: false
        });
        if (activityError) {
          console.error("Error fetching daily activity data:", activityError);
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
        } = await supabase.from("completions").select("exercise_id, created_at, accuracy").eq("user_id", user.id).order("created_at", {
          ascending: false
        });
        if (completionError) {
          console.error("Error fetching completion data:", completionError);
        } else {
          const exerciseTexts = exercises.reduce((acc: Record<string, string>, ex) => {
            acc[ex.id] = ex.text;
            return acc;
          }, {});
          const completionItems = completionData.map(completion => ({
            date: new Date(completion.created_at),
            exerciseId: completion.exercise_id,
            accuracy: completion.accuracy,
            words: exerciseTexts[completion.exercise_id] ? normalizeText(exerciseTexts[completion.exercise_id]).split(" ").length : 0
          }));
          setCompletions(completionItems);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
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
    // Check if user has in-progress exercises and navigate accordingly
    if (stats.inProgress > 0) {
      navigate("/dashboard/curriculum?tab=in-progress");
    } else {
      navigate("/dashboard/curriculum");
    }
  };
  const handleCreateOwnExercise = () => {
    setShowStartModal(false);
    navigate("/dashboard/exercises");
  };

  // ENHANCED: Smart recommendation system
  const getSmartRecommendation = () => {
    const hasInProgress = stats.inProgress > 0;
    const hasCompleted = stats.completed > 0;
    const recentActivity = dailyActivities.length > 0 && dailyActivities[0].date.toDateString() === new Date().toDateString();
    if (hasInProgress) {
      return {
        title: "Continue Your Progress",
        description: `You have ${stats.inProgress} exercise${stats.inProgress > 1 ? "s" : ""} in progress. Keep the momentum going!`,
        action: "Continue Learning",
        icon: Play,
        route: "/dashboard/curriculum?tab=in-progress"
      };
    } else if (hasCompleted && !recentActivity) {
      return {
        title: "Keep Your Streak Alive",
        description: "You haven't practiced today yet. A quick session will maintain your progress!",
        action: "Practice Now",
        icon: Zap,
        route: "/dashboard/curriculum?tab=in-progress"
      };
    } else if (hasCompleted) {
      return {
        title: "Ready for More?",
        description: "Great progress! Continue with the next lesson or create a custom exercise.",
        action: "Next Lesson",
        icon: ArrowRight,
        route: "/dashboard/curriculum"
      };
    } else {
      return {
        title: "Start Your Journey",
        description: "Begin with our structured learning plan designed for your success.",
        action: "Start Learning",
        icon: GraduationCap,
        route: "/dashboard/curriculum"
      };
    }
  };

  // ENHANCED: New guidance card component
  const renderEnhancedGuidanceCard = (): React.ReactNode => {
    if (isFirstTimeUser) {
      return null;
    }
    const recommendation = getSmartRecommendation();
    const IconComponent = recommendation.icon;
    return <Card className="w-full border-2 border-[#6F6BF2]/30 bg-gradient-to-r from-[#6F6BF2]/10 via-[#AB96D9]/5 to-[#6F6BF2]/10 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#491BF2]/20 to-transparent rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#AB96D9]/20 to-transparent rounded-full blur-xl" />

        <CardContent className="p-6 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Icon and content */}
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-gradient-to-br from-[#491BF2]/20 to-[#6D49F2]/20 rounded-xl">
                <IconComponent className="h-6 w-6 text-[#491BF2]" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-[#491BF2]" />
                  <span className="text-xs font-medium text-[#491BF2] uppercase tracking-wide">
                    Smart Recommendation
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#1F0459] leading-tight">{recommendation.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{recommendation.description}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:flex-shrink-0">
              <Button onClick={() => navigate(recommendation.route)} className="bg-gradient-to-r from-[#491BF2] to-[#6D49F2] hover:from-[#6D49F2] hover:to-[#6F6BF2] text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                <IconComponent className="h-4 w-4 mr-2" />
                {recommendation.action}
              </Button>
              <Button variant="outline" onClick={() => setShowStartModal(true)} className="border-[#491BF2]/30 hover:border-[#491BF2]/50 hover:bg-[#6F6BF2]/10 text-[#1F0459]">
                <Compass className="h-4 w-4 mr-2" />
                More Options
              </Button>
            </div>
          </div>

          {/* Progress indicator for existing users */}
          {hasStartedLearning && <div className="mt-4 pt-4 border-t border-[#AB96D9]/20">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Overall Progress</span>
                <span>{stats.total > 0 ? Math.round(stats.completed / stats.total * 100) : 0}% Complete</span>
              </div>
              <Progress value={stats.total > 0 ? stats.completed / stats.total * 100 : 0} className="h-2" />
            </div>}
        </CardContent>
      </Card>;
  };

  // ENHANCED: Better modal content with clearer next steps and personalized recommendations
  const renderEnhancedModal = (): React.ReactNode => {
    const recommendation = getSmartRecommendation();
    return <Dialog open={showStartModal} onOpenChange={setShowStartModal}>
        <DialogContent className="sm:max-w-2xl max-w-[95vw] w-full mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-[#1F0459]">
              <Brain className="h-5 w-5 text-[#491BF2]" />
              {isFirstTimeUser ? "Welcome! Let's Get You Started" : "Choose Your Next Learning Step"}
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              {isFirstTimeUser ? "We've designed two paths to help you succeed. Choose the one that fits your learning style:" : "Based on your progress, here are the best ways to continue your language learning journey:"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-6">
            {/* Recommended option - highlighted for existing users */}
            {!isFirstTimeUser && <div className="p-1 bg-gradient-to-r from-[#491BF2]/20 to-[#6D49F2]/20 rounded-lg">
                <div onClick={handleStartLearningPlan} className="p-4 bg-white rounded-lg hover:bg-[#6F6BF2]/5 cursor-pointer transition-all duration-200 group border-2 border-[#491BF2]/30">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-[#491BF2]/20 to-[#6D49F2]/20 rounded-lg group-hover:from-[#491BF2]/30 group-hover:to-[#6D49F2]/30 transition-all">
                      <recommendation.icon className="h-6 w-6 text-[#491BF2]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-[#491BF2] text-white text-xs px-2 py-1 rounded-full font-medium">
                          RECOMMENDED
                        </span>
                        <Sparkles className="h-4 w-4 text-[#491BF2]" />
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-[#1F0459]">{recommendation.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{recommendation.description}</p>
                      <p className="text-sm font-medium text-[#491BF2]">{recommendation.action} →</p>
                    </div>
                  </div>
                </div>
              </div>}

            {/* Structured Learning Path */}
            <div onClick={handleStartLearningPlan} className={`p-4 border-2 ${isFirstTimeUser ? "border-[#6F6BF2]/30 hover:border-[#491BF2]/50" : "border-muted hover:border-[#491BF2]/40"} rounded-lg hover:bg-[#6F6BF2]/5 cursor-pointer transition-all duration-200 group`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 ${isFirstTimeUser ? "bg-gradient-to-br from-[#491BF2]/20 to-[#6D49F2]/20 group-hover:from-[#491BF2]/30 group-hover:to-[#6D49F2]/30" : "bg-muted group-hover:bg-[#491BF2]/20"} rounded-lg transition-all`}>
                  <GraduationCap className={`h-6 w-6 ${isFirstTimeUser ? "text-[#491BF2]" : "text-muted-foreground group-hover:text-[#491BF2]"} transition-colors`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1 text-[#1F0459]">
                    {isFirstTimeUser ? "📚 Guided Learning Plan" : "📚 Continue Learning Plan"}
                  </h3>
                  <div className="space-y-2 mb-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {isFirstTimeUser ? "Perfect for beginners! Follow our step-by-step curriculum designed by language experts." : "Continue with your structured path and track your progress."}
                    </p>
                    {isFirstTimeUser && <div className="flex flex-wrap gap-2 text-xs">
                        <span className="bg-[#6F6BF2]/10 text-[#491BF2] px-2 py-1 rounded-full">✓ Structured</span>
                        <span className="bg-[#6F6BF2]/10 text-[#491BF2] px-2 py-1 rounded-full">✓ Progressive</span>
                        <span className="bg-[#6F6BF2]/10 text-[#491BF2] px-2 py-1 rounded-full">✓ Expert-designed</span>
                      </div>}
                  </div>
                  <p className={`text-sm font-medium ${isFirstTimeUser ? "text-[#491BF2]" : "text-muted-foreground"}`}>
                    {isFirstTimeUser ? "Recommended for beginners →" : "Continue where you left off →"}
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Exercise Path */}
            <div onClick={handleCreateOwnExercise} className="p-4 border-2 border-muted hover:border-[#491BF2]/40 hover:bg-[#6F6BF2]/5 cursor-pointer transition-all duration-200 group">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-muted group-hover:bg-[#491BF2]/20 rounded-lg transition-all">
                  <Plus className="h-6 w-6 text-muted-foreground group-hover:text-[#491BF2] transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1 text-[#1F0459]">🎯 Create Custom Exercise</h3>
                  <div className="space-y-2 mb-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {isFirstTimeUser ? "Jump right in! Create exercises with your own content or specific topics you want to practice." : "Add personalized exercises to supplement your learning plan."}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full">✓ Flexible</span>
                      <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full">✓ Personalized</span>
                      <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full">✓ Your content</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {isFirstTimeUser ? "Great for self-directed learners →" : "Add to your routine →"}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional helpful tip for first-time users */}
            {isFirstTimeUser && <div className="mt-6 p-3 bg-[#AB96D9]/10 rounded-lg border border-[#AB96D9]/30">
                <p className="text-sm text-[#1F0459] text-center">
                  💡 <strong>New to language learning?</strong> Start with the Guided Learning Plan. You can always
                  create custom exercises later!
                </p>
              </div>}

            {/* Progress summary for existing users */}
            {!isFirstTimeUser && <div className="mt-6 p-4 bg-gradient-to-r from-[#6F6BF2]/5 to-[#AB96D9]/5 rounded-lg border border-[#AB96D9]/20">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="h-4 w-4 text-[#491BF2]" />
                  <span className="text-sm font-medium text-[#1F0459]">Your Progress Summary</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-[#491BF2]">{stats.completed}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#6D49F2]">{stats.inProgress}</p>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#AB96D9]">{totalMasteredWords}</p>
                    <p className="text-xs text-muted-foreground">Words Mastered</p>
                  </div>
                </div>
              </div>}
          </div>
        </DialogContent>
      </Dialog>;
  };
  if (showLoading) {
    return <SkeletonUserStats />;
  }

  // Render First-time User Learning Plan Card
  const renderFirstTimeUserCard = (): React.ReactNode => <Card className="w-full border-2 border-[#AB96D9]/30 bg-gradient-to-br from-[#6F6BF2]/10 via-[#6D49F2]/5 to-transparent relative overflow-hidden">
      {/* Decorative elements - Hidden on mobile for cleaner look */}
      <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-bl from-[#491BF2]/20 to-transparent rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-tr from-[#AB96D9]/20 to-transparent rounded-full blur-xl" />

      <CardHeader className="pb-3 sm:pb-4 relative px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-[#491BF2] flex-shrink-0" />
              <CardTitle className="text-xl sm:text-2xl font-bold text-[#1F0459] leading-tight">
                Ready to Start Learning?
              </CardTitle>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md leading-relaxed">
              Choose your path to language mastery. We'll guide you every step of the way.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 relative px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="text-center py-4 sm:py-8 space-y-4 sm:space-y-6">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#491BF2] to-[#6D49F2] rounded-full flex items-center justify-center shadow-lg">
            <GraduationCap className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>

          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-lg sm:text-xl font-bold text-[#1F0459]">Begin Your Language Journey</h3>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed px-4 sm:px-0">
              Start with our structured learning plan designed by language experts, or jump right in by creating your
              own exercises.
            </p>
          </div>

          <Button onClick={() => setShowStartModal(true)} size="lg" className="bg-gradient-to-r from-[#491BF2] to-[#6D49F2] hover:from-[#6D49F2] hover:to-[#6F6BF2] shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-white w-full sm:w-auto px-6 py-3">
            <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Get Started Now
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>;

  // Render Existing User Learning Plan Card
  const renderExistingUserCard = (): React.ReactNode => {};
  return <div className="space-y-6 sm:space-y-8 px-4 sm:px-0">
      {/* Header */}
      <div className="space-y-1 sm:space-y-2"></div>

      {/* ENHANCED GUIDANCE CARD - Replaces the old banner */}
      {renderEnhancedGuidanceCard()}

      {/* Conditional Language Level Display - only show for existing users */}
      {hasStartedLearning && <LanguageLevelDisplay masteredWords={totalMasteredWords} />}

      {/* Learning Plan Progress Card - Adaptive based on user status */}
      {isFirstTimeUser ? renderFirstTimeUserCard() : renderExistingUserCard()}

      {/* Enhanced Start Modal */}
      {renderEnhancedModal()}
    </div>;
};
export default UserStatistics;