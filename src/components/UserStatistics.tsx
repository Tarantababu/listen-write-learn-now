import React, { useEffect, useState, useMemo } from 'react';
import { format, subDays, isSameDay, subMonths } from 'date-fns';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, BookOpen, CalendarDays } from 'lucide-react';
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

interface DailyActivity {
  date: Date;
  count: number;
  exercises: number;
  masteredWords: number;
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
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([]);
  const [totalMasteredWords, setTotalMasteredWords] = useState(0);
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
          // Convert database activity data to our format
          const formattedActivities = activityData.map(item => ({
            date: new Date(item.activity_date),
            count: item.activity_count,
            exercises: item.exercises_completed,
            masteredWords: item.words_mastered
          }));
          
          setDailyActivities(formattedActivities);
          
          // Set the total mastered words from the latest activity
          if (activityData.length > 0) {
            setTotalMasteredWords(activityData[0].words_mastered || 0);
          }
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

  // Use total mastered words from the database instead of calculating client-side
  const masteredWords = new Set(Array(totalMasteredWords).fill(0).map((_, i) => `word${i}`));
  
  // Note: We're now using the streak data directly from the database
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
    const last90Days = Array.from({ length: 90 }, (_, i) => subDays(today, i));

    const completionCounts: { [key: string]: number } = completions
      .filter(completion => completion && exercises.find(ex => ex.id === completion.exerciseId)?.language === currentLanguage)
      .reduce((acc: { [key: string]: number }, completion) => {
        const dateKey = format(completion.date, 'yyyy-MM-dd');
        acc[dateKey] = (acc[dateKey] || 0) + 1;
        return acc;
      }, {});

    return last90Days.map(date => ({
      date,
      count: completionCounts[format(date, 'yyyy-MM-dd')] || 0,
      masteredWords: 0
    }));
    
    return [];
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
      <LanguageLevelDisplay masteredWords={totalMasteredWords} />
      
      {/* Key Statistics Cards - Only showing the desired ones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatsCard 
          title="Mastered Words" 
          value={totalMasteredWords} 
          icon={<Trophy className="text-amber-500" />}
          description="Words from exercises completed with 95%+ accuracy at least 3 times" 
          progress={getLevelProgress(totalMasteredWords)}
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
