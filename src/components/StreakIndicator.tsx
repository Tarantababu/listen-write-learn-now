
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

  if (!user || loading) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowCalendar(true)}
        className={cn(
          "flex items-center gap-2 hover:bg-primary/10 transition-colors",
          streakData.streakActive ? "text-orange-500" : "text-muted-foreground"
        )}
      >
        <Flame className={cn(
          "h-4 w-4",
          streakData.streakActive ? "text-orange-500" : "text-muted-foreground"
        )} />
        <span className="font-medium">
          {streakData.currentStreak}
        </span>
      </Button>
      
      <StreakCalendar 
        isOpen={showCalendar}
        onOpenChange={setShowCalendar}
      />
    </>
  );
}
