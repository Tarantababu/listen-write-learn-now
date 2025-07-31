
import { supabase } from '@/integrations/supabase/client';
import { DifficultyLevel, SentenceMiningProgress } from '@/types/sentence-mining';

export interface DifficultyAnalysis {
  currentLevel: DifficultyLevel;
  suggestedLevel: DifficultyLevel;
  shouldAdjust: boolean;
  confidence: number;
  reasons: string[];
}

export interface PerformanceMetrics {
  recentAccuracy: number;
  streakLength: number;
  averageCompletionTime: number;
  difficultyDistribution: Record<DifficultyLevel, { attempts: number; accuracy: number }>;
}

export class AdaptiveDifficultyEngine {
  private static readonly ADJUSTMENT_THRESHOLD = 0.15; // 15% confidence threshold
  private static readonly HIGH_ACCURACY_THRESHOLD = 85;
  private static readonly LOW_ACCURACY_THRESHOLD = 60;

  static async analyzeUserPerformance(
    userId: string, 
    language: string, 
    currentDifficulty: DifficultyLevel
  ): Promise<DifficultyAnalysis> {
    const performanceMetrics = await this.getPerformanceMetrics(userId, language);
    
    const analysis: DifficultyAnalysis = {
      currentLevel: currentDifficulty,
      suggestedLevel: currentDifficulty,
      shouldAdjust: false,
      confidence: 0,
      reasons: []
    };

    // Analyze recent performance
    if (performanceMetrics.recentAccuracy >= this.HIGH_ACCURACY_THRESHOLD) {
      const nextLevel = this.getNextDifficultyLevel(currentDifficulty);
      if (nextLevel !== currentDifficulty) {
        analysis.suggestedLevel = nextLevel;
        analysis.shouldAdjust = true;
        analysis.confidence += 0.3;
        analysis.reasons.push(`High accuracy (${performanceMetrics.recentAccuracy}%) suggests readiness for ${nextLevel}`);
      }
    }

    if (performanceMetrics.recentAccuracy <= this.LOW_ACCURACY_THRESHOLD) {
      const prevLevel = this.getPreviousDifficultyLevel(currentDifficulty);
      if (prevLevel !== currentDifficulty) {
        analysis.suggestedLevel = prevLevel;
        analysis.shouldAdjust = true;
        analysis.confidence += 0.4;
        analysis.reasons.push(`Low accuracy (${performanceMetrics.recentAccuracy}%) suggests ${prevLevel} would be more appropriate`);
      }
    }

    // Consider streak performance
    if (performanceMetrics.streakLength >= 5) {
      analysis.confidence += 0.2;
      analysis.reasons.push(`Strong streak of ${performanceMetrics.streakLength} suggests good mastery`);
    }

    // Only suggest adjustment if confidence is high enough
    analysis.shouldAdjust = analysis.shouldAdjust && analysis.confidence >= this.ADJUSTMENT_THRESHOLD;

    return analysis;
  }

  private static async getPerformanceMetrics(userId: string, language: string): Promise<PerformanceMetrics> {
    // Get recent session data (last 10 sessions)
    const { data: recentSessions } = await supabase
      .from('sentence_mining_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('language', language)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!recentSessions || recentSessions.length === 0) {
      return {
        recentAccuracy: 0,
        streakLength: 0,
        averageCompletionTime: 0,
        difficultyDistribution: {
          beginner: { attempts: 0, accuracy: 0 },
          intermediate: { attempts: 0, accuracy: 0 },
          advanced: { attempts: 0, accuracy: 0 }
        }
      };
    }

    const totalExercises = recentSessions.reduce((sum, s) => sum + s.total_exercises, 0);
    const totalCorrect = recentSessions.reduce((sum, s) => sum + s.correct_exercises, 0);
    const recentAccuracy = totalExercises > 0 ? Math.round((totalCorrect / totalExercises) * 100) : 0;

    // Calculate streak (simplified)
    let streakLength = 0;
    for (const session of recentSessions) {
      const sessionAccuracy = session.total_exercises > 0 
        ? (session.correct_exercises / session.total_exercises) * 100 
        : 0;
      if (sessionAccuracy >= 70) {
        streakLength++;
      } else {
        break;
      }
    }

    // Calculate difficulty distribution
    const difficultyDistribution: Record<DifficultyLevel, { attempts: number; accuracy: number }> = {
      beginner: { attempts: 0, accuracy: 0 },
      intermediate: { attempts: 0, accuracy: 0 },
      advanced: { attempts: 0, accuracy: 0 }
    };

    recentSessions.forEach(session => {
      const level = session.difficulty_level as DifficultyLevel;
      const accuracy = session.total_exercises > 0 
        ? (session.correct_exercises / session.total_exercises) * 100 
        : 0;
      
      difficultyDistribution[level].attempts += session.total_exercises;
      difficultyDistribution[level].accuracy = accuracy;
    });

    return {
      recentAccuracy,
      streakLength,
      averageCompletionTime: 25, // Placeholder
      difficultyDistribution
    };
  }

  protected static getNextDifficultyLevel(current: DifficultyLevel): DifficultyLevel {
    switch (current) {
      case 'beginner': return 'intermediate';
      case 'intermediate': return 'advanced';
      case 'advanced': return 'advanced';
      default: return current;
    }
  }

  protected static getPreviousDifficultyLevel(current: DifficultyLevel): DifficultyLevel {
    switch (current) {
      case 'advanced': return 'intermediate';
      case 'intermediate': return 'beginner';
      case 'beginner': return 'beginner';
      default: return current;
    }
  }

  static async recordDifficultyAdjustment(
    userId: string, 
    language: string, 
    fromLevel: DifficultyLevel, 
    toLevel: DifficultyLevel,
    reason: string
  ): Promise<void> {
    console.log(`Difficulty adjusted for user ${userId}: ${fromLevel} -> ${toLevel}. Reason: ${reason}`);
    // Could store this in a separate table for analytics
  }
}
