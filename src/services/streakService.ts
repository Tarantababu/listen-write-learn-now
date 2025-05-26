import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, format, isAfter, isSameDay } from 'date-fns';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
  streakActive: boolean;
}

export interface ActivityDay {
  date: Date;
  hasActivity: boolean;
  exerciseCount: number;
}

/**
 * Calculate if streak is active based on last activity
 */
export const isStreakActive = (lastActivityDate: Date | null): boolean => {
  if (!lastActivityDate) return false;
  
  const today = startOfDay(new Date());
  const yesterday = startOfDay(subDays(new Date(), 1));
  const lastActivity = startOfDay(new Date(lastActivityDate));
  
  // Streak is active if last activity was today or yesterday
  return isSameDay(lastActivity, today) || isSameDay(lastActivity, yesterday);
};

/**
 * Get user's streak data for a specific language
 */
export const getUserStreak = async (userId: string, language: string): Promise<StreakData> => {
  try {
    const { data, error } = await supabase
      .from('user_language_streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('language', language)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching streak:', error);
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        streakActive: false
      };
    }

    if (!data) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        streakActive: false
      };
    }

    const lastActivityDate = data.last_activity_date ? new Date(data.last_activity_date) : null;
    const streakActive = isStreakActive(lastActivityDate);

    return {
      currentStreak: streakActive ? data.current_streak : 0,
      longestStreak: data.longest_streak,
      lastActivityDate,
      streakActive
    };
  } catch (error) {
    console.error('Unexpected error fetching streak:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      streakActive: false
    };
  }
};

/**
 * Get activity calendar data for the past few months
 */
export const getActivityCalendar = async (userId: string, language: string, months = 3): Promise<ActivityDay[]> => {
  try {
    const endDate = new Date();
    const startDate = subDays(endDate, months * 30); // Approximate months to days

    const { data, error } = await supabase
      .from('user_daily_activities')
      .select('activity_date, activity_count, exercises_completed')
      .eq('user_id', userId)
      .eq('language', language)
      .gte('activity_date', format(startDate, 'yyyy-MM-dd'))
      .lte('activity_date', format(endDate, 'yyyy-MM-dd'))
      .order('activity_date', { ascending: true });

    if (error) {
      console.error('Error fetching activity calendar:', error);
      return [];
    }

    // Create activity map for quick lookup
    const activityMap = new Map<string, number>();
    data?.forEach(activity => {
      activityMap.set(activity.activity_date, activity.exercises_completed || 0);
    });

    // Generate array of days with activity status
    const activities: ActivityDay[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const exerciseCount = activityMap.get(dateStr) || 0;
      
      activities.push({
        date: new Date(currentDate),
        hasActivity: exerciseCount > 0,
        exerciseCount
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return activities;
  } catch (error) {
    console.error('Unexpected error fetching activity calendar:', error);
    return [];
  }
};

/**
 * Update streak when user completes an exercise
 */
export const updateStreak = async (userId: string, language: string): Promise<void> => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // First, update or create daily activity
    const { error: activityError } = await supabase
      .from('user_daily_activities')
      .upsert({
        user_id: userId,
        language,
        activity_date: today,
        activity_count: 1,
        exercises_completed: 1
      }, {
        onConflict: 'user_id,language,activity_date',
        ignoreDuplicates: false
      });

    if (activityError) {
      console.error('Error updating daily activity:', activityError);
      return;
    }

    // Then update streak data
    const currentStreak = await getUserStreak(userId, language);
    const todayDate = new Date();
    
    let newCurrentStreak = 1;
    
    if (currentStreak.lastActivityDate) {
      const lastActivity = startOfDay(new Date(currentStreak.lastActivityDate));
      const yesterday = startOfDay(subDays(todayDate, 1));
      
      if (isSameDay(lastActivity, yesterday)) {
        // Continue streak
        newCurrentStreak = currentStreak.currentStreak + 1;
      } else if (isSameDay(lastActivity, startOfDay(todayDate))) {
        // Same day, keep current streak
        newCurrentStreak = currentStreak.currentStreak;
      }
      // If more than 1 day gap, streak resets to 1
    }

    const newLongestStreak = Math.max(currentStreak.longestStreak, newCurrentStreak);

    const { error: streakError } = await supabase
      .from('user_language_streaks')
      .upsert({
        user_id: userId,
        language,
        current_streak: newCurrentStreak,
        longest_streak: newLongestStreak,
        last_activity_date: todayDate.toISOString()
      }, {
        onConflict: 'user_id,language',
        ignoreDuplicates: false
      });

    if (streakError) {
      console.error('Error updating streak:', streakError);
    }
  } catch (error) {
    console.error('Unexpected error updating streak:', error);
  }
};
