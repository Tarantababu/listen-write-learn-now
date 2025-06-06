
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, format, isAfter, isSameDay, differenceInDays } from 'date-fns';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
  streakActive: boolean;
  isAtRisk: boolean; // New field to track if streak is at risk
  riskHoursRemaining?: number; // Hours until streak is lost
}

export interface ActivityDay {
  date: Date;
  hasActivity: boolean;
  exerciseCount: number;
}

/**
 * Get user's timezone offset in minutes
 */
const getUserTimezoneOffset = (): number => {
  return new Date().getTimezoneOffset();
};

/**
 * Convert UTC date to user's local timezone start of day
 */
const toLocalStartOfDay = (date: Date): Date => {
  const localDate = new Date(date.getTime() - (getUserTimezoneOffset() * 60000));
  return startOfDay(localDate);
};

/**
 * Get current local date (start of day in user's timezone)
 */
const getCurrentLocalDate = (): Date => {
  return toLocalStartOfDay(new Date());
};

/**
 * Check if streak is active and at risk
 */
export const analyzeStreakStatus = (lastActivityDate: Date | null): { isActive: boolean; isAtRisk: boolean; hoursRemaining?: number } => {
  if (!lastActivityDate) {
    return { isActive: false, isAtRisk: false };
  }
  
  const now = new Date();
  const today = getCurrentLocalDate();
  const yesterday = subDays(today, 1);
  const lastActivity = toLocalStartOfDay(lastActivityDate);
  
  // Check if last activity was today
  if (isSameDay(lastActivity, today)) {
    return { isActive: true, isAtRisk: false };
  }
  
  // Check if last activity was yesterday (streak is at risk)
  if (isSameDay(lastActivity, yesterday)) {
    // Calculate hours remaining until midnight (grace period ends)
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    const hoursRemaining = Math.max(0, Math.ceil((endOfToday.getTime() - now.getTime()) / (1000 * 60 * 60)));
    
    return { 
      isActive: true, 
      isAtRisk: true, 
      hoursRemaining 
    };
  }
  
  // Streak is broken
  return { isActive: false, isAtRisk: false };
};

/**
 * Calculate streak by counting backwards from today
 */
const calculateStreakFromActivities = async (userId: string, language: string): Promise<{ currentStreak: number; activities: ActivityDay[] }> => {
  try {
    // Get activities for the past 100 days to ensure we capture the full streak
    const endDate = getCurrentLocalDate();
    const startDate = subDays(endDate, 100);

    const { data, error } = await supabase
      .from('user_daily_activities')
      .select('activity_date, exercises_completed')
      .eq('user_id', userId)
      .eq('language', language)
      .gte('activity_date', format(startDate, 'yyyy-MM-dd'))
      .lte('activity_date', format(endDate, 'yyyy-MM-dd'))
      .order('activity_date', { ascending: false }); // Order by most recent first

    if (error) {
      console.error('Error fetching activities for streak calculation:', error);
      return { currentStreak: 0, activities: [] };
    }

    // Create a map of activities by date for quick lookup
    const activityMap = new Map<string, number>();
    (data || []).forEach(activity => {
      activityMap.set(activity.activity_date, activity.exercises_completed || 0);
    });

    // Count streak backwards from today
    let streakCount = 0;
    let currentDate = getCurrentLocalDate();
    const activities: ActivityDay[] = [];

    // Check if user has activity today first
    const todayStr = format(currentDate, 'yyyy-MM-dd');
    const todayActivity = activityMap.get(todayStr) || 0;
    
    if (todayActivity > 0) {
      streakCount = 1;
      activities.push({
        date: new Date(currentDate),
        hasActivity: true,
        exerciseCount: todayActivity
      });
      
      // Count backwards from yesterday
      currentDate = subDays(currentDate, 1);
      
      // Continue counting backwards
      for (let i = 0; i < 99; i++) { // Limit to prevent infinite loops
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const exerciseCount = activityMap.get(dateStr) || 0;
        
        activities.push({
          date: new Date(currentDate),
          hasActivity: exerciseCount > 0,
          exerciseCount
        });
        
        if (exerciseCount > 0) {
          streakCount++;
          currentDate = subDays(currentDate, 1);
        } else {
          // Streak is broken, stop counting
          break;
        }
      }
    } else {
      // No activity today, check if there was activity yesterday (grace period)
      const yesterdayDate = subDays(currentDate, 1);
      const yesterdayStr = format(yesterdayDate, 'yyyy-MM-dd');
      const yesterdayActivity = activityMap.get(yesterdayStr) || 0;
      
      if (yesterdayActivity > 0) {
        // Grace period - streak continues from yesterday
        streakCount = 1;
        activities.push({
          date: new Date(yesterdayDate),
          hasActivity: true,
          exerciseCount: yesterdayActivity
        });
        
        // Count backwards from day before yesterday
        currentDate = subDays(yesterdayDate, 1);
        
        for (let i = 0; i < 98; i++) {
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          const exerciseCount = activityMap.get(dateStr) || 0;
          
          activities.push({
            date: new Date(currentDate),
            hasActivity: exerciseCount > 0,
            exerciseCount
          });
          
          if (exerciseCount > 0) {
            streakCount++;
            currentDate = subDays(currentDate, 1);
          } else {
            break;
          }
        }
      }
    }

    return { currentStreak: streakCount, activities };
  } catch (error) {
    console.error('Error calculating streak:', error);
    return { currentStreak: 0, activities: [] };
  }
};

/**
 * Get user's streak data for a specific language
 */
export const getUserStreak = async (userId: string, language: string): Promise<StreakData> => {
  try {
    // Get stored streak data
    const { data: storedStreak, error } = await supabase
      .from('user_language_streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('language', language)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching stored streak:', error);
    }

    // Calculate current streak from activities
    const { currentStreak, activities } = await calculateStreakFromActivities(userId, language);
    
    // Get the most recent activity date
    const lastActivityDate = activities.find(a => a.hasActivity)?.date || null;
    
    // Analyze streak status
    const status = analyzeStreakStatus(lastActivityDate);
    
    // Get longest streak from stored data or current streak if higher
    const longestStreak = Math.max(
      storedStreak?.longest_streak || 0, 
      currentStreak
    );

    // Update stored streak if current is different
    if (!storedStreak || storedStreak.current_streak !== currentStreak) {
      await supabase
        .from('user_language_streaks')
        .upsert({
          user_id: userId,
          language,
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_activity_date: lastActivityDate?.toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,language'
        });
    }

    return {
      currentStreak,
      longestStreak,
      lastActivityDate,
      streakActive: status.isActive,
      isAtRisk: status.isAtRisk,
      riskHoursRemaining: status.hoursRemaining
    };
  } catch (error) {
    console.error('Unexpected error fetching streak:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      streakActive: false,
      isAtRisk: false
    };
  }
};

/**
 * Get activity calendar data for the past few months
 */
export const getActivityCalendar = async (userId: string, language: string, months = 3): Promise<ActivityDay[]> => {
  try {
    const endDate = getCurrentLocalDate();
    const startDate = subDays(endDate, months * 30);

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
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const exerciseCount = activityMap.get(dateStr) || 0;
      
      activities.push({
        date: new Date(currentDate),
        hasActivity: exerciseCount > 0,
        exerciseCount
      });
      
      currentDate = new Date(currentDate);
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
    const today = format(getCurrentLocalDate(), 'yyyy-MM-dd');
    
    // Update or create daily activity
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

    // Recalculate and update streak
    await getUserStreak(userId, language);
  } catch (error) {
    console.error('Unexpected error updating streak:', error);
  }
};
