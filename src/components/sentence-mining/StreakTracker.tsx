
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Flame, Target, Award } from 'lucide-react';

interface StreakTrackerProps {
  currentStreak: number;
  longestStreak: number;
  weeklyProgress: number[];
  streakGoal: number;
}

export const StreakTracker: React.FC<StreakTrackerProps> = ({
  currentStreak,
  longestStreak,
  weeklyProgress,
  streakGoal = 30
}) => {
  const streakPercentage = (currentStreak / streakGoal) * 100;
  const today = new Date();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Get last 7 days for visualization
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-500';
    if (streak >= 14) return 'text-orange-500';
    if (streak >= 7) return 'text-yellow-500';
    return 'text-gray-500';
  };

  const getStreakTitle = (streak: number) => {
    if (streak >= 30) return 'Legendary';
    if (streak >= 14) return 'On Fire';
    if (streak >= 7) return 'Hot Streak';
    if (streak >= 3) return 'Building';
    return 'Getting Started';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className={`h-5 w-5 ${getStreakColor(currentStreak)}`} />
          Learning Streak
          <Badge variant="secondary" className="ml-auto">
            {getStreakTitle(currentStreak)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Streak Display */}
          <div className="text-center space-y-2">
            <div className={`text-4xl font-bold ${getStreakColor(currentStreak)}`}>
              {currentStreak}
            </div>
            <p className="text-sm text-muted-foreground">
              day{currentStreak !== 1 ? 's' : ''} in a row
            </p>
          </div>

          {/* Streak Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to {streakGoal} days</span>
              <span>{Math.min(currentStreak, streakGoal)}/{streakGoal}</span>
            </div>
            <Progress value={Math.min(streakPercentage, 100)} className="w-full" />
          </div>

          {/* Weekly Activity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">This Week</span>
            </div>
            <div className="flex justify-between">
              {last7Days.map((date, index) => {
                const dayProgress = weeklyProgress[index] || 0;
                const isToday = date.toDateString() === today.toDateString();
                
                return (
                  <div key={index} className="flex flex-col items-center space-y-2">
                    <div className="text-xs text-muted-foreground">
                      {weekDays[date.getDay()]}
                    </div>
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                        dayProgress > 0 
                          ? 'bg-green-500 text-white' 
                          : isToday 
                            ? 'bg-blue-100 text-blue-600 border-2 border-blue-500'
                            : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {dayProgress > 0 ? '✓' : date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Streak Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Current</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {currentStreak}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Award className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Best</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {longestStreak}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
