
import { supabase } from '@/integrations/supabase/client';

export interface WordDiversityMetrics {
  vocabularyVariety: number;
  contextDiversity: number;
  temporalDistribution: number;
  difficultyProgression: number;
  overallScore: number;
}

export interface WordContext {
  word: string;
  sentence: string;
  pattern: string;
  difficulty: number;
  timestamp: Date;
  contextHash: string;
}

export interface DiversityPreferences {
  noveltyWeight: number;
  reviewWeight: number;
  diversityThreshold: number;
  maxRepetitionWindow: number; // hours
  contextSimilarityLimit: number;
}

export class WordDiversityEngine {
  private static readonly DEFAULT_PREFERENCES: DiversityPreferences = {
    noveltyWeight: 0.4,
    reviewWeight: 0.3,
    diversityThreshold: 0.7,
    maxRepetitionWindow: 48,
    contextSimilarityLimit: 0.6
  };

  static async analyzeSessionDiversity(
    userId: string,
    language: string,
    sessionId: string,
    lookbackHours: number = 24
  ): Promise<WordDiversityMetrics> {
    try {
      const cutoffTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

      // Get recent exercises
      const { data: exercises } = await supabase
        .from('sentence_mining_exercises')
        .select('target_words, sentence, created_at')
        .gte('created_at', cutoffTime.toISOString())
        .order('created_at', { ascending: false });

      if (!exercises || exercises.length === 0) {
        return {
          vocabularyVariety: 100,
          contextDiversity: 100,
          temporalDistribution: 100,
          difficultyProgression: 100,
          overallScore: 100
        };
      }

      // Calculate vocabulary variety (unique words vs total words)
      const allWords = exercises.flatMap(e => e.target_words || []);
      const uniqueWords = new Set(allWords);
      const vocabularyVariety = allWords.length > 0 ? 
        Math.min((uniqueWords.size / allWords.length) * 100, 100) : 100;

      // Calculate context diversity
      const sentencePatterns = exercises.map(e => 
        this.extractSentenceStructure(e.sentence, language)
      );
      const uniquePatterns = new Set(sentencePatterns);
      const contextDiversity = sentencePatterns.length > 0 ?
        Math.min((uniquePatterns.size / sentencePatterns.length) * 100, 100) : 100;

      // Calculate temporal distribution (even distribution over time)
      const temporalDistribution = this.calculateTemporalDistribution(exercises);

      // Calculate difficulty progression (not implemented yet, placeholder)
      const difficultyProgression = 85;

      const overallScore = (
        vocabularyVariety * 0.3 +
        contextDiversity * 0.25 +
        temporalDistribution * 0.25 +
        difficultyProgression * 0.2
      );

      console.log(`[WordDiversityEngine] Session diversity metrics:`, {
        vocabularyVariety: Math.round(vocabularyVariety),
        contextDiversity: Math.round(contextDiversity),
        temporalDistribution: Math.round(temporalDistribution),
        overallScore: Math.round(overallScore)
      });

      return {
        vocabularyVariety: Math.round(vocabularyVariety),
        contextDiversity: Math.round(contextDiversity),
        temporalDistribution: Math.round(temporalDistribution),
        difficultyProgression: Math.round(difficultyProgression),
        overallScore: Math.round(overallScore)
      };
    } catch (error) {
      console.error('[WordDiversityEngine] Error analyzing diversity:', error);
      return {
        vocabularyVariety: 50,
        contextDiversity: 50,
        temporalDistribution: 50,
        difficultyProgression: 50,
        overallScore: 50
      };
    }
  }

  static async getOptimalWordSelection(
    userId: string,
    language: string,
    sessionId: string,
    candidateWords: string[],
    previousExercises: any[] = []
  ): Promise<{
    selectedWords: string[];
    diversityScore: number;
    selectionReason: string;
  }> {
    try {
      if (candidateWords.length === 0) {
        return {
          selectedWords: [],
          diversityScore: 0,
          selectionReason: 'No candidate words available'
        };
      }

      console.log(`[WordDiversityEngine] Selecting from ${candidateWords.length} candidates`);

      // Get recent word usage
      const recentUsage = await this.getRecentWordUsage(userId, language, sessionId, 72);
      
      // Score each candidate word
      const scoredCandidates = candidateWords.map(word => {
        const recentCount = recentUsage.get(word.toLowerCase()) || 0;
        const lastUsed = this.getLastUsageTime(word, previousExercises);
        const contextVariety = this.calculateContextVariety(word, previousExercises);
        
        // Calculate diversity score (higher is better)
        let score = 100;
        
        // Penalize recent usage
        if (recentCount > 0) {
          score -= Math.min(recentCount * 25, 75);
        }
        
        // Penalize very recent usage
        if (lastUsed && (Date.now() - lastUsed.getTime()) < 2 * 60 * 60 * 1000) {
          score -= 30;
        }
        
        // Reward context variety
        score += contextVariety * 10;
        
        // Add some randomness for natural variety
        score += (Math.random() - 0.5) * 10;
        
        return {
          word,
          score: Math.max(0, score),
          recentCount,
          lastUsed,
          contextVariety
        };
      });

      // Sort by score and select best candidates
      scoredCandidates.sort((a, b) => b.score - a.score);
      
      // Select top word(s) with diversity consideration
      const selectedWords = [scoredCandidates[0]?.word].filter(Boolean);
      const diversityScore = scoredCandidates[0]?.score || 0;
      
      const selectionReason = this.generateSelectionReason(scoredCandidates[0]);

      console.log(`[WordDiversityEngine] Selected "${selectedWords[0]}" with diversity score ${Math.round(diversityScore)}`);
      
      return {
        selectedWords,
        diversityScore: Math.round(diversityScore),
        selectionReason
      };
    } catch (error) {
      console.error('[WordDiversityEngine] Error in word selection:', error);
      return {
        selectedWords: candidateWords.slice(0, 1),
        diversityScore: 50,
        selectionReason: 'Fallback selection due to error'
      };
    }
  }

