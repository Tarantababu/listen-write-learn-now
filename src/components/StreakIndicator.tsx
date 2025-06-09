
import React, { useState, useEffect } from 'react';
import { Flame, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StreakCalendar } from './StreakCalendar';
import { getUserStreak, StreakData } from '@/services/streakService';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useGTM } from '@/hooks/use-gtm';

// Storage key to track shown streak alerts by streak ID
const STREAK_ALERT_SHOWN_KEY = 'lwl_streak_alert_shown';

export function StreakIndicator() {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  const { trackFeatureUsed } = useGTM();
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    streakActive: false,
    isAtRisk: false
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadStreakData();
    }
  }, [user, settings.selectedLanguage]);

  // Function to check if we've already shown an alert for this streak risk
  const hasAlertBeenShown = (userId: string, currentStreak: number, hoursRemaining?: number) => {
    if (!hoursRemaining) return true; // No hours remaining, so no need to show

    const streakAlertKey = `${userId}_${currentStreak}_${Math.floor(hoursRemaining / 6)}`; // Group similar hour ranges
    const shownAlerts = JSON.parse(localStorage.getItem(STREAK_ALERT_SHOWN_KEY) || '{}');
    return !!shownAlerts[streakAlertKey];
  };

  // Function to mark an alert as shown
  const markAlertAsShown = (userId: string, currentStreak: number, hoursRemaining?: number) => {
    if (!hoursRemaining) return;
    const streakAlertKey = `${userId}_${currentStreak}_${Math.floor(hoursRemaining / 6)}`;
    const shownAlerts = JSON.parse(localStorage.getItem(STREAK_ALERT_SHOWN_KEY) || '{}');
    shownAlerts[streakAlertKey] = true;
    localStorage.setItem(STREAK_ALERT_SHOWN_KEY, JSON.stringify(shownAlerts));
  };

  // Show risk notification when streak is at risk - only once per risk period
  useEffect(() => {
    if (user && streakData.isAtRisk && streakData.riskHoursRemaining) {
      // Check if we've already shown this alert
      if (!hasAlertBeenShown(user.id, streakData.currentStreak, streakData.riskHoursRemaining)) {
        const hoursText = streakData.riskHoursRemaining === 1 ? 'hour' : 'hours';
        toast.warning(`Streak Alert! Complete an exercise within ${streakData.riskHoursRemaining} ${hoursText} to maintain your ${streakData.currentStreak}-day streak!`, {
          duration: 10000,
          action: {
            label: 'Practice Now',
            onClick: () => window.location.href = '/dashboard/exercises'
          }
        });

        // Mark this alert as shown
        markAlertAsShown(user.id, streakData.currentStreak, streakData.riskHoursRemaining);
      }
    }
  }, [streakData.isAtRisk, streakData.riskHoursRemaining, streakData.currentStreak, user]);

  const loadStreakData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserStreak(user.id, settings.selectedLanguage);
      setStreakData(data);
    } catch (error) {
      console.error('Error loading streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStreakLevel = (streak: number) => {
    if (streak >= 30) return 'legendary';
    if (streak >= 14) return 'fire';
    if (streak >= 7) return 'hot';
    if (streak >= 3) return 'warm';
    return 'cold';
  };

  const getStreakVisuals = (level: string, active: boolean, isAtRisk: boolean) => {
    if (!active) {
      return {
        flameColor: 'text-gray-400',
        textColor: 'text-gray-500',
        buttonStyle: 'bg-gray-50 hover:bg-gray-100 border-gray-200 shadow-sm',
        emoji: '',
        glowEffect: '',
        riskIndicator: null
      };
    }

    // Risk indicator for at-risk streaks
    const riskIndicator = isAtRisk ? <div className="hidden ">
        <AlertTriangle className="h-3 w-3 text-orange-500 animate-pulse" />
      </div> : null;

    switch (level) {
      case 'legendary':
        return {
          flameColor: isAtRisk ? 'text-orange-500' : 'text-purple-600',
          textColor: isAtRisk ? 'text-orange-700 font-bold' : 'text-purple-700 font-bold',
          buttonStyle: isAtRisk ? 'bg-gradient-to-r from-orange-100 via-red-50 to-orange-100 hover:from-orange-150 hover:via-red-100 hover:to-orange-150 border-orange-300 shadow-lg shadow-orange-200/50' : 'bg-gradient-to-r from-purple-100 via-pink-50 to-purple-100 hover:from-purple-150 hover:via-pink-100 hover:to-purple-150 border-purple-300 shadow-lg shadow-purple-200/50',
          emoji: isAtRisk ? '⚠️' : '👑',
          glowEffect: isAtRisk ? 'drop-shadow-[0_0_8px_rgba(251,146,60,0.3)]' : 'drop-shadow-[0_0_8px_rgba(147,51,234,0.3)]',
          riskIndicator
        };
      case 'fire':
        return {
          flameColor: isAtRisk ? 'text-orange-500' : 'text-red-600',
          textColor: isAtRisk ? 'text-orange-700 font-bold' : 'text-red-700 font-bold',
          buttonStyle: isAtRisk ? 'bg-gradient-to-r from-orange-100 via-yellow-50 to-orange-100 hover:from-orange-150 hover:via-yellow-100 hover:to-orange-150 border-orange-300 shadow-lg shadow-orange-200/50' : 'bg-gradient-to-r from-red-100 via-orange-50 to-red-100 hover:from-red-150 hover:via-orange-100 hover:to-red-150 border-red-300 shadow-lg shadow-red-200/50',
          emoji: isAtRisk ? '⚠️' : '🔥',
          glowEffect: isAtRisk ? 'drop-shadow-[0_0_6px_rgba(251,146,60,0.3)]' : 'drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]',
          riskIndicator
        };
      case 'hot':
        return {
          flameColor: isAtRisk ? 'text-yellow-600' : 'text-orange-600',
          textColor: isAtRisk ? 'text-yellow-700 font-bold' : 'text-orange-700 font-bold',
          buttonStyle: isAtRisk ? 'bg-gradient-to-r from-yellow-100 via-amber-50 to-yellow-100 hover:from-yellow-150 hover:via-amber-100 hover:to-yellow-150 border-yellow-300 shadow-md shadow-yellow-200/40' : 'bg-gradient-to-r from-orange-100 via-yellow-50 to-orange-100 hover:from-orange-150 hover:via-yellow-100 hover:to-orange-150 border-orange-300 shadow-lg shadow-orange-200/50',
          emoji: isAtRisk ? '⚠️' : '🔥',
          glowEffect: isAtRisk ? 'drop-shadow-[0_0_4px_rgba(245,158,11,0.3)]' : 'drop-shadow-[0_0_6px_rgba(251,146,60,0.3)]',
          riskIndicator
        };
      case 'warm':
        return {
          flameColor: isAtRisk ? 'text-orange-500' : 'text-yellow-600',
          textColor: isAtRisk ? 'text-orange-700 font-semibold' : 'text-yellow-700 font-semibold',
          buttonStyle: isAtRisk ? 'bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border-orange-200 shadow-md shadow-orange-100/40' : 'bg-gradient-to-r from-yellow-100 via-amber-50 to-yellow-100 hover:from-yellow-150 hover:via-amber-100 hover:to-yellow-150 border-yellow-300 shadow-md shadow-yellow-200/40',
          emoji: isAtRisk ? '⚠️' : '✨',
          glowEffect: isAtRisk ? 'drop-shadow-[0_0_3px_rgba(251,146,60,0.2)]' : 'drop-shadow-[0_0_4px_rgba(245,158,11,0.3)]',
          riskIndicator
        };
      default:
        return {
          flameColor: 'text-orange-500',
          textColor: 'text-orange-600 font-medium',
          buttonStyle: 'bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border-orange-200 shadow-md shadow-orange-100/40',
          emoji: isAtRisk ? '⚠️' : '🌟',
          glowEffect: 'drop-shadow-[0_0_3px_rgba(251,146,60,0.2)]',
          riskIndicator
        };
    }
  };

  const handleCalendarOpen = () => {
    setShowCalendar(true);
    trackFeatureUsed({
      feature_name: 'streak_calendar',
      feature_category: 'other',
      additional_data: {
        current_streak: streakData.currentStreak,
        streak_active: streakData.streakActive
      }
    });
  };

  // Handle loading and no user states without early returns
  if (!user || loading) {
    return (
      <>
        <Button variant="ghost" size="sm" disabled className="flex items-center gap-2 opacity-50 bg-gray-50 border border-gray-200">
          <Flame className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-400">-</span>
        </Button>
        <StreakCalendar isOpen={showCalendar} onOpenChange={setShowCalendar} />
      </>
    );
  }

  const streakLevel = getStreakLevel(streakData.currentStreak);
  const visuals = getStreakVisuals(streakLevel, streakData.streakActive, streakData.isAtRisk);
  
  const getTooltipText = () => {
    let tooltip = `Current streak: ${streakData.currentStreak} days`;
    if (streakData.longestStreak > 0) {
      tooltip += ` | Best: ${streakData.longestStreak} days`;
    }
    if (streakData.isAtRisk && streakData.riskHoursRemaining) {
      const hoursText = streakData.riskHoursRemaining === 1 ? 'hour' : 'hours';
      tooltip += ` | At risk! ${streakData.riskHoursRemaining} ${hoursText} remaining`;
    }
    return tooltip;
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleCalendarOpen} 
        className={cn("flex items-center gap-2 transition-all duration-300 hover:scale-105 border-2 font-medium relative overflow-hidden", visuals.buttonStyle)} 
        title={getTooltipText()} 
        data-gtm-feature="streak_indicator" 
        data-gtm-streak-level={getStreakLevel(streakData.currentStreak)} 
        data-gtm-current-streak={streakData.currentStreak}
      >
        {/* Background accent for legendary streak */}
        {streakLevel === 'legendary' && streakData.streakActive && !streakData.isAtRisk && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-200/20 to-transparent -skew-x-12 transform translate-x-full opacity-75" />
        )}
        
        <div className="relative flex items-center gap-2">
          <div className="relative">
            <Flame className={cn("h-5 w-5 transition-all duration-300", visuals.flameColor, visuals.glowEffect)} />
            {visuals.riskIndicator}
            {streakLevel === 'legendary' && streakData.streakActive && !streakData.isAtRisk && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full shadow-lg shadow-purple-300/50" />
            )}
          </div>
          
          <span className={cn("text-sm transition-all duration-300", visuals.textColor)}>
            {streakData.currentStreak}
          </span>

          {streakData.streakActive && visuals.emoji}

          {streakData.isAtRisk && streakData.riskHoursRemaining && (
            <div className="flex items-center gap-1 text-xs text-orange-600">
              <Clock className="h-3 w-3" />
              <span>{streakData.riskHoursRemaining}h</span>
            </div>
          )}
        </div>
      </Button>
      
      <StreakCalendar isOpen={showCalendar} onOpenChange={setShowCalendar} />
    </>
  );
}
