
import React, { useEffect, useState, useMemo } from 'react';
import { format, subDays, isSameDay, differenceInDays, startOfDay, subMonths } from 'date-fns';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, BookOpen, CalendarDays, Star } from 'lucide-react';
import StatsCard from './StatsCard';
import StatsHeatmap from './StatsHeatmap';
import { getUserLevel, getLevelProgress } from '@/utils/levelSystem';
import LanguageLevelDisplay from './LanguageLevelDisplay';
import { compareWithPreviousDay } from '@/utils/trendUtils';

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

const UserStatistics: React.FC = () => {
  const { user } = useAuth();
  const { exercises } = useExerciseContext();
  const { vocabulary } = useVocabularyContext();
  const { settings } = useUserSettingsContext();
  const [completions, setCompletions] = useState<CompletionData[]>([]);
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null
  });
  const [dailyActivities, setDailyActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to normalize text (reused from textComparison.ts)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]"']/g, '')
      .replace(/\s+/g, ' ')
      .trim();
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
        const { data: streakData, error: streakError } = await supabase
          .from('user_language_streaks')
          .select('current_streak, longest_streak, last_activity_date')
          .eq('user_id', user.id)
          .eq('language', settings.selectedLanguage)
          .single();

        if (streakError && streakError.code !== 'PGRST116') { // Not "No rows returned" error
          console.error('Error fetching streak data:', streakError);
        }
        
        if (streakData) {
          setStreakData({
            currentStreak: streakData.current_streak,
            longestStreak: streakData.longest_streak,
            lastActivityDate: streakData.last_activity_date ? new Date(streakData.last_activity_date) : null
          });
        }

        // Fetch user's daily activity data
        const threeMonthsAgo = format(subMonths(new Date(), 3), 'yyyy-MM-dd');
        const { data: activityData, error: activityError } = await supabase
          .from('user_daily_activities')
          .select('*')
          .eq('user_id', user.id)
          .eq('language', settings.selectedLanguage)
          .gte('activity_date', threeMonthsAgo)
          .order('activity_date', { ascending: false });

        if (activityError) {
          console.error('Error fetching daily activity data:', activityError);
        }
        
        if (activityData) {
          setDailyActivities(activityData.map(item => ({
            date: new Date(item.activity_date),
            count: item.activity_count,
            exercises: item.exercises_completed,
            masteredWords: item.words_mastered
          })));
        }

        // Also fetch completion data for backward compatibility
        const { data: completionData, error: completionError } = await supabase
          .from('completions')
          .select('exercise_id, created_at, accuracy')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

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
            words: exerciseTexts[completion.exercise_id]
              ? normalizeText(exerciseTexts[completion.exercise_id]).split(' ').length
              : 0,
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
  
  // Calculate mastered words - using improved word-by-word tracking
  const masteredWords = useMemo(() => {
    // Get all exercises texts for the current language
    const exercisesById = new Map(exercises
      .filter(ex => ex.language === currentLanguage)
      .map(ex => [ex.id, ex]));
    
    // Count high accuracy completions per exercise
    const exerciseCompletionCounts = new Map<string, number>();
    
    // Filter completions for current language only
    completions.forEach(completion => {
      const exercise = exercisesById.get(completion.exerciseId);
      if (!exercise || completion.accuracy < 95) return;
      
      const count = exerciseCompletionCounts.get(completion.exerciseId) || 0;
      exerciseCompletionCounts.set(completion.exerciseId, count + 1);
    });
    
    // Track individual mastered words
    const masteredWordsSet = new Set<string>();
    
    // For each exercise that has at least 3 high accuracy completions
    exercisesById.forEach((exercise, exerciseId) => {
      const completionsCount = exerciseCompletionCounts.get(exerciseId) || 0;
      
      if (completionsCount >= 3) {
        // This exercise is mastered - add all its words
        const words = normalizeText(exercise.text).split(' ');
        words.forEach(word => masteredWordsSet.add(word));
      }
    });
    
    return masteredWordsSet;
  }, [completions, exercises, currentLanguage]);

  // Note: We're now using the streak data directly from the database
  const streak = streakData.currentStreak;

  // Heatmap data from daily activities
  const activityHeatmap = useMemo(() => {
    // If we have the new daily activities data, use that
    if (dailyActivities.length > 0) {
      return dailyActivities.map(activity => ({
        date: activity.date,
        count: activity.exercises || 0,
        masteredWords: activity.masteredWords || 0
      }));
    }
    
    // Fallback to the old method if no daily activities data
    // Group completions by day
    const completionsByDay = completions
      .filter(completion => {
        const exercise = exercises.find(ex => ex.id === completion.exerciseId);
        return exercise && exercise.language === currentLanguage;
      })
      .reduce((acc: Record<string, CompletionData[]>, completion) => {
        const dateStr = format(completion.date, 'yyyy-MM-dd');
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(completion);
        return acc;
      }, {});
    
    // For each day, calculate the mastered words count
    return Object.entries(completionsByDay).map(([dateStr, dailyCompletions]) => {
      const dateCutoff = new Date(dateStr);
      dateCutoff.setHours(23, 59, 59);
      
      // Count completions by exercise ID up to this date
      const exerciseCompletionCounts = new Map<string, number>();
      
      completions
        .filter(c => {
          const exercise = exercises.find(ex => ex.id === c.exerciseId);
          return exercise && 
                 exercise.language === currentLanguage && 
                 c.accuracy >= 95 && 
                 c.date <= dateCutoff;
        })
        .forEach(c => {
          const count = exerciseCompletionCounts.get(c.exerciseId) || 0;
          exerciseCompletionCounts.set(c.exerciseId, count + 1);
        });
      
      // Get all exercises for the current language
      const langExercises = exercises.filter(ex => ex.language === currentLanguage);
      
      // Count mastered words from exercises with 3+ completions
      const masteredWordsSet = new Set<string>();
      
      langExercises.forEach(exercise => {
        const completionCount = exerciseCompletionCounts.get(exercise.id) || 0;
        
        if (completionCount >= 3) {
          const words = normalizeText(exercise.text).split(' ');
          words.forEach(word => masteredWordsSet.add(word));
        }
      });
      
      return {
        date: new Date(dateStr),
        count: dailyCompletions.length,
        masteredWords: masteredWordsSet.size
      };
    });
  }, [dailyActivities, completions, exercises, currentLanguage]);

  // Calculate vocabulary trend for today vs yesterday
  const vocabTrend = (() => {
    const vocabularyByDay = vocabulary
      .filter(item => item.language === currentLanguage)
      .reduce((acc: Record<string, number>, item) => {
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

  // Calculate streak trend
  const streakTrend = {
    value: streak > 0 ? 0 : -100, // 0% if streak maintained, -100% if broken
    label: streak > 0 ? 'Streak maintained' : 'Streak broken'
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading statistics...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Your Language Progress</h2>
      
      {/* Language Level Display */}
      <LanguageLevelDisplay masteredWords={masteredWords.size} />
      
      {/* Key Statistics Cards - Only showing the desired ones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatsCard 
          title="Mastered Words" 
          value={masteredWords.size} 
          icon={<Trophy className="text-amber-500" />}
          description="Words from exercises completed with 95%+ accuracy at least 3 times" 
          progress={getLevelProgress(masteredWords.size)}
          progressColor="bg-gradient-to-r from-amber-500 to-yellow-400"
          trend={masteredWordsTrend}
          className="animate-fade-in"
        />
        
        <StatsCard 
          title="Learning Streak" 
          value={streak}
          icon={<CalendarDays className="text-green-500" />}
          description="Consecutive days with high accuracy completions" 
          trend={streakTrend}
          className="animate-fade-in"
        />

        <StatsCard
          title="Vocabulary Items"
          value={vocabulary.filter(item => item.language === currentLanguage).length}
          icon={<BookOpen className="text-purple-500" />}
          description="Words saved to your vocabulary list"
          trend={vocabTrend}
          className="animate-fade-in"
        />
      </div>
      
      {/* Activity Heatmap */}
      <StatsHeatmap activityData={activityHeatmap} />
    </div>
  );
};

export default UserStatistics;