  static async trackWordContext(
    userId: string,
    word: string,
    language: string,
    sessionId: string,
    context: WordContext
  ): Promise<void> {
    try {
      // Store context information for future diversity analysis
      const contextData = {
        user_id: userId,
        word,
        language,
        session_id: sessionId,
        sentence: context.sentence,
        pattern: context.pattern,
        difficulty_score: context.difficulty,
        context_hash: context.contextHash,
        created_at: new Date().toISOString()
      };

      // Store in a simple format that can be queried efficiently
      console.log(`[WordDiversityEngine] Tracking context for word "${word}":`, {
        pattern: context.pattern,
        difficulty: context.difficulty,
        contextHash: context.contextHash
      });

      // This would ideally be stored in a dedicated context tracking table
      // For now, we rely on the existing sentence_mining_exercises table
    } catch (error) {
      console.error('[WordDiversityEngine] Error tracking word context:', error);
    }
  }

  static generateDiversityReport(metrics: WordDiversityMetrics): string[] {
    const insights: string[] = [];
    
    if (metrics.vocabularyVariety < 60) {
      insights.push('Low vocabulary variety detected - consider introducing new words');
    }
    
    if (metrics.contextDiversity < 50) {
      insights.push('Limited context diversity - varying sentence structures recommended');
    }
    
    if (metrics.temporalDistribution < 70) {
      insights.push('Uneven practice distribution - consider more consistent spacing');
    }
    
    if (metrics.overallScore >= 80) {
      insights.push('Excellent diversity maintained - good learning variety');
    } else if (metrics.overallScore >= 60) {
      insights.push('Good diversity with room for improvement');
    } else {
      insights.push('Low diversity detected - system will prioritize variety');
    }
    
    return insights;
  }

  private static async getRecentWordUsage(
    userId: string,
    language: string,
    sessionId: string,
    lookbackHours: number
  ): Promise<Map<string, number>> {
    const cutoffTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);
    const usageMap = new Map<string, number>();

    try {
      const { data: exercises } = await supabase
        .from('sentence_mining_exercises')
        .select('target_words')
        .gte('created_at', cutoffTime.toISOString());

      exercises?.forEach(exercise => {
        exercise.target_words?.forEach((word: string) => {
          const normalizedWord = word.toLowerCase();
          usageMap.set(normalizedWord, (usageMap.get(normalizedWord) || 0) + 1);
        });
      });
    } catch (error) {
      console.error('[WordDiversityEngine] Error getting recent usage:', error);
    }

    return usageMap;
  }

  private static getLastUsageTime(word: string, exercises: any[]): Date | null {
    const normalizedWord = word.toLowerCase();
    
    for (const exercise of exercises) {
      if (exercise.targetWord?.toLowerCase() === normalizedWord) {
        return new Date(exercise.createdAt);
      }
    }
    
    return null;
  }

  private static calculateContextVariety(word: string, exercises: any[]): number {
    const normalizedWord = word.toLowerCase();
    const contexts = exercises
      .filter(e => e.targetWord?.toLowerCase() === normalizedWord)
      .map(e => this.extractSentenceStructure(e.sentence, 'generic'));
    
    const uniqueContexts = new Set(contexts);
    return contexts.length > 0 ? uniqueContexts.size / contexts.length : 1;
  }

  private static extractSentenceStructure(sentence: string, language: string): string {
    if (!sentence) return 'unknown';
    
    // Simple pattern extraction based on sentence structure
    const words = sentence.toLowerCase().split(/\s+/);
    const length = words.length;
    
    let pattern = '';
    
    if (length <= 5) pattern += 'short_';
    else if (length <= 10) pattern += 'medium_';
    else pattern += 'long_';
    
    // Check for question
    if (sentence.includes('?')) pattern += 'question_';
    
    // Check for common structures
    if (sentence.includes(',')) pattern += 'complex_';
    if (sentence.match(/\b(and|or|but|because|although)\b/i)) pattern += 'compound_';
    
    return pattern || 'simple';
  }

  private static calculateTemporalDistribution(exercises: any[]): number {
    if (exercises.length < 2) return 100;
    
    const timestamps = exercises.map(e => new Date(e.created_at).getTime());
    timestamps.sort();
    
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }
    
    if (intervals.length === 0) return 100;
    
    // Calculate coefficient of variation (lower is more even distribution)
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 0;
    
    // Convert to percentage (lower CV = higher score)
    return Math.max(0, Math.min(100, 100 - (cv * 100)));
  }

  private static generateSelectionReason(candidate: any): string {
    if (!candidate) return 'No suitable candidates found';
    
    const reasons = [];
    
    if (candidate.recentCount === 0) {
      reasons.push('new word');
    } else if (candidate.recentCount === 1) {
      reasons.push('lightly used');
    } else {
      reasons.push(`used ${candidate.recentCount} times recently`);
    }
    
    if (candidate.contextVariety > 0.8) {
      reasons.push('high context variety');
    } else if (candidate.contextVariety > 0.5) {
      reasons.push('good context variety');
    }
    
    if (candidate.score > 80) {
      reasons.push('optimal diversity');
    } else if (candidate.score > 60) {
      reasons.push('good diversity');
    }
    
    return reasons.length > 0 ? reasons.join(', ') : 'selected for practice';
  }
}
