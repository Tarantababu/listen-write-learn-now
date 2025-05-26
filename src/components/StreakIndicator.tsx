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

  const getStreakColors = (level: string, active: boolean) => {
    if (!active) return {
      text: 'text-muted-foreground',
      bg: 'hover:bg-muted/50',
      border: 'border-muted/20'
    };

    switch (level) {
      case 'legendary':
        return {
          text: 'text-purple-600',
          bg: 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20',
          border: 'border-purple-500/30'
        };
      case 'fire':
        return {
          text: 'text-red-500',
          bg: 'bg-gradient-to-r from-red-500/10 to-orange-500/10 hover:from-red-500/20 hover:to-orange-500/20',
          border: 'border-red-500/30'
        };
      case 'hot':
        return {
          text: 'text-orange-500',
          bg: 'bg-gradient-to-r from-orange-500/10 to-yellow-500/10 hover:from-orange-500/20 hover:to-yellow-500/20',
          border: 'border-orange-500/30'
        };
      case 'warm':
        return {
          text: 'text-yellow-600',
          bg: 'bg-gradient-to-r from-yellow-500/10 to-orange-400/10 hover:from-yellow-500/20 hover:to-orange-400/20',
          border: 'border-yellow-500/30'
        };
      default:
        return {
          text: 'text-muted-foreground',
          bg: 'hover:bg-muted/50',
          border: 'border-muted/20'
        };
    }
  };

  const getStreakEmoji = (level: string) => {
    switch (level) {
      case 'legendary': return '🏆';
      case 'fire': return '🔥';
      case 'hot': return '🔥';
      case 'warm': return '✨';
      default: return '';
    }
  };

  if (!user || loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/20 animate-pulse">
        <Flame className="h-4 w-4 text-muted-foreground" />
        <div className="h-4 w-6 bg-muted-foreground/20 rounded" />
      </div>
    );
  }

  const streakLevel = getStreakLevel(streakData.currentStreak);
  const colors = getStreakColors(streakLevel, streakData.streakActive);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowCalendar(true)}
        className={cn(
          "relative flex items-center gap-3 px-4 py-2 h-auto rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md",
          colors.bg,
          colors.border,
          streakData.streakActive ? "shadow-sm" : ""
        )}
        title={`Current streak: ${streakData.currentStreak} days${streakData.longestStreak > 0 ? ` | Best: ${streakData.longestStreak} days` : ''}`}
      >
        {/* Flame Icon with Animation */}
        <div className="relative">
          <Flame
            className={cn(
              "h-5 w-5 transition-all duration-300",
              colors.text,
              streakData.streakActive && streakLevel !== 'cold' && "animate-pulse"
            )}
          />
          {streakData.streakActive && streakLevel === 'legendary' && (
            <div className="absolute -top-1 -right-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping" />
            </div>
          )}
        </div>

        {/* Streak Information */}
        <div className="flex items-center gap-2">
          <span className={cn("font-bold text-lg leading-none", colors.text)}>
            {streakData.currentStreak}
          </span>
          
          {/* Streak Level Indicator */}
          {streakData.streakActive && streakLevel !== 'cold' && (
            <div className="flex items-center gap-1">
              <span className="text-sm leading-none">
                {getStreakEmoji(streakLevel)}
              </span>
              <div className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium leading-none",
                streakLevel === 'legendary' && "bg-purple-100 text-purple-700",
                streakLevel === 'fire' && "bg-red-100 text-red-700",
                streakLevel === 'hot' && "bg-orange-100 text-orange-700",
                streakLevel === 'warm' && "bg-yellow-100 text-yellow-700"
              )}>
                {streakLevel.toUpperCase()}
              </div>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        {streakData.streakActive && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30 rounded-b-lg overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500",
                streakLevel === 'legendary' && "bg-gradient-to-r from-purple-500 to-pink-500",
                streakLevel === 'fire' && "bg-gradient-to-r from-red-500 to-orange-500",
                streakLevel === 'hot' && "bg-gradient-to-r from-orange-500 to-yellow-500",
                streakLevel === 'warm' && "bg-gradient-to-r from-yellow-500 to-orange-400"
              )}
              style={{
                width: `${Math.min(((streakData.currentStreak % 7) / 7) * 100 + 14, 100)}%`
              }}
            />
          </div>
        )}

        {/* Longest Streak Badge */}
        {streakData.longestStreak > streakData.currentStreak && streakData.longestStreak >= 7 && (
          <div className="absolute -top-2 -right-2 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full border border-amber-200 font-medium">
            🏆 {streakData.longestStreak}
          </div>
        )}
      </Button>
      
      <StreakCalendar 
        isOpen={showCalendar}
        onOpenChange={setShowCalendar}
      />
    </>
  );
}