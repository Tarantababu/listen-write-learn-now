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

  const getStreakStyles = (level: string, active: boolean) => {
    if (!active) {
      return {
        flame: 'text-muted-foreground',
        text: 'text-muted-foreground',
        button: 'hover:bg-muted/50'
      };
    }

    switch (level) {
      case 'legendary':
        return {
          flame: 'text-purple-500 drop-shadow-sm',
          text: 'text-purple-600 font-bold',
          button: 'bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-200'
        };
      case 'fire':
        return {
          flame: 'text-red-500 drop-shadow-sm',
          text: 'text-red-600 font-bold',
          button: 'bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 border-red-200'
        };
      case 'hot':
        return {
          flame: 'text-orange-500 drop-shadow-sm',
          text: 'text-orange-600 font-bold',
          button: 'bg-gradient-to-r from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 border-orange-200'
        };
      case 'warm':
        return {
          flame: 'text-yellow-500 drop-shadow-sm',
          text: 'text-yellow-700 font-semibold',
          button: 'bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 border-yellow-200'
        };
      default:
        return {
          flame: 'text-muted-foreground',
          text: 'text-muted-foreground',
          button: 'hover:bg-muted/50'
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
              "h-4 w-4 transition-colors duration-200",
              styles.flame,
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