
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Flame, X, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { getUserStreak, StreakData } from '@/services/streakService';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useNavigate } from 'react-router-dom';

export function StreakRiskBanner() {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  const navigate = useNavigate();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !dismissed) {
      loadStreakData();
      
      // Set up interval to check streak status every 30 minutes
      const interval = setInterval(loadStreakData, 30 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user, settings.selectedLanguage, dismissed]);

  const loadStreakData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await getUserStreak(user.id, settings.selectedLanguage);
      setStreakData(data);
    } catch (error) {
      console.error('Error loading streak data for banner:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePracticeNow = () => {
    navigate('/dashboard/exercises');
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Auto-show again after 2 hours
    setTimeout(() => setDismissed(false), 2 * 60 * 60 * 1000);
  };

  // Don't show banner if no user, loading, dismissed, or no streak risk
  if (!user || loading || dismissed || !streakData?.isAtRisk || !streakData.riskHoursRemaining) {
    return null;
  }

  const hoursText = streakData.riskHoursRemaining === 1 ? 'hour' : 'hours';
  const isUrgent = streakData.riskHoursRemaining <= 3;

  return (
    <Alert 
      variant={isUrgent ? 'destructive' : 'default'}
      className={`relative border-2 ${
        isUrgent 
          ? 'border-red-300 bg-red-50 text-red-900' 
          : 'border-orange-300 bg-orange-50 text-orange-900'
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2 rounded-full ${
            isUrgent ? 'bg-red-100' : 'bg-orange-100'
          }`}>
            {isUrgent ? (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            ) : (
              <Flame className="h-5 w-5 text-orange-600" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="font-semibold mb-1">
              {isUrgent ? '🚨 Streak Emergency!' : '⚠️ Streak at Risk!'}
            </div>
            <AlertDescription className="text-sm">
              Your {streakData.currentStreak}-day streak will be lost if you don't complete an exercise within{' '}
              <span className="font-bold">{streakData.riskHoursRemaining} {hoursText}</span>.
              {isUrgent && ' Act now to save your progress!'}
            </AlertDescription>
            
            <div className="flex items-center gap-4 mt-3">
              <Button 
                size="sm" 
                onClick={handlePracticeNow}
                className={
                  isUrgent 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }
              >
                Practice Now
              </Button>
              
              <div className="flex items-center gap-1 text-xs opacity-75">
                <Clock className="h-3 w-3" />
                <span>{streakData.riskHoursRemaining}h remaining</span>
              </div>
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0 hover:bg-white/20 absolute top-2 right-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
