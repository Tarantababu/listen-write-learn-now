import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StreakCalendar } from './StreakCalendar';
import { getUserStreak, StreakData } from '@/services/streakService';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { cn } from '@/lib/utils';

export function StreakIndicator() {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    streakActive: false
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadStreakData();
    }
  }, [user, settings.selectedLanguage]);

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

  const getFlameColor = (level: string, active: boolean) => {
    // If streak is not active, keep it muted
    if (!active) {
      return 'text-muted-foreground';
    }

    // Color the flame based on streak level when active
    switch (level) {
      case 'legendary':
        return 'text-purple-500';
      case 'fire':
        return 'text-red-500';
      case 'hot':
        return 'text-orange-500';
      case 'warm':
        return 'text-yellow-500';
      default:
        return 'text-orange-400'; // Default active color for any streak
    }
  };

  const getStreakStyles = (level: string, active: boolean) => {
    if (!active) {
      return {
        text: 'text-muted-foreground',
        button: 'hover:bg-muted/50'
      };
    }

    switch (level) {
      case 'legendary':
        return {
          text: 'text-purple-600 font-bold',
          button: 'bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-200'
        };
      case 'fire':
        return {
          text: 'text-red-600 font-bold',
          button: 'bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 border-red-200'
        };
      case 'hot':
        return {
          text: 'text-orange-600 font-bold',
          button: 'bg-gradient-to-r from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 border-orange-200'
        };
      case 'warm':
        return {
          text: 'text-yellow-700 font-semibold',
          button: 'bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 border-yellow-200'
        };
      default:
        return {
          text: 'text-orange-600 font-medium',
          button: 'bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 border-orange-200'
        };
    }
  };

  if (!user || loading) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="flex items-center gap-2 opacity-50"
      >
        <Flame className="h-4 w-4 text-muted-foreground animate-pulse" />
        <span className="font-medium">-</span>
      </Button>
    );
  }

  const streakLevel = getStreakLevel(streakData.currentStreak);
  const flameColor = getFlameColor(streakLevel, streakData.streakActive);
  const styles = getStreakStyles(streakLevel, streakData.streakActive);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowCalendar(true)}
        className={cn(
          "flex items-center gap-2 transition-all duration-200 hover:scale-105 border",
          styles.button
        )}
        title={`Current streak: ${streakData.currentStreak} days${streakData.longestStreak > 0 ? ` | Best: ${streakData.longestStreak} days` : ''}`}
      >
        <div className="relative">
          <Flame 
            className={cn(
              "h-4 w-4 transition-all duration-300",
              flameColor,
              streakData.streakActive && "drop-shadow-sm",
              streakData.streakActive && streakLevel !== 'cold' && "animate-pulse"
            )} 
          />
          {streakLevel === 'legendary' && streakData.streakActive && (
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" />
          )}
        </div>
        
        <span className={cn("font-medium text-sm", styles.text)}>
          {streakData.currentStreak}
        </span>

        {streakData.streakActive && streakLevel !== 'cold' && (
          <span className="text-xs">
            {streakLevel === 'legendary' ? '🏆' : 
             streakLevel === 'fire' ? '🔥' : 
             streakLevel === 'hot' ? '🔥' : '✨'}
          </span>
        )}
      </Button>
      
      <StreakCalendar 
        isOpen={showCalendar}
        onOpenChange={setShowCalendar}
      />
    </>
  );
}