
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Share2, Copy, Trophy, BookOpen, Calendar, Target } from 'lucide-react';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getUserLevel, formatNumber } from '@/utils/levelSystem';
import { FlagIcon } from 'react-flag-kit';
import { getLanguageFlagCode, capitalizeLanguage } from '@/utils/languageUtils';
import html2canvas from 'html2canvas';

interface ShareProgressModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProgressStats {
  totalExercises: number;
  completedExercises: number;
  vocabularyCount: number;
  currentStreak: number;
  totalDays: number;
}

const ShareProgressModal: React.FC<ShareProgressModalProps> = ({ isOpen, onOpenChange }) => {
  const { settings } = useUserSettingsContext();
  const { user } = useAuth();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserStats();
    }
  }, [isOpen, user, settings.selectedLanguage]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch exercises stats
      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('id, is_completed')
        .eq('user_id', user.id)
        .eq('language', settings.selectedLanguage);

      // Fetch vocabulary count
      const { data: vocabularyData } = await supabase
        .from('vocabulary')
        .select('id')
        .eq('user_id', user.id)
        .eq('language', settings.selectedLanguage);

      // Fetch streak data
      const { data: streakData } = await supabase
        .from('user_language_streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .eq('language', settings.selectedLanguage)
        .single();

      // Fetch daily activities for total days
      const { data: activitiesData } = await supabase
        .from('user_daily_activities')
        .select('activity_date')
        .eq('user_id', user.id)
        .eq('language', settings.selectedLanguage);

      const totalExercises = exercisesData?.length || 0;
      const completedExercises = exercisesData?.filter(ex => ex.is_completed).length || 0;
      const vocabularyCount = vocabularyData?.length || 0;
      const currentStreak = streakData?.current_streak || 0;
      const totalDays = activitiesData?.length || 0;

      setStats({
        totalExercises,
        completedExercises,
        vocabularyCount,
        currentStreak,
        totalDays
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      toast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const generateProgressImage = async () => {
    const element = document.getElementById('progress-card');
    if (!element) return null;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating image:', error);
      return null;
    }
  };

  const handleShareProgress = async () => {
    if (!stats) return;

    const progressPercentage = stats.totalExercises > 0 
      ? Math.round((stats.completedExercises / stats.totalExercises) * 100) 
      : 0;

    const level = getUserLevel(stats.vocabularyCount);
    
    const shareText = `🎯 My ${capitalizeLanguage(settings.selectedLanguage)} Learning Progress on lwlnow:

📚 ${stats.completedExercises}/${stats.totalExercises} exercises completed (${progressPercentage}%)
📖 ${formatNumber(stats.vocabularyCount)} vocabulary words mastered
🏆 Level: ${level.title} (${level.cefrEquivalent})
🔥 ${stats.currentStreak} day streak
📅 ${stats.totalDays} active learning days

Join me on lwlnow - Learn languages through dictation!
https://lwlnow.com`;

    if (navigator.share) {
      try {
        const imageDataUrl = await generateProgressImage();
        if (imageDataUrl) {
          // Convert data URL to blob for sharing
          const response = await fetch(imageDataUrl);
          const blob = await response.blob();
          const file = new File([blob], 'my-progress.png', { type: 'image/png' });

          await navigator.share({
            title: 'My Language Learning Progress',
            text: shareText,
            files: [file],
          });
        } else {
          await navigator.share({
            title: 'My Language Learning Progress',
            text: shareText,
          });
        }
      } catch (error) {
        // Fallback to copy to clipboard
        await navigator.clipboard.writeText(shareText);
        toast.success('Progress shared! Text copied to clipboard.');
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success('Progress summary copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!stats) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unable to Load Progress</DialogTitle>
            <DialogDescription>
              We couldn't load your progress data. Please try again later.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const progressPercentage = stats.totalExercises > 0 
    ? Math.round((stats.completedExercises / stats.totalExercises) * 100) 
    : 0;

  const level = getUserLevel(stats.vocabularyCount);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Progress
          </DialogTitle>
          <DialogDescription>
            Show your friends how you're progressing with {capitalizeLanguage(settings.selectedLanguage)}!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card id="progress-card" className="bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FlagIcon code={getLanguageFlagCode(settings.selectedLanguage)} size={24} />
                My {capitalizeLanguage(settings.selectedLanguage)} Journey
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Exercises</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.completedExercises}/{stats.totalExercises}</p>
                  <Progress value={progressPercentage} className="h-2 mt-1" />
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Vocabulary</span>
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(stats.vocabularyCount)}</p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {level.title}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Trophy className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Streak</span>
                  </div>
                  <p className="text-xl font-bold">{stats.currentStreak} days</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Total Days</span>
                  </div>
                  <p className="text-xl font-bold">{stats.totalDays}</p>
                </div>
              </div>

              <div className="text-center pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  Learning with <span className="font-semibold">lwlnow</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button 
              onClick={handleShareProgress} 
              className="flex-1"
              variant="default"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Progress
            </Button>
            <Button 
              onClick={() => {
                generateProgressImage().then(dataUrl => {
                  if (dataUrl) {
                    const link = document.createElement('a');
                    link.download = 'my-language-progress.png';
                    link.href = dataUrl;
                    link.click();
                    toast.success('Progress image downloaded!');
                  }
                });
              }} 
              variant="outline"
            >
              <Copy className="h-4 w-4 mr-2" />
              Save Image
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareProgressModal;
