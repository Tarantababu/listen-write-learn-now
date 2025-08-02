
import { LearningRecommendation } from '@/services/personalizedLearningPath';
import { DifficultyLevel } from '@/types/sentence-mining';
import { toast } from 'sonner';

export interface RecommendationActionHandlerProps {
  recommendation: LearningRecommendation;
  onStartAdaptiveSession: (difficulty?: DifficultyLevel, focusOptions?: {
    focusWords?: string[];
    focusArea?: string;
    reviewMode?: boolean;
  }) => Promise<void>;
}

export const executeRecommendationAction = async (
  recommendation: LearningRecommendation,
  onStartAdaptiveSession: RecommendationActionHandlerProps['onStartAdaptiveSession']
) => {
  try {
    console.log(`[RecommendationAction] Executing action for: ${recommendation.type}`, recommendation);
    
    switch (recommendation.type) {
      case 'difficulty_adjustment':
        const suggestedDifficulty = recommendation.data?.suggestedDifficulty as DifficultyLevel;
        if (suggestedDifficulty) {
          toast.info(`Starting ${suggestedDifficulty} difficulty session based on AI recommendation`);
          await onStartAdaptiveSession(suggestedDifficulty);
        } else {
          toast.error('Unable to determine suggested difficulty level');
        }
        break;

      case 'review_words':
        const wordsToReview = recommendation.data?.words as string[];
        if (wordsToReview && wordsToReview.length > 0) {
          toast.info(`Starting review session for ${wordsToReview.length} challenging words`);
          await onStartAdaptiveSession('intermediate', {
            focusWords: wordsToReview,
            reviewMode: true
          });
        } else {
          toast.error('No words available for review');
        }
        break;

      case 'focus_area':
        const weakAreas = recommendation.data?.weakAreas;
        if (weakAreas && weakAreas.length > 0) {
          const primaryArea = weakAreas[0];
          toast.info(`Starting focused session for: ${primaryArea.category}`);
          await onStartAdaptiveSession('intermediate', {
            focusArea: primaryArea.category,
            focusWords: primaryArea.words
          });
        } else {
          toast.error('No focus areas available');
        }
        break;

      case 'new_content':
        toast.info('Starting session with new content based on your progress');
        await onStartAdaptiveSession('intermediate', {
          reviewMode: false
        });
        break;

      default:
        console.warn(`[RecommendationAction] Unknown recommendation type: ${recommendation.type}`);
        toast.error('Unknown recommendation type');
        break;
    }
  } catch (error) {
    console.error(`[RecommendationAction] Error executing recommendation:`, error);
    toast.error('Failed to start recommended session');
  }
};
