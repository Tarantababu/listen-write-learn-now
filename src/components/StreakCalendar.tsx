
import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getActivityCalendar, ActivityDay } from '@/services/streakService';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { cn } from '@/lib/utils';

interface StreakCalendarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StreakCalendar({ isOpen, onOpenChange }: StreakCalendarProps) {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activities, setActivities] = useState<ActivityDay[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadActivityData();
    }
  }, [isOpen, user, settings.selectedLanguage]);

  const loadActivityData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await getActivityCalendar(user.id, settings.selectedLanguage, 3);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activity calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getActivityForDate = (date: Date): ActivityDay | undefined => {
    return activities.find(activity => isSameDay(activity.date, date));
  };

  const getDayClassName = (date: Date): string => {
    const activity = getActivityForDate(date);
    const isToday = isSameDay(date, new Date());
    const isCurrentMonth = isSameMonth(date, currentMonth);
    
    let baseClasses = "w-8 h-8 flex items-center justify-center text-sm relative";
    
    if (!isCurrentMonth) {
      baseClasses += " text-muted-foreground opacity-50";
    }
    
    if (isToday) {
      baseClasses += " ring-2 ring-primary";
    }
    
    if (activity?.hasActivity) {
      baseClasses += " bg-primary text-primary-foreground rounded-full font-medium";
    } else {
      baseClasses += " hover:bg-muted rounded-full";
    }
    
    return baseClasses;
  };

  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Start a new streak
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>
        
        <div className="px-2">
          <p className="text-center text-muted-foreground mb-6">
            Learn today to start a streak. Continue learning every day to increase it.
          </p>
          
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-medium">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Calendar Grid */}
          <div className="space-y-2">
            {/* Week headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground h-8 flex items-center justify-center">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map(date => {
                const activity = getActivityForDate(date);
                return (
                  <div
                    key={date.toISOString()}
                    className={cn(getDayClassName(date))}
                    title={activity?.hasActivity ? `${activity.exerciseCount} exercises completed` : 'No activity'}
                  >
                    {format(date, 'd')}
                    {activity?.hasActivity && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-foreground rounded-full" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {loading && (
            <div className="text-center text-muted-foreground mt-4">
              Loading activity data...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
