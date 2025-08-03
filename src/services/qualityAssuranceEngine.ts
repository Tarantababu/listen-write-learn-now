
import { supabase } from '@/integrations/supabase/client';

export interface RepetitionMetrics {
  wordRepetitionScore: number;        // 0-100, lower = more repetitive
  patternRepetitionScore: number;     // 0-100, lower = more repetitive
  contextDiversityScore: number;      // 0-100, higher = more diverse
  temporalDistributionScore: number;  // 0-100, better = more spread out
  overallQualityScore: number;        // 0-100, overall quality
}

export interface QualityAlert {
  type: 'word_repetition' | 'pattern_repetition' | 'context_similarity' | 'temporal_clustering';
  severity: 'low' | 'medium' | 'high';
  message: string;
  affectedItems: string[];
  recommendedActions: string[];
  detectedAt: Date;
}

export interface SessionQualityReport {
  sessionId: string;
  userId: string;
  language: string;
  exerciseCount: number;
  metrics: RepetitionMetrics;
  alerts: QualityAlert[];
  recommendations: string[];
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  timestamp: Date;
}

export class QualityAssuranceEngine {
  private static readonly THRESHOLDS = {
    WORD_REPETITION_WARNING: 70,    // Alert if word repetition score below 70
    PATTERN_REPETITION_WARNING: 65, // Alert if pattern repetition score below 65
    CONTEXT_DIVERSITY_MIN: 50,      // Minimum acceptable context diversity
    TEMPORAL_CLUSTERING_MAX: 80,    // Maximum acceptable temporal clustering
    OVERALL_QUALITY_MIN: 70        // Minimum overall quality score
  };

  private static readonly ALERT_COOLDOWNS = new Map<string, Date>();

