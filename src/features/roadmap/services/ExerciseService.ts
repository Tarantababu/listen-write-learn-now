
import { Language, LanguageLevel } from '@/types';
import { BaseService } from './BaseService';
import { 
  ServiceResult,
  ExerciseSubmission,
  ExerciseResult,
  ExerciseServiceInterface
} from '../types/service-types';
import { ExerciseContent } from '../types';

export class ExerciseService extends BaseService implements ExerciseServiceInterface {
  /**
   * Get exercise content for a roadmap node
   * This is a stubbed implementation that returns null
   */
  public async getNodeExercise(nodeId: string): Promise<ServiceResult<ExerciseContent | null>> {
    console.log('Stub ExerciseService.getNodeExercise called with nodeId:', nodeId);
    return this.success(null);
  }
  
  /**
   * Submit exercise result and calculate accuracy
   * This is a stubbed implementation that returns a mock result
   */
  public async submitExerciseResult(
    exerciseId: string, 
    result: ExerciseSubmission
  ): Promise<ServiceResult<ExerciseResult>> {
    console.log('Stub ExerciseService.submitExerciseResult called with exerciseId:', exerciseId);
    
    return this.success({
      accuracy: 0,
      isCompleted: false,
      completionCount: 0
    });
  }
  
  /**
   * Generate a new exercise based on language and level
   * This is a stubbed implementation that returns a mock exercise
   */
  public async generateExercise(
    language: Language, 
    level: LanguageLevel, 
    topic?: string
  ): Promise<ServiceResult<ExerciseContent>> {
    console.log('Stub ExerciseService.generateExercise called with language:', language, 'level:', level);
    
    return this.success({
      id: 'mock-exercise-id',
      title: 'Deprecated Exercise',
      text: 'This feature has been deprecated from the application.',
      language: language,
      tags: topic ? [topic] : []
    });
  }
  
  /**
   * Calculate text similarity as a percentage
   * This is a stubbed implementation that always returns 0
   */
  private calculateAccuracy(original: string, submission: string): number {
    return 0;
  }
}

// Create and export singleton instance
export const exerciseService = new ExerciseService();
