
import { Language, LanguageLevel } from '@/types';
import { BaseService } from './BaseService';
import { 
  ExerciseServiceInterface,
  ServiceResult,
  ExerciseSubmission,
  ExerciseResult
} from '../types/service-types';
import { ExerciseContent } from '../types';

export class ExerciseService extends BaseService implements ExerciseServiceInterface {
  /**
   * Get exercise content for a roadmap node
   */
  public async getNodeExercise(nodeId: string): ServiceResult<ExerciseContent | null> {
    try {
      // First get the node to get the default exercise ID
      const { data: node, error: nodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('default_exercise_id, language')
        .eq('id', nodeId)
        .single();
        
      if (nodeError) throw nodeError;
      
      if (!node.default_exercise_id) {
        return this.success(null);
      }
      
      // Get the exercise content
      const { data: exercise, error: exerciseError } = await this.supabase
        .from('default_exercises')
        .select('*')
        .eq('id', node.default_exercise_id)
        .single();
        
      if (exerciseError) throw exerciseError;
      
      return this.success({
        id: exercise.id,
        title: exercise.title,
        text: exercise.text,
        audioUrl: exercise.audio_url,
        language: (exercise.language || node.language) as Language,
        tags: exercise.tags
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Submit exercise result and calculate accuracy
   */
  public async submitExerciseResult(
    exerciseId: string, 
    result: ExerciseSubmission
  ): ServiceResult<ExerciseResult> {
    try {
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return this.error('User must be authenticated to submit exercise results');
      }
      
      // Get the exercise text to compare with user submission
      const { data: exercise, error: exerciseError } = await this.supabase
        .from('default_exercises')
        .select('text')
        .eq('id', exerciseId)
        .single();
        
      if (exerciseError) throw exerciseError;
      
      // Calculate accuracy using a simple algorithm
      // In a real implementation, this would use a more sophisticated algorithm
      const accuracy = this.calculateAccuracy(exercise.text, result.userText);
      
      // Update exercise completion in the database
      const { error: completionError } = await this.supabase
        .from('completions')
        .upsert({
          user_id: auth.userId,
          exercise_id: exerciseId,
          accuracy: accuracy,
          attempt_count: 1,
          completed: accuracy >= 95
        });
        
      if (completionError) throw completionError;
      
      // Return the result
      return this.success({
        accuracy,
        isCompleted: accuracy >= 95,
        completionCount: 1
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Generate a new exercise based on language and level
   * Note: This is a placeholder for future AI-based exercise generation
   */
  public async generateExercise(
    language: Language, 
    level: LanguageLevel, 
    topic?: string
  ): ServiceResult<ExerciseContent> {
    try {
      // In a real implementation, this would call an AI service
      // For now, we'll find a default exercise that matches the criteria
      const query = this.supabase
        .from('default_exercises')
        .select('*')
        .eq('language', language)
        .limit(1);
        
      if (topic) {
        query.contains('tags', [topic]);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error) throw error;
      
      if (!data) {
        return this.error(`No exercise found for language ${language} and topic ${topic || 'any'}`);
      }
      
      return this.success({
        id: data.id,
        title: data.title,
        text: data.text,
        audioUrl: data.audio_url,
        language: data.language as Language,
        tags: data.tags
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Calculate text similarity as a percentage
   * This is a simple implementation - in production would use more sophisticated algorithms
   */
  private calculateAccuracy(original: string, submission: string): number {
    // Normalize strings by removing punctuation and extra spaces
    const normalizeString = (str: string) => 
      str.toLowerCase()
         .replace(/[^\w\s]/g, '')
         .replace(/\s+/g, ' ')
         .trim();
    
    const normalizedOriginal = normalizeString(original);
    const normalizedSubmission = normalizeString(submission);
    
    // Simple word-based comparison
    const originalWords = normalizedOriginal.split(' ');
    const submissionWords = normalizedSubmission.split(' ');
    
    let correctWords = 0;
    const totalWords = originalWords.length;
    
    // Compare each word
    for (let i = 0; i < Math.min(originalWords.length, submissionWords.length); i++) {
      if (originalWords[i] === submissionWords[i]) {
        correctWords++;
      }
    }
    
    // Calculate percentage
    return Math.round((correctWords / totalWords) * 100);
  }
}

// Create and export singleton instance
export const exerciseService = new ExerciseService();
