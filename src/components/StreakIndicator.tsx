
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

  const getStreakVisuals = (level: string, active: boolean) => {
    if (!active) {
      return {
        flameColor: 'text-gray-400',
        textColor: 'text-gray-500',
        buttonStyle: 'bg-gray-50 hover:bg-gray-100 border-gray-200 shadow-sm',
        emoji: '',
        glowEffect: ''
      };
    }

    switch (level) {
      case 'legendary':
        return {
          flameColor: 'text-purple-600',
          textColor: 'text-purple-700 font-bold',
          buttonStyle: 'bg-gradient-to-r from-purple-100 via-pink-50 to-purple-100 hover:from-purple-150 hover:via-pink-100 hover:to-purple-150 border-purple-300 shadow-lg shadow-purple-200/50',
          emoji: '👑',
          glowEffect: 'drop-shadow-[0_0_8px_rgba(147,51,234,0.3)]'
        };
      case 'fire':
        return {
          flameColor: 'text-red-600',
          textColor: 'text-red-700 font-bold',
          buttonStyle: 'bg-gradient-to-r from-red-100 via-orange-50 to-red-100 hover:from-red-150 hover:via-orange-100 hover:to-red-150 border-red-300 shadow-lg shadow-red-200/50',
          emoji: '🔥',
          glowEffect: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]'
        };
      case 'hot':
        return {
          flameColor: 'text-orange-600',
          textColor: 'text-orange-700 font-bold',
          buttonStyle: 'bg-gradient-to-r from-orange-100 via-yellow-50 to-orange-100 hover:from-orange-150 hover:via-yellow-100 hover:to-orange-150 border-orange-300 shadow-lg shadow-orange-200/50',
          emoji: '🔥',
          glowEffect: 'drop-shadow-[0_0_6px_rgba(251,146,60,0.3)]'
        };
      case 'warm':
        return {
          flameColor: 'text-yellow-600',
          textColor: 'text-yellow-700 font-semibold',
          buttonStyle: 'bg-gradient-to-r from-yellow-100 via-amber-50 to-yellow-100 hover:from-yellow-150 hover:via-amber-100 hover:to-yellow-150 border-yellow-300 shadow-md shadow-yellow-200/40',
          emoji: '✨',
          glowEffect: 'drop-shadow-[0_0_4px_rgba(245,158,11,0.3)]'
        };
      default:
        return {
          flameColor: 'text-orange-500',
          textColor: 'text-orange-600 font-medium',
          buttonStyle: 'bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border-orange-200 shadow-md shadow-orange-100/40',
          emoji: '🌟',
          glowEffect: 'drop-shadow-[0_0_3px_rgba(251,146,60,0.2)]'
        };
    }
  };

  if (!user || loading) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="flex items-center gap-2 opacity-50 bg-gray-50 border border-gray-200"
      >
        <Flame className="h-4 w-4 text-gray-400" />
        <span className="font-medium text-gray-400">-</span>
      </Button>
    );
  }

  const streakLevel = getStreakLevel(streakData.currentStreak);
  const visuals = getStreakVisuals(streakLevel, streakData.streakActive);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowCalendar(true)}
        className={cn(
          "flex items-center gap-2 transition-all duration-300 hover:scale-105 border-2 font-medium relative overflow-hidden",
          visuals.buttonStyle
        )}
        title={`Current streak: ${streakData.currentStreak} days${streakData.longestStreak > 0 ? ` | Best: ${streakData.longestStreak} days` : ''}`}
      >
        {/* Background accent for legendary streak */}
        {streakLevel === 'legendary' && streakData.streakActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-200/20 to-transparent -skew-x-12 transform translate-x-full opacity-75" />
        )}
        
        <div className="relative flex items-center gap-2">
          <div className="relative">
            <Flame 
              className={cn(
                "h-5 w-5 transition-all duration-300",
                visuals.flameColor,
                visuals.glowEffect
              )} 
            />
            {streakLevel === 'legendary' && streakData.streakActive && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full shadow-lg shadow-purple-300/50" />
            )}
          </div>
          
          <span className={cn("text-sm transition-all duration-300", visuals.textColor)}>
            {streakData.currentStreak}
          </span>

          {streakData.streakActive && visuals.emoji && (
            <span className="text-sm ml-1">
              {visuals.emoji}
            </span>
          )}
        </div>
      </Button>
      
      <StreakCalendar 
        isOpen={showCalendar}
        onOpenChange={setShowCalendar}
      />
    </>
  );
}
