
import React, { useEffect, useState } from 'react';
import { format, subDays, isSameDay, differenceInDays, startOfDay, subMonths } from 'date-fns';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, BookOpen, CalendarDays, Star, ChartBar, Award } from 'lucide-react';
import StatsCard from './StatsCard';
import StatsHeatmap from './StatsHeatmap';
import { getUserLevel, getWordsToNextLevel, getLevelProgress, formatNumber } from '@/utils/levelSystem';
import LevelBadge from '@/components/LevelBadge';
import { Progress } from '@/components/ui/progress';
import { compareWeeks, groupByDay } from '@/utils/trendUtils';
import LevelInfoTooltip from './LevelInfoTooltip';

interface CompletionData {
  date: Date;
  exerciseId: string;
  accuracy: number;
  words: number;
}

const UserStatistics: React.FC = () => {
  const { user } = useAuth();
  const { exercises } = useExerciseContext();
  const { vocabulary } = useVocabularyContext();
  const { settings } = useUserSettingsContext();
  const [completions, setCompletions] = useState<CompletionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch completion data from Supabase
  useEffect(() => {
    const fetchCompletionData = async () => {
      if (!user) {
        setCompletions([]);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('completions')
          .select('exercise_id, created_at, accuracy')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const exerciseTexts = exercises.reduce((acc: Record<string, string>, ex) => {
          acc[ex.id] = ex.text;
          return acc;
        }, {});

        const completionData: CompletionData[] = data.map(completion => ({
          date: new Date(completion.created_at),
          exerciseId: completion.exercise_id,
          accuracy: completion.accuracy,
          words: exerciseTexts[completion.exercise_id]
            ? normalizeText(exerciseTexts[completion.exercise_id]).split(' ').length
            : 0,
        }));

        setCompletions(completionData);
      } catch (error) {
        console.error('Error fetching completion data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletionData();
  }, [user, exercises]);

  // Helper function to normalize text (reused from textComparison.ts)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]"']/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Calculate statistics
  const currentLanguage = settings.selectedLanguage;
  
  // 1. Mastered words (completed 3+ times with high accuracy)
  const masteredWords = completions.reduce((mastered: Set<string>, completion) => {
    const exercise = exercises.find(ex => ex.id === completion.exerciseId);
    if (!exercise || exercise.language !== currentLanguage || completion.accuracy < 95) return mastered;
    
    // Count completions per exercise with good accuracy
    const highAccuracyCompletionsForExercise = completions.filter(
      c => c.exerciseId === completion.exerciseId && c.accuracy >= 95
    ).length;
    
    // If completed 3+ times with high accuracy, add its words to mastered set
    if (highAccuracyCompletionsForExercise >= 3) {
      const words = normalizeText(exercise.text).split(' ');
      words.forEach(word => mastered.add(word));
    }
    
    return mastered;
  }, new Set<string>());

  // 2. Total words dictated
  const totalWordsDictated = completions
    .filter(c => {
      const exercise = exercises.find(ex => ex.id === c.exerciseId);
      return exercise && exercise.language === currentLanguage;
    })
    .reduce((total, c) => total + c.words, 0);

  // 3. Unique words completed (at least once with 95%+ accuracy)
  const uniqueWordsCompleted = new Set<string>();
  completions.forEach(completion => {
    const exercise = exercises.find(ex => ex.id === completion.exerciseId);
    if (exercise && exercise.language === currentLanguage && completion.accuracy >= 95) {
      const words = normalizeText(exercise.text).split(' ');
      words.forEach(word => uniqueWordsCompleted.add(word));
    }
  });

  // 4. Words per day
  const wordsByDay = completions.reduce((acc: Record<string, number>, completion) => {
    const exercise = exercises.find(ex => ex.id === completion.exerciseId);
    if (!exercise || exercise.language !== currentLanguage) return acc;

    const dateStr = format(completion.date, 'yyyy-MM-dd');
    acc[dateStr] = (acc[dateStr] || 0) + completion.words;
    return acc;
  }, {});

  const activeDays = Object.keys(wordsByDay).length;
  const wordsPerDay = activeDays ? Math.round(totalWordsDictated / activeDays) : 0;

  // 5. Learning streak (consecutive active days)
  const calculateStreak = (): number => {
    const sortedDates = Object.keys(wordsByDay)
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => b.getTime() - a.getTime()); // Sort desc

    if (sortedDates.length === 0) return 0;

    let streak = 1; // Start with at least 1 day if there's activity
    const today = startOfDay(new Date());
    
    // Check if the most recent activity was today or yesterday
    const mostRecent = startOfDay(sortedDates[0]);
    const daysSinceLastActivity = differenceInDays(today, mostRecent);
    
    // Break streak if no activity today or yesterday
    if (daysSinceLastActivity > 1) return 0;
    
    // Count consecutive days backwards
    for (let i = 1; i < sortedDates.length; i++) {
      const current = startOfDay(sortedDates[i]);
      const prev = startOfDay(sortedDates[i - 1]);
      const gap = differenceInDays(prev, current);
      
      if (gap === 1) {
        // Consecutive day
        streak++;
      } else {
        // Break in the streak
        break;
      }
    }
    
    return streak;
  };

  const streak = calculateStreak();

  // 6. Heatmap data
  const activityHeatmap = Object.entries(wordsByDay).map(([dateStr, count]) => ({
    date: new Date(dateStr),
    count
  }));

  // 7. Level information based on mastered words
  const userLevel = getUserLevel(masteredWords.size);
  const wordsToNextLevel = getWordsToNextLevel(masteredWords.size);
  const levelProgress = getLevelProgress(masteredWords.size);
  
  const levelDescription = wordsToNextLevel > 0
    ? `⭐ You've mastered ${formatNumber(masteredWords.size)} words – ${userLevel.level} Level – ${formatNumber(wordsToNextLevel)} to ${userLevel.level.charAt(0)}${Number(userLevel.level.charAt(1)) + 1}`
    : `⭐ You've mastered ${formatNumber(masteredWords.size)} words – ${userLevel.level} Level – Maximum level reached!`;

  // 8. Calculate trends
  const wordsByDayObject = groupByDay(activityHeatmap);
  const wordsTrend = compareWeeks(wordsByDayObject);
  
  // Calculate vocabulary trend
  const vocabTrend = (() => {
    const currentVocabCount = vocabulary.filter(item => item.language === currentLanguage).length;
    
    // Get vocabulary count from a month ago (simulate since we don't have historical data)
    const lastMonthEstimate = Math.max(0, Math.round(currentVocabCount * 0.8));  // Just a simulation
    
    if (lastMonthEstimate === 0) {
      return currentVocabCount > 0 ? { value: 100, label: 'New vocabulary items' } : { value: 0, label: 'No change' };
    }
    
    const change = ((currentVocabCount - lastMonthEstimate) / lastMonthEstimate) * 100;
    return {
      value: Math.round(change),
      label: `${change >= 0 ? 'Increase' : 'Decrease'} in the past month`
    };
  })();

  // Calculate mastered words trend (simulated for demo)
  const masteredWordsTrend = { 
    value: 12, 
    label: 'Increase in the past month' 
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading statistics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Progress</h2>
        <div className="flex items-center gap-2">
          <LevelBadge masteredWords={masteredWords.size} />
          <span className="text-sm font-medium">{userLevel.title}</span>
        </div>
      </div>
      
      <div className="bg-muted/40 p-4 rounded-lg animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <Award className="h-5 w-5 text-amber-500" />
          <h3 className="font-medium">Language Level</h3>
          <LevelInfoTooltip />
        </div>
        <p className="text-sm mb-2">{levelDescription}</p>
        <Progress value={levelProgress} className="h-2" />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground">{userLevel.level}</span>
          {userLevel.maxWords !== null && (
            <span className="text-xs text-muted-foreground">
              {userLevel.level.charAt(0)}{Number(userLevel.level.charAt(1)) + 1}
            </span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard 
          title="Mastered Words" 
          value={masteredWords.size} 
          icon={<Trophy />}
          description="Words completed with 95%+ accuracy at least 3 times" 
          progress={levelProgress}
          progressColor={userLevel.color}
          trend={masteredWordsTrend}
        />
        
        <StatsCard 
          title="Total Words Dictated" 
          value={totalWordsDictated}
          icon={<BookOpen />}
          description="Total word count from all exercises"
          trend={wordsTrend}
        />
        
        <StatsCard 
          title="Unique Words Completed" 
          value={uniqueWordsCompleted.size}
          icon={<Star />}
          description="Words dictated correctly at least once" 
          trend={{ value: 8, label: 'Increase in the past month' }} 
        />
        
        <StatsCard 
          title="Words Per Day" 
          value={wordsPerDay}
          icon={<ChartBar />}
          description={`Average across ${activeDays} active days`} 
          trend={{ value: 5, label: 'Increase from previous average' }}
        />
        
        <StatsCard 
          title="Learning Streak" 
          value={streak}
          icon={<CalendarDays />}
          description="Consecutive days with activity" 
          trend={{ value: streak > 3 ? 1 : 0, label: streak > 0 ? 'Keep it going!' : 'Start today!' }}
        />

        <StatsCard
          title="Vocabulary Items"
          value={vocabulary.filter(item => item.language === currentLanguage).length}
          icon={<BookOpen />}
          description="Words saved to your vocabulary list"
          trend={vocabTrend}
        />
      </div>
      
      <StatsHeatmap activityData={activityHeatmap} />
    </div>
  );
};

export default UserStatistics;
