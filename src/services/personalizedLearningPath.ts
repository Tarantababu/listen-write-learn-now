
import { DifficultyLevel } from '@/types/sentence-mining';
import { VocabularyProfile } from './smartContentGenerator';

export interface LearningRecommendation {
  type: 'difficulty_adjustment' | 'focus_area' | 'review_words' | 'new_content';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  data?: any;
}

export interface WeakArea {
  category: string;
  words: string[];
  accuracy: number;
  recommendation: string;
}

export interface LearningTrajectory {
  currentMastery: number;
  projectedGrowth: number;
  estimatedTimeToNextLevel: number; // in days
  focusAreas: string[];
}

export class PersonalizedLearningPath {
  static generateRecommendations(
    vocabularyProfile: VocabularyProfile,
    recentAccuracy: number,
    currentDifficulty: DifficultyLevel,
    streakLength: number
  ): LearningRecommendation[] {
    const recommendations: LearningRecommendation[] = [];

    // Difficulty adjustment recommendations
    if (recentAccuracy >= 90 && streakLength >= 3) {
      recommendations.push({
        type: 'difficulty_adjustment',
        title: 'Ready for Higher Difficulty',
        description: `Your recent accuracy of ${recentAccuracy}% suggests you're ready for more challenging exercises.`,
        priority: 'high',
        actionable: true,
        data: { suggestedDifficulty: this.getNextLevel(currentDifficulty) }
      });
    }

    if (recentAccuracy <= 50 && currentDifficulty !== 'beginner') {
      recommendations.push({
        type: 'difficulty_adjustment',
        title: 'Consider Easier Exercises',
        description: `Low accuracy (${recentAccuracy}%) suggests focusing on fundamentals would be beneficial.`,
        priority: 'high',
        actionable: true,
        data: { suggestedDifficulty: this.getPreviousLevel(currentDifficulty) }
      });
    }

    // Struggling words recommendations
    if (vocabularyProfile.strugglingWords.length > 0) {
      recommendations.push({
        type: 'review_words',
        title: 'Review Challenging Words',
        description: `You have ${vocabularyProfile.strugglingWords.length} words that need extra practice.`,
        priority: 'medium',
        actionable: true,
        data: { words: vocabularyProfile.strugglingWords.slice(0, 5) }
      });
    }

    // Progress celebration
    if (vocabularyProfile.masteredWords.length >= 10) {
      recommendations.push({
        type: 'new_content',
        title: 'Excellent Progress!',
        description: `You've mastered ${vocabularyProfile.masteredWords.length} words. Ready for new challenges?`,
        priority: 'low',
        actionable: false
      });
    }

    // Focus area recommendations
    const weakAreas = this.identifyWeakAreas(vocabularyProfile);
    if (weakAreas.length > 0) {
      recommendations.push({
        type: 'focus_area',
        title: 'Suggested Focus Areas',
        description: weakAreas[0].recommendation,
        priority: 'medium',
        actionable: true,
        data: { weakAreas: weakAreas.slice(0, 2) }
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  static optimizeWordSelection(
    vocabularyProfile: VocabularyProfile,
    currentDifficulty: DifficultyLevel
  ): {
    priorityWords: string[];
    avoidWords: string[];
    newWordRatio: number;
  } {
    const priorityWords = [...vocabularyProfile.strugglingWords];
    const avoidWords = vocabularyProfile.masteredWords.filter(
      word => vocabularyProfile.wordFrequency[word] >= 10
    );

    // Adjust new word introduction ratio based on performance
    let newWordRatio = 0.3; // Default 30% new words

    if (vocabularyProfile.strugglingWords.length > 5) {
      newWordRatio = 0.1; // Reduce to 10% when struggling
    } else if (vocabularyProfile.masteredWords.length >= 20) {
      newWordRatio = 0.5; // Increase to 50% when doing well
    }

    return {
      priorityWords: priorityWords.slice(0, 10),
      avoidWords,
      newWordRatio
    };
  }

  static predictLearningTrajectory(
    vocabularyProfile: VocabularyProfile,
    recentAccuracy: number,
    streakLength: number
  ): LearningTrajectory {
    const currentMastery = vocabularyProfile.masteredWords.length;
    const totalWords = vocabularyProfile.knownWords.length || 1;
    const masteryRatio = currentMastery / totalWords;

    // Simple projection based on current performance
    let projectedGrowth = 0;
    let estimatedTimeToNextLevel = 30; // Default 30 days

    if (recentAccuracy >= 80) {
      projectedGrowth = streakLength * 2;
      estimatedTimeToNextLevel = Math.max(7, 21 - streakLength);
    } else if (recentAccuracy >= 60) {
      projectedGrowth = Math.max(1, streakLength);
      estimatedTimeToNextLevel = 21;
    } else {
      projectedGrowth = 0;
      estimatedTimeToNextLevel = 45;
    }

    const focusAreas: string[] = [];
    if (masteryRatio < 0.3) focusAreas.push('vocabulary_building');
    if (vocabularyProfile.strugglingWords.length > 3) focusAreas.push('word_reinforcement');
    if (recentAccuracy < 70) focusAreas.push('accuracy_improvement');

    return {
      currentMastery: Math.round(masteryRatio * 100),
      projectedGrowth,
      estimatedTimeToNextLevel,
      focusAreas
    };
  }

  private static identifyWeakAreas(profile: VocabularyProfile): WeakArea[] {
    const weakAreas: WeakArea[] = [];

    // Identify struggling word patterns
    if (profile.strugglingWords.length >= 3) {
      weakAreas.push({
        category: 'Vocabulary Retention',
        words: profile.strugglingWords.slice(0, 3),
        accuracy: 40, // Estimated
        recommendation: 'Focus on spaced repetition for these challenging words.'
      });
    }

    return weakAreas;
  }

  private static getNextLevel(current: DifficultyLevel): DifficultyLevel {
    switch (current) {
      case 'beginner': return 'intermediate';
      case 'intermediate': return 'advanced';
      case 'advanced': return 'advanced';
      default: return current;
    }
  }

  private static getPreviousLevel(current: DifficultyLevel): DifficultyLevel {
    switch (current) {
      case 'advanced': return 'intermediate';
      case 'intermediate': return 'beginner';
      case 'beginner': return 'beginner';
      default: return current;
    }
  }
}
