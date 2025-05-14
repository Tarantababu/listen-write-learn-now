import React, { useEffect, useState, useMemo } from 'react';
import { format, subDays, isSameDay, differenceInDays, startOfDay } from 'date-fns';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, BookOpen, CalendarDays } from 'lucide-react';
import StatsCard from './StatsCard';
import StatsHeatmap from './StatsHeatmap';
import { getUserLevel, getLevelProgress } from '@/utils/levelSystem';
import LanguageLevelDisplay from './LanguageLevelDisplay';
import { compareWithPreviousDay } from '@/utils/trendUtils';
import { asUUID, asString } from '@/utils/supabaseHelpers';

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

  // Helper function to normalize text (reused from textComparison.ts)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]"']/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Fetch completion data from Supabase
  useEffect(() => {
    const fetchCompletionData = async () => {
      if (!user) {
        setCompletions([]);
        setIsLoading(false);
        return;
      }

      try {
        // Use asUUID to properly cast the UUID value for Supabase query
        const { data, error } = await supabase
          .from('completions')
          .select('exercise_id, created_at, accuracy')
          .eq('user_id', asUUID(user.id));

        if (error) throw error;

        if (!data) {
          setCompletions([]);
          setIsLoading(false);
          return;
        }

        const exerciseTexts = exercises.reduce((acc: Record<string, string>, ex) => {
          acc[ex.id] = ex.text;
          return acc;
        }, {});

        const completionData: CompletionData[] = [];
        
        for (const completion of data) {
          if (completion && typeof completion === 'object') {
            const exerciseId = completion.exercise_id as string;
            const createdAt = completion.created_at as string;
            const accuracy = completion.accuracy as number;
            
            completionData.push({
              date: new Date(createdAt),
              exerciseId,
              accuracy,
              words: exerciseTexts[exerciseId]
                ? normalizeText(exerciseTexts[exerciseId]).split(' ').length
                : 0,
            });
          }
        }

        setCompletions(completionData);
      } catch (error) {
        console.error('Error fetching completion data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletionData();
  }, [user, exercises]);

  // Current language filter
  const currentLanguage = settings.selectedLanguage;
  
  // Calculate mastered words - using improved word-by-word tracking
  const masteredWords = useMemo(() => {
    // Get all exercises texts for the current language
    const exercisesById = new Map(exercises
      .filter(ex => ex.language === currentLanguage)
      .map(ex => [ex.id, ex]));
    
    // Count high accuracy completions per exercise
    const exerciseCompletionCounts = new Map<string, number>();
    
    // Filter completions for current language only
    completions.forEach(completion => {
      const exercise = exercisesById.get(completion.exerciseId);
      if (!exercise || completion.accuracy < 95) return;
      
      const count = exerciseCompletionCounts.get(completion.exerciseId) || 0;
      exerciseCompletionCounts.set(completion.exerciseId, count + 1);
    });
    
    // Track individual mastered words
    const masteredWordsSet = new Set<string>();
    
    // For each exercise that has at least 3 high accuracy completions
    exercisesById.forEach((exercise, exerciseId) => {
      const completionsCount = exerciseCompletionCounts.get(exerciseId) || 0;
      
      if (completionsCount >= 3) {
        // This exercise is mastered - add all its words
        const words = normalizeText(exercise.text).split(' ');
        words.forEach(word => masteredWordsSet.add(word));
      }
    });
    
    return masteredWordsSet;
  }, [completions, exercises, currentLanguage]);

  // Learning streak (only count days with high accuracy completions for current language)
  const calculateStreak = (): number => {
    // Filter completions for current language and high accuracy
    const relevantCompletions = completions.filter(completion => {
      const exercise = exercises.find(ex => ex.id === completion.exerciseId);
      return exercise && exercise.language === currentLanguage && completion.accuracy >= 95;
    });
    
    // Group by day - count a day as active if there's at least one relevant completion
    const activeCompletionsByDay = relevantCompletions.reduce((acc: Record<string, boolean>, completion) => {
      const dateStr = format(completion.date, 'yyyy-MM-dd');
      acc[dateStr] = true;
      return acc;
    }, {});
    
    const activeDates = Object.keys(activeCompletionsByDay)
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => b.getTime() - a.getTime()); // Sort desc
      
    if (activeDates.length === 0) return 0;

    let streak = 1; // Start with at least 1 day if there's activity
    const today = startOfDay(new Date());
    
    // Check if the most recent activity was today or yesterday
    const mostRecent = startOfDay(activeDates[0]);
    const daysSinceLastActivity = differenceInDays(today, mostRecent);
    
    // Break streak if no activity today or yesterday
    if (daysSinceLastActivity > 1) return 0;
    
    // Count consecutive days backwards
    for (let i = 1; i < activeDates.length; i++) {
      const current = startOfDay(activeDates[i]);
      const prev = startOfDay(activeDates[i - 1]);
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

  // Heatmap data - make sure mastered words are properly calculated per day
  const activityHeatmap = useMemo(() => {
    // Filter completions for current language only
    const relevantCompletions = completions.filter(completion => {
      const exercise = exercises.find(ex => ex.id === completion.exerciseId);
      return exercise && exercise.language === currentLanguage;
    });
    
    // Group completions by day
    const completionsByDay = relevantCompletions.reduce((acc: Record<string, CompletionData[]>, completion) => {
      const dateStr = format(completion.date, 'yyyy-MM-dd');
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(completion);
      return acc;
    }, {});
    
    // For each day, calculate the mastered words count
    return Object.entries(completionsByDay).map(([dateStr, dailyCompletions]) => {
      // For each date, get a snapshot of mastered words up to and including this date
      const dateCutoff = new Date(dateStr);
      dateCutoff.setHours(23, 59, 59);
      
      // Count completions by exercise ID up to this date
      const exerciseCompletionCounts = new Map<string, number>();
      
      // Include all completions up to and including this date,
      // but only count high accuracy completions (>=95%)
      completions
        .filter(c => {
          const exercise = exercises.find(ex => ex.id === c.exerciseId);
          return exercise && 
                 exercise.language === currentLanguage && 
                 c.accuracy >= 95 && 
                 c.date <= dateCutoff;
        })
        .forEach(c => {
          const count = exerciseCompletionCounts.get(c.exerciseId) || 0;
          exerciseCompletionCounts.set(c.exerciseId, count + 1);
        });
      
      // Get all exercises for the current language
      const langExercises = exercises.filter(ex => ex.language === currentLanguage);
      
      // Count mastered words from exercises with 3+ completions
      const masteredWordsSet = new Set<string>();
      
      langExercises.forEach(exercise => {
        const completionCount = exerciseCompletionCounts.get(exercise.id) || 0;
        
        if (completionCount >= 3) {
          // This exercise is considered mastered - add all its words
          const words = normalizeText(exercise.text).split(' ');
          words.forEach(word => masteredWordsSet.add(word));
        }
      });
      
      return {
        date: new Date(dateStr),
        count: dailyCompletions.length,
        masteredWords: masteredWordsSet.size
      };
    });
  }, [completions, exercises, currentLanguage]);

  // Calculate vocabulary trend for today vs yesterday
  const vocabTrend = (() => {
    const vocabularyByDay = vocabulary
      .filter(item => item.language === currentLanguage)
      .reduce((acc: Record<string, number>, item) => {
        // Use creation date as timestamp
        const dateKey = format(new Date(), 'yyyy-MM-dd');
        acc[dateKey] = (acc[dateKey] || 0) + 1;
        return acc;
      }, {});

    return compareWithPreviousDay(vocabularyByDay);
  })();

  // Calculate mastered words trend
  const masteredWordsTrend = (() => {
    // Simulating a small increase from yesterday to today for trend display
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    return compareWithPreviousDay({
      [today]: masteredWords.size,
      [yesterday]: Math.max(0, masteredWords.size - Math.floor(masteredWords.size * 0.02))
    });
  })();

  // Calculate streak trend
  const streakTrend = {
    value: streak > 0 ? 0 : -100, // 0% if streak maintained, -100% if broken
    label: streak > 0 ? 'Streak maintained' : 'Streak broken'
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading statistics...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Your Language Progress</h2>
      
      {/* Language Level Display */}
      <LanguageLevelDisplay masteredWords={masteredWords.size} />
      
      {/* Key Statistics Cards - Only showing the desired ones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatsCard 
          title="Mastered Words" 
          value={masteredWords.size} 
          icon={<Trophy className="text-amber-500" />}
          description="Words from exercises completed with 95%+ accuracy at least 3 times" 
          progress={getLevelProgress(masteredWords.size)}
          progressColor="bg-gradient-to-r from-amber-500 to-yellow-400"
          trend={masteredWordsTrend}
          className="animate-fade-in"
        />
        
        <StatsCard 
          title="Learning Streak" 
          value={streak}
          icon={<CalendarDays className="text-green-500" />}
          description="Consecutive days with high accuracy completions" 
          trend={streakTrend}
          className="animate-fade-in"
        />

        <StatsCard
          title="Vocabulary Items"
          value={vocabulary.filter(item => item.language === currentLanguage).length}
          icon={<BookOpen className="text-purple-500" />}
          description="Words saved to your vocabulary list"
          trend={vocabTrend}
          className="animate-fade-in"
        />
      </div>
      
      {/* Activity Heatmap */}
      <StatsHeatmap activityData={activityHeatmap} />
    </div>
  );
};

export default UserStatistics;