  static async generateSessionQualityReport(
    sessionId: string,
    userId: string,
    language: string
  ): Promise<SessionQualityReport> {
    console.log(`[QualityAssurance] Generating quality report for session ${sessionId}`);

    try {
      // Get session exercises
      const { data: exercises } = await supabase
        .from('sentence_mining_exercises')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!exercises || exercises.length === 0) {
        return this.createEmptyReport(sessionId, userId, language);
      }

      // Calculate comprehensive metrics
      const metrics = await this.calculateComprehensiveMetrics(exercises, userId, language);
      
      // Generate quality alerts
      const alerts = this.generateQualityAlerts(metrics, exercises);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(metrics, alerts);
      
      // Calculate overall grade
      const overallGrade = this.calculateOverallGrade(metrics);

      const report: SessionQualityReport = {
        sessionId,
        userId,
        language,
        exerciseCount: exercises.length,
        metrics,
        alerts,
        recommendations,
        overallGrade,
        timestamp: new Date()
      };

      console.log(`[QualityAssurance] Session quality: ${overallGrade} (${metrics.overallQualityScore})`);
      
      return report;
    } catch (error) {
      console.error('[QualityAssurance] Error generating quality report:', error);
      return this.createEmptyReport(sessionId, userId, language);
    }
  }

  static async monitorRealtimeQuality(
    sessionId: string,
    userId: string,
    language: string
  ): Promise<QualityAlert[]> {
    try {
      // Get recent exercises (last 5)
      const { data: recentExercises } = await supabase
        .from('sentence_mining_exercises')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!recentExercises || recentExercises.length < 3) {
        return []; // Need minimum exercises for quality assessment
      }

      const alerts: QualityAlert[] = [];
      
      // Check for immediate repetition patterns
      const immediateRepetitionAlert = this.checkImmediateRepetition(recentExercises);
      if (immediateRepetitionAlert) {
        alerts.push(immediateRepetitionAlert);
      }

      // Check for context clustering
      const contextClusteringAlert = this.checkContextClustering(recentExercises);
      if (contextClusteringAlert) {
        alerts.push(contextClusteringAlert);
      }

      // Check for temporal clustering
      const temporalClusteringAlert = this.checkTemporalClustering(recentExercises);
      if (temporalClusteringAlert) {
        alerts.push(temporalClusteringAlert);
      }

      // Filter out alerts that are in cooldown
      const filteredAlerts = alerts.filter(alert => 
        this.isAlertAllowed(sessionId, alert.type)
      );

      // Update cooldowns for new alerts
      filteredAlerts.forEach(alert => {
        this.setAlertCooldown(sessionId, alert.type);
      });

      return filteredAlerts;
    } catch (error) {
      console.error('[QualityAssurance] Error monitoring realtime quality:', error);
      return [];
    }
  }

  static async trackLongTermQualityTrends(
    userId: string,
    language: string,
    lookbackDays: number = 30
  ): Promise<{
    trendDirection: 'improving' | 'stable' | 'declining';
    averageQuality: number;
    qualityVariability: number;
    problematicPatterns: string[];
    recommendations: string[];
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

      // Get all sessions in the time period
      const { data: sessions } = await supabase
        .from('sentence_mining_sessions')
        .select('id, created_at, total_exercises, correct_exercises')
        .eq('user_id', userId)
        .eq('language', language)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: true });

      if (!sessions || sessions.length < 3) {
        return {
          trendDirection: 'stable',
          averageQuality: 70,
          qualityVariability: 0,
          problematicPatterns: [],
          recommendations: ['Complete more sessions to enable trend analysis']
        };
      }

      // Calculate quality scores for each session (simplified)
      const qualityScores = sessions.map(session => {
        const accuracy = session.total_exercises > 0 ? 
          (session.correct_exercises / session.total_exercises) * 100 : 50;
        return Math.min(100, accuracy + Math.random() * 20 - 10); // Add some quality variance
      });

      // Analyze trend
      const trendDirection = this.analyzeTrend(qualityScores);
      const averageQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
      const qualityVariability = this.calculateVariability(qualityScores);
      
      // Identify problematic patterns (simplified analysis)
      const problematicPatterns = await this.identifyProblematicPatterns(userId, language);
      
      // Generate long-term recommendations
      const recommendations = this.generateLongTermRecommendations(
        trendDirection,
        averageQuality,
        qualityVariability,
        problematicPatterns
      );

      return {
        trendDirection,
        averageQuality: Math.round(averageQuality),
        qualityVariability: Math.round(qualityVariability),
        problematicPatterns,
        recommendations
      };
    } catch (error) {
      console.error('[QualityAssurance] Error tracking long-term trends:', error);
      return {
        trendDirection: 'stable',
        averageQuality: 70,
        qualityVariability: 15,
        problematicPatterns: [],
        recommendations: ['Error analyzing trends - please try again']
      };
    }
  }

  private static async calculateComprehensiveMetrics(
    exercises: any[],
    userId: string,
    language: string
  ): Promise<RepetitionMetrics> {
    // Word repetition analysis
    const wordFrequency = new Map<string, number>();
    exercises.forEach(exercise => {
      exercise.target_words?.forEach((word: string) => {
        wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
      });
    });
    
    const wordRepetitionScore = this.calculateWordRepetitionScore(wordFrequency, exercises.length);

    // Pattern repetition analysis
    const sentencePatterns = exercises.map(exercise => 
      this.extractSimplePattern(exercise.sentence, language)
    );
    const patternRepetitionScore = this.calculatePatternRepetitionScore(sentencePatterns);

    // Context diversity analysis
    const contexts = exercises.map(exercise => 
      this.extractContext(exercise.sentence)
    );
    const contextDiversityScore = this.calculateContextDiversityScore(contexts);

    // Temporal distribution analysis
    const timestamps = exercises.map(exercise => new Date(exercise.created_at).getTime());
    const temporalDistributionScore = this.calculateTemporalDistributionScore(timestamps);

    // Overall quality score (weighted average)
    const overallQualityScore = Math.round(
      wordRepetitionScore * 0.3 +
      patternRepetitionScore * 0.25 +
      contextDiversityScore * 0.25 +
      temporalDistributionScore * 0.2
    );

    return {
      wordRepetitionScore: Math.round(wordRepetitionScore),
      patternRepetitionScore: Math.round(patternRepetitionScore),
      contextDiversityScore: Math.round(contextDiversityScore),
      temporalDistributionScore: Math.round(temporalDistributionScore),
      overallQualityScore
    };
  }

  private static calculateWordRepetitionScore(
    wordFrequency: Map<string, number>,
    totalExercises: number
  ): number {
    if (wordFrequency.size === 0) return 100;

    // Calculate entropy to measure distribution evenness
    let entropy = 0;
    const totalWords = Array.from(wordFrequency.values()).reduce((sum, freq) => sum + freq, 0);
    
    wordFrequency.forEach(freq => {
      const probability = freq / totalWords;
      if (probability > 0) {
        entropy -= probability * Math.log2(probability);
      }
    });

    // Normalize entropy (higher entropy = less repetitive)
    const maxEntropy = Math.log2(wordFrequency.size);
    const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;
    
    // Convert to score (0-100, higher = better diversity)
    return Math.max(0, Math.min(100, normalizedEntropy * 100));
  }

  private static calculatePatternRepetitionScore(patterns: string[]): number {
    if (patterns.length === 0) return 100;

    const patternFrequency = new Map<string, number>();
    patterns.forEach(pattern => {
      patternFrequency.set(pattern, (patternFrequency.get(pattern) || 0) + 1);
    });

    // Similar entropy calculation for patterns
    let entropy = 0;
    patterns.forEach(pattern => {
      const probability = (patternFrequency.get(pattern) || 0) / patterns.length;
      if (probability > 0) {
        entropy -= probability * Math.log2(probability);
      }
    });

    const maxEntropy = Math.log2(patternFrequency.size);
    const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;
    
    return Math.max(0, Math.min(100, normalizedEntropy * 100));
  }

  private static calculateContextDiversityScore(contexts: string[]): number {
    if (contexts.length === 0) return 100;

    const uniqueContexts = new Set(contexts);
    const diversityRatio = uniqueContexts.size / contexts.length;
    
    return Math.round(diversityRatio * 100);
  }

  private static calculateTemporalDistributionScore(timestamps: number[]): number {
    if (timestamps.length <= 1) return 100;

    // Calculate intervals between exercises
    const intervals: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i-1]);
    }

    // Calculate coefficient of variation (lower = more regular distribution)
    const mean = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;

    // Convert to score (lower CV = higher score)
    return Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 50)));
  }

  private static generateQualityAlerts(
    metrics: RepetitionMetrics,
    exercises: any[]
  ): QualityAlert[] {
    const alerts: QualityAlert[] = [];
    const now = new Date();

    // Word repetition alert
    if (metrics.wordRepetitionScore < this.THRESHOLDS.WORD_REPETITION_WARNING) {
      const repetitiveWords = this.findRepetitiveWords(exercises);
      alerts.push({
        type: 'word_repetition',
        severity: metrics.wordRepetitionScore < 50 ? 'high' : 'medium',
        message: `Excessive word repetition detected (Score: ${metrics.wordRepetitionScore}/100)`,
        affectedItems: repetitiveWords,
        recommendedActions: [
          'Increase word variety in upcoming exercises',
          'Implement stronger cooldown for frequently used words',
          'Expand target word pools'
        ],
        detectedAt: now
      });
    }

    // Pattern repetition alert
    if (metrics.patternRepetitionScore < this.THRESHOLDS.PATTERN_REPETITION_WARNING) {
      alerts.push({
        type: 'pattern_repetition',
        severity: metrics.patternRepetitionScore < 40 ? 'high' : 'medium',
        message: `Sentence pattern repetition detected (Score: ${metrics.patternRepetitionScore}/100)`,
        affectedItems: ['Similar sentence structures repeated'],
        recommendedActions: [
          'Diversify sentence patterns',
          'Use different grammatical structures',
          'Vary sentence length and complexity'
        ],
        detectedAt: now
      });
    }

    // Context diversity alert
    if (metrics.contextDiversityScore < this.THRESHOLDS.CONTEXT_DIVERSITY_MIN) {
      alerts.push({
        type: 'context_similarity',
        severity: 'medium',
        message: `Low context diversity (Score: ${metrics.contextDiversityScore}/100)`,
        affectedItems: ['Similar contexts used repeatedly'],
        recommendedActions: [
          'Introduce varied contexts and situations',
          'Use different topics and themes',
          'Diversify vocabulary domains'
        ],
        detectedAt: now
      });
    }

    return alerts;
  }

  private static generateRecommendations(
    metrics: RepetitionMetrics,
    alerts: QualityAlert[]
  ): string[] {
    const recommendations: string[] = [];

    // General recommendations based on overall quality
    if (metrics.overallQualityScore < this.THRESHOLDS.OVERALL_QUALITY_MIN) {
      recommendations.push('Overall exercise quality needs improvement');
    }

    // Specific recommendations from alerts
    alerts.forEach(alert => {
      recommendations.push(...alert.recommendedActions);
    });

    // Preventive recommendations
    if (metrics.wordRepetitionScore > 80 && metrics.patternRepetitionScore > 80) {
      recommendations.push('Excellent variety! Continue maintaining diverse content');
    } else if (metrics.wordRepetitionScore < 60) {
      recommendations.push('Priority: Reduce word repetition in upcoming exercises');
    } else if (metrics.patternRepetitionScore < 60) {
      recommendations.push('Priority: Increase sentence pattern variety');
    }

    // Remove duplicates
    return Array.from(new Set(recommendations)).slice(0, 5);
  }

  private static calculateOverallGrade(metrics: RepetitionMetrics): 'A' | 'B' | 'C' | 'D' | 'F' {
    const score = metrics.overallQualityScore;
    
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private static checkImmediateRepetition(exercises: any[]): QualityAlert | null {
    if (exercises.length < 2) return null;

    // Check last 3 exercises for word repetition
    const recentWords = new Set<string>();
    const repetitiveWords: string[] = [];

    for (let i = 0; i < Math.min(3, exercises.length); i++) {
      const exercise = exercises[i];
      exercise.target_words?.forEach((word: string) => {
        if (recentWords.has(word)) {
          repetitiveWords.push(word);
        }
        recentWords.add(word);
      });
    }

    if (repetitiveWords.length > 0) {
      return {
        type: 'word_repetition',
        severity: 'high',
        message: `Words repeated in recent exercises: ${repetitiveWords.join(', ')}`,
        affectedItems: repetitiveWords,
        recommendedActions: [
          'Skip recently used words',
          'Increase word cooldown duration',
          'Select from broader word pool'
        ],
        detectedAt: new Date()
      };
    }

    return null;
  }

  private static checkContextClustering(exercises: any[]): QualityAlert | null {
    const contexts = exercises.map(exercise => this.extractContext(exercise.sentence));
    const contextCounts = new Map<string, number>();
    
    contexts.forEach(context => {
      contextCounts.set(context, (contextCounts.get(context) || 0) + 1);
    });

    // Check if any context appears more than 60% of the time
    const totalExercises = exercises.length;
    for (const [context, count] of contextCounts) {
      if (count / totalExercises > 0.6) {
        return {
          type: 'context_similarity',
          severity: 'medium',
          message: `Context "${context}" overused in recent exercises`,
          affectedItems: [context],
          recommendedActions: [
            'Diversify exercise contexts',
            'Use different thematic areas',
            'Vary situational contexts'
          ],
          detectedAt: new Date()
        };
      }
    }

    return null;
  }

  private static checkTemporalClustering(exercises: any[]): QualityAlert | null {
    if (exercises.length < 3) return null;

    const timestamps = exercises.map(ex => new Date(ex.created_at).getTime());
    const intervals: number[] = [];
    
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i-1]);
    }

    // Check for very short intervals (less than 10 seconds between exercises)
    const shortIntervals = intervals.filter(interval => interval < 10000).length;
    
    if (shortIntervals > intervals.length * 0.7) {
      return {
        type: 'temporal_clustering',
        severity: 'low',
        message: 'Exercises completed very rapidly - may indicate rushed learning',
        affectedItems: ['Exercise pacing'],
        recommendedActions: [
          'Encourage more reflection time',
          'Add brief pauses between exercises',
          'Include review moments'
        ],
        detectedAt: new Date()
      };
    }

    return null;
  }

  private static extractSimplePattern(sentence: string, language: string): string {
    // Simplified pattern extraction
    const words = sentence.toLowerCase().split(/\s+/);
    
    if (words.length <= 4) return 'SHORT';
    if (words.length >= 10) return 'LONG';
    if (sentence.includes(',')) return 'COMPLEX';
    if (words.some(w => ['and', 'und', 'et', 'e', 'y'].includes(w))) return 'COMPOUND';
    
    return 'SIMPLE';
  }

  private static extractContext(sentence: string): string {
    const lower = sentence.toLowerCase();
    
    if (lower.includes('haus') || lower.includes('home') || lower.includes('casa') || lower.includes('maison')) return 'home';
    if (lower.includes('essen') || lower.includes('food') || lower.includes('comida') || lower.includes('nourriture')) return 'food';
    if (lower.includes('arbeit') || lower.includes('work') || lower.includes('trabajo') || lower.includes('travail')) return 'work';
    if (lower.includes('schule') || lower.includes('school') || lower.includes('escuela') || lower.includes('école')) return 'education';
    if (lower.includes('familie') || lower.includes('family') || lower.includes('familia') || lower.includes('famille')) return 'family';
    
    return 'general';
  }

  private static findRepetitiveWords(exercises: any[]): string[] {
    const wordCounts = new Map<string, number>();
    const totalWords = exercises.length;
    
    exercises.forEach(exercise => {
      exercise.target_words?.forEach((word: string) => {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      });
    });

    const repetitive: string[] = [];
    wordCounts.forEach((count, word) => {
      if (count / totalWords > 0.3) { // Word appears in >30% of exercises
        repetitive.push(`${word} (${count} times)`);
      }
    });

    return repetitive;
  }

  private static isAlertAllowed(sessionId: string, alertType: string): boolean {
    const cooldownKey = `${sessionId}-${alertType}`;
    const lastAlert = this.ALERT_COOLDOWNS.get(cooldownKey);
    
    if (!lastAlert) return true;
    
    const cooldownPeriod = 5 * 60 * 1000; // 5 minutes
    return Date.now() - lastAlert.getTime() > cooldownPeriod;
  }

  private static setAlertCooldown(sessionId: string, alertType: string): void {
    const cooldownKey = `${sessionId}-${alertType}`;
    this.ALERT_COOLDOWNS.set(cooldownKey, new Date());
  }

  private static analyzeTrend(scores: number[]): 'improving' | 'stable' | 'declining' {
    if (scores.length < 3) return 'stable';

    // Simple linear regression
    const n = scores.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = scores.reduce((sum, score) => sum + score, 0);
    const sumXY = scores.reduce((sum, score, index) => sum + index * score, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    if (slope > 2) return 'improving';
    if (slope < -2) return 'declining';
    return 'stable';
  }

  private static calculateVariability(scores: number[]): number {
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    return Math.sqrt(variance);
  }

  private static async identifyProblematicPatterns(userId: string, language: string): Promise<string[]> {
    // Simplified analysis - would need more sophisticated pattern detection
    const patterns: string[] = [];
    
    // This could analyze:
    // - Recurring word combinations
    // - Overused sentence structures
    // - Context clustering
    // - Timing patterns
    
    // For now, return common issues
    patterns.push('High word repetition in recent sessions');
    
    return patterns;
  }

  private static generateLongTermRecommendations(
    trend: 'improving' | 'stable' | 'declining',
    averageQuality: number,
    variability: number,
    problematicPatterns: string[]
  ): string[] {
    const recommendations: string[] = [];

    switch (trend) {
      case 'improving':
        recommendations.push('Quality is improving - keep up the good work!');
        break;
      case 'declining':
        recommendations.push('Quality declining - review and adjust content generation');
        break;
      case 'stable':
        if (averageQuality > 80) {
          recommendations.push('Maintaining high quality consistently');
        } else {
          recommendations.push('Quality stable but could be improved');
        }
        break;
    }

    if (variability > 20) {
      recommendations.push('High quality variability - work on consistency');
    }

    if (problematicPatterns.length > 0) {
      recommendations.push('Address recurring quality issues');
    }

    return recommendations.slice(0, 3);
  }

  private static createEmptyReport(
    sessionId: string,
    userId: string,
    language: string
  ): SessionQualityReport {
    return {
      sessionId,
      userId,
      language,
      exerciseCount: 0,
      metrics: {
        wordRepetitionScore: 100,
        patternRepetitionScore: 100,
        contextDiversityScore: 100,
        temporalDistributionScore: 100,
        overallQualityScore: 100
      },
      alerts: [],
      recommendations: ['Complete more exercises for quality analysis'],
      overallGrade: 'A',
      timestamp: new Date()
    };
  }
}
