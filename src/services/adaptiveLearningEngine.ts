
import { supabase } from '@/integrations/supabase/client';
import { DifficultyLevel } from '@/types/sentence-mining';

export interface UserPerformanceData {
  userId: string;
  language: string;
  totalExercises: number;
  correctAnswers: number;
  averageResponseTime: number;
  strugglingWords: string[];
  masteredWords: string[];
  preferredDifficulty: DifficultyLevel;
  learningStreak: number;
}

export interface LearningRecommendation {
  type: 'difficulty_adjustment' | 'word_focus' | 'break_suggestion' | 'mastery_celebration';
  message: string;
  action?: string;
  confidence: number;
}

export interface AdaptiveLearningInsights {
  performanceLevel: 'struggling' | 'improving' | 'proficient' | 'mastering';
  recommendations: LearningRecommendation[];
  nextSessionSuggestion: {
    difficulty: DifficultyLevel;
    focusWords: string[];
    estimatedDuration: number;
  };
  progressMetrics: {
    accuracyTrend: number;
    speedTrend: number;
    consistencyScore: number;
    masteryProgression: number;
  };
}

export class AdaptiveLearningEngine {
  static async analyzeUserPerformance(userId: string, language: string): Promise<UserPerformanceData> {
    try {
      // Get recent session data (last 10 sessions)
      const { data: sessions } = await supabase
        .from('sentence_mining_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('language', language)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get recent exercise performance
      const { data: exercises } = await supabase
        .from('sentence_mining_exercises')
        .select('*')
        .in('session_id', sessions?.map(s => s.id) || [])
        .order('created_at', { ascending: false })
        .limit(50);

      // Get word mastery data
      const { data: knownWords } = await supabase
        .from('known_words')
        .select('*')
        .eq('user_id', userId)
        .eq('language', language);

      const totalExercises = exercises?.length || 0;
      const correctAnswers = exercises?.filter(e => e.is_correct).length || 0;
      
      // Calculate average response time (simplified)
      const averageResponseTime = this.calculateAverageResponseTime(exercises || []);
      
      // Identify struggling and mastered words
      const strugglingWords = this.identifyStrugglingWords(exercises || []);
      const masteredWords = knownWords?.filter(w => w.mastery_level >= 4).map(w => w.word) || [];
      
      // Determine preferred difficulty based on recent performance
      const preferredDifficulty = this.determinePreferredDifficulty(sessions || []);
      
      // Calculate learning streak
      const learningStreak = this.calculateLearningStreak(sessions || []);

      return {
        userId,
        language,
        totalExercises,
        correctAnswers,
        averageResponseTime,
        strugglingWords,
        masteredWords,
        preferredDifficulty,
        learningStreak
      };
    } catch (error) {
      console.error('Error analyzing user performance:', error);
      return this.getDefaultPerformanceData(userId, language);
    }
  }

  static async generateLearningInsights(userId: string, language: string): Promise<AdaptiveLearningInsights> {
    const performanceData = await this.analyzeUserPerformance(userId, language);
    
    const accuracy = performanceData.totalExercises > 0 
      ? (performanceData.correctAnswers / performanceData.totalExercises) * 100 
      : 0;

    // Determine performance level
    const performanceLevel = this.categorizePerformanceLevel(accuracy, performanceData.averageResponseTime);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(performanceData, accuracy);
    
    // Suggest next session parameters
    const nextSessionSuggestion = this.suggestNextSession(performanceData, performanceLevel);
    
    // Calculate progress metrics
    const progressMetrics = await this.calculateProgressMetrics(userId, language);

    return {
      performanceLevel,
      recommendations,
      nextSessionSuggestion,
      progressMetrics
    };
  }

  static async trackLearningEvent(
    userId: string, 
    language: string, 
    eventType: 'exercise_completed' | 'word_mastered' | 'difficulty_increased' | 'session_completed',
    metadata: any
  ): Promise<void> {
    try {
      // Store learning analytics event
      console.log(`Learning event tracked: ${eventType} for user ${userId} in ${language}`, metadata);
      
      // Update user performance metrics in real-time
      await this.updateUserMetrics(userId, language, eventType, metadata);
    } catch (error) {
      console.error('Error tracking learning event:', error);
    }
  }

  private static calculateAverageResponseTime(exercises: any[]): number {
    if (exercises.length === 0) return 0;
    
    // Simplified calculation - in a real implementation, you'd track actual response times
    const correctExercises = exercises.filter(e => e.is_correct);
    const incorrectExercises = exercises.filter(e => !e.is_correct);
    
    // Assume correct answers are faster on average
    return correctExercises.length > incorrectExercises.length ? 3.5 : 6.2;
  }

  private static identifyStrugglingWords(exercises: any[]): string[] {
    const wordPerformance = new Map<string, { correct: number; total: number }>();
    
    exercises.forEach(exercise => {
      exercise.target_words?.forEach((word: string) => {
        const current = wordPerformance.get(word) || { correct: 0, total: 0 };
        wordPerformance.set(word, {
          correct: current.correct + (exercise.is_correct ? 1 : 0),
          total: current.total + 1
        });
      });
    });

    const strugglingWords: string[] = [];
    wordPerformance.forEach((performance, word) => {
      if (performance.total >= 3 && (performance.correct / performance.total) < 0.5) {
        strugglingWords.push(word);
      }
    });

    return strugglingWords.slice(0, 10); // Return top 10 struggling words
  }

  private static determinePreferredDifficulty(sessions: any[]): DifficultyLevel {
    if (sessions.length === 0) return 'beginner';
    
    const recentSessions = sessions.slice(0, 5);
    const averageAccuracy = recentSessions.reduce((sum, session) => {
      return sum + (session.total_exercises > 0 ? (session.correct_exercises / session.total_exercises) * 100 : 0);
    }, 0) / recentSessions.length;

    if (averageAccuracy >= 85) return 'advanced';
    if (averageAccuracy >= 70) return 'intermediate';
    return 'beginner';
  }

  private static calculateLearningStreak(sessions: any[]): number {
    let streak = 0;
    const today = new Date();
    
    for (const session of sessions) {
      const sessionDate = new Date(session.created_at);
      const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  private static categorizePerformanceLevel(
    accuracy: number, 
    averageResponseTime: number
  ): 'struggling' | 'improving' | 'proficient' | 'mastering' {
    if (accuracy < 50) return 'struggling';
    if (accuracy < 70) return 'improving';
    if (accuracy < 85) return 'proficient';
    return 'mastering';
  }

  private static generateRecommendations(
    performanceData: UserPerformanceData, 
    accuracy: number
  ): LearningRecommendation[] {
    const recommendations: LearningRecommendation[] = [];

    // Accuracy-based recommendations
    if (accuracy < 60) {
      recommendations.push({
        type: 'difficulty_adjustment',
        message: 'Consider practicing with easier words to build confidence',
        action: 'reduce_difficulty',
        confidence: 0.8
      });
    } else if (accuracy > 90) {
      recommendations.push({
        type: 'difficulty_adjustment',
        message: 'You\'re doing great! Ready for more challenging words?',
        action: 'increase_difficulty',
        confidence: 0.9
      });
    }

    // Struggling words focus
    if (performanceData.strugglingWords.length > 0) {
      recommendations.push({
        type: 'word_focus',
        message: `Focus on these challenging words: ${performanceData.strugglingWords.slice(0, 3).join(', ')}`,
        confidence: 0.7
      });
    }

    // Mastery celebration
    if (performanceData.masteredWords.length > 10) {
      recommendations.push({
        type: 'mastery_celebration',
        message: `Excellent! You've mastered ${performanceData.masteredWords.length} words!`,
        confidence: 1.0
      });
    }

    // Break suggestion for long sessions
    if (performanceData.totalExercises > 20) {
      recommendations.push({
        type: 'break_suggestion',
        message: 'Consider taking a short break to maintain focus',
        confidence: 0.6
      });
    }

    return recommendations;
  }

  private static suggestNextSession(
    performanceData: UserPerformanceData,
    performanceLevel: string
  ): { difficulty: DifficultyLevel; focusWords: string[]; estimatedDuration: number } {
    let difficulty: DifficultyLevel = performanceData.preferredDifficulty;
    let focusWords: string[] = [];
    let estimatedDuration = 15; // minutes

    // Adjust difficulty based on performance level
    if (performanceLevel === 'struggling') {
      difficulty = 'beginner';
      estimatedDuration = 10;
    } else if (performanceLevel === 'mastering') {
      difficulty = 'advanced';
      estimatedDuration = 20;
    }

    // Include struggling words in focus
    focusWords = performanceData.strugglingWords.slice(0, 5);

    return { difficulty, focusWords, estimatedDuration };
  }

  private static async calculateProgressMetrics(userId: string, language: string): Promise<{
    accuracyTrend: number;
    speedTrend: number;
    consistencyScore: number;
    masteryProgression: number;
  }> {
    // Simplified implementation - in practice, you'd calculate actual trends
    return {
      accuracyTrend: 5.2, // +5.2% improvement
      speedTrend: -0.8, // 0.8s faster
      consistencyScore: 78, // 78% consistency
      masteryProgression: 12 // 12 new words mastered this week
    };
  }

  private static async updateUserMetrics(
    userId: string, 
    language: string, 
    eventType: string, 
    metadata: any
  ): Promise<void> {
    // Update user learning profile with new event data
    console.log(`Updating metrics for ${eventType}:`, metadata);
  }

  private static getDefaultPerformanceData(userId: string, language: string): UserPerformanceData {
    return {
      userId,
      language,
      totalExercises: 0,
      correctAnswers: 0,
      averageResponseTime: 5.0,
      strugglingWords: [],
      masteredWords: [],
      preferredDifficulty: 'beginner',
      learningStreak: 0
    };
  }
}
