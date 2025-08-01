
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Target, Clock, TrendingUp, BookOpen, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AdaptiveInsights {
  totalWordsLearned: number;
  wordsInReview: number;
  strugglingWords: number;
  masteredWords: number;
  averageMastery: number;
  recentAccuracy: number;
  nextReviewsToday: number;
  adaptiveQuality: number;
}

interface AdaptiveLearningInsightsProps {
  language: string;
  sessionId?: string;
}

export const AdaptiveLearningInsights: React.FC<AdaptiveLearningInsightsProps> = ({ 
  language, 
  sessionId 
}) => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<AdaptiveInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAdaptiveInsights();
    }
  }, [user, language, sessionId]);

  const loadAdaptiveInsights = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get word performance data
      const { data: knownWords, error: wordsError } = await supabase
        .from('known_words')
        .select('*')
        .eq('user_id', user.id)
        .eq('language', language);

      if (wordsError) throw wordsError;

      // Get recent exercise performance
      const { data: recentExercises, error: exercisesError } = await supabase
        .from('sentence_mining_exercises')
        .select('is_correct, created_at')
        .in('session_id', 
          await supabase
            .from('sentence_mining_sessions')
            .select('id')
            .eq('user_id', user.id)
            .eq('language', language)
            .order('created_at', { ascending: false })
            .limit(5)
            .then(res => res.data?.map(s => s.id) || [])
        )
        .order('created_at', { ascending: false })
        .limit(20);

      if (exercisesError) throw exercisesError;

      // Calculate insights
      const totalWordsLearned = knownWords?.length || 0;
      const today = new Date().toISOString().split('T')[0];
      
      const wordsInReview = knownWords?.filter(w => 
        w.next_review_date && w.next_review_date <= today
      ).length || 0;

      const strugglingWords = knownWords?.filter(w => {
        const accuracy = w.review_count > 0 ? w.correct_count / w.review_count : 0;
        return accuracy < 0.6 && w.review_count >= 3;
      }).length || 0;

      const masteredWords = knownWords?.filter(w => 
        w.mastery_level >= 5 && w.correct_count >= 5
      ).length || 0;

      const averageMastery = totalWordsLearned > 0 
        ? knownWords!.reduce((sum, w) => sum + w.mastery_level, 0) / totalWordsLearned
        : 0;

      const recentCorrect = recentExercises?.filter(ex => ex.is_correct).length || 0;
      const recentAccuracy = recentExercises?.length 
        ? (recentCorrect / recentExercises.length) * 100 
        : 0;

      const nextReviewsToday = knownWords?.filter(w => 
        w.next_review_date === today
      ).length || 0;

      // Calculate adaptive quality score
      const adaptiveQuality = Math.min(100, Math.max(0, 
        (averageMastery * 10) + 
        (recentAccuracy * 0.5) + 
        (masteredWords * 2) - 
        (strugglingWords * 3)
      ));

      setInsights({
        totalWordsLearned,
        wordsInReview,
        strugglingWords,
        masteredWords,
        averageMastery,
        recentAccuracy,
        nextReviewsToday,
        adaptiveQuality
      });

    } catch (error) {
      console.error('Error loading adaptive insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Adaptive Learning Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) return null;

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          Adaptive Learning Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Learning Progress</span>
            <Badge variant={insights.adaptiveQuality >= 70 ? 'default' : 'secondary'}>
              {Math.round(insights.adaptiveQuality)}% Quality
            </Badge>
          </div>
          <Progress value={insights.adaptiveQuality} className="h-2" />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <span>Words Learned</span>
              </div>
              <Badge variant="outline">{insights.totalWordsLearned}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                <span>Mastered</span>
              </div>
              <Badge variant="outline" className="text-green-600">
                {insights.masteredWords}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-orange-500" />
                <span>Struggling</span>
              </div>
              <Badge variant="outline" className="text-orange-600">
                {insights.strugglingWords}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-500" />
                <span>Due Today</span>
              </div>
              <Badge variant="outline" className="text-purple-600">
                {insights.nextReviewsToday}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span>Recent Accuracy</span>
              </div>
              <Badge 
                variant="outline" 
                className={insights.recentAccuracy >= 70 ? "text-green-600" : "text-yellow-600"}
              >
                {Math.round(insights.recentAccuracy)}%
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span>Avg Mastery</span>
              <Badge variant="outline">
                {insights.averageMastery.toFixed(1)}/10
              </Badge>
            </div>
          </div>
        </div>

        {/* Adaptive Features Status */}
        <div className="pt-4 border-t space-y-2">
          <div className="text-xs text-muted-foreground font-medium">ACTIVE FEATURES</div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              <Brain className="h-3 w-3 mr-1" />
              Smart Word Selection
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              Spaced Repetition
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Word Cooldown
            </Badge>
          </div>
        </div>

        {/* Next Actions */}
        {(insights.nextReviewsToday > 0 || insights.strugglingWords > 0) && (
          <div className="pt-4 border-t space-y-2">
            <div className="text-xs text-muted-foreground font-medium">RECOMMENDATIONS</div>
            <div className="space-y-1 text-xs">
              {insights.nextReviewsToday > 0 && (
                <div className="flex items-center gap-2 text-purple-600">
                  <Clock className="h-3 w-3" />
                  {insights.nextReviewsToday} words are due for review today
                </div>
              )}
              {insights.strugglingWords > 0 && (
                <div className="flex items-center gap-2 text-orange-600">
                  <RefreshCw className="h-3 w-3" />
                  Focus on {insights.strugglingWords} struggling words
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
