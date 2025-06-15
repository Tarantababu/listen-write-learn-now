
import { supabase } from '@/integrations/supabase/client';
import { CreateReadingExerciseRequest, ReadingExercise } from '@/types/reading';

interface ProgressCallback {
  (progress: {
    progress: number;
    status: 'generating' | 'completed' | 'error';
    message: string;
    estimatedTime?: number;
    qualityMetrics?: {
      vocabularyDiversity?: number;
      coherenceScore?: number;
      generationStrategy?: string;
      recoveryUsed?: boolean;
    };
  }): void;
}

class OptimizedReadingService {
  async createReadingExercise(
    request: CreateReadingExerciseRequest,
    onProgress?: ProgressCallback
  ): Promise<ReadingExercise> {
    console.log('[OPTIMIZED SERVICE] Creating reading exercise with request:', request);
    
    const startTime = Date.now();
    
    try {
      if (onProgress) {
        onProgress({
          progress: 10,
          status: 'generating',
          message: request.skipAIAnalysis ? 'Starting local text processing...' : 'Initializing enhanced generation system...',
          estimatedTime: request.skipAIAnalysis ? 2000 : 8000
        });
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated to create reading exercises');
      }

      if (onProgress) {
        onProgress({
          progress: 25,
          status: 'generating',
          message: request.skipAIAnalysis ? 'Processing your text locally...' : 'Calling enhanced content generation...',
          estimatedTime: request.skipAIAnalysis ? 1500 : 6000
        });
      }

      // Call the edge function with the new skipAIAnalysis parameter
      const { data: contentData, error: contentError } = await supabase.functions.invoke(
        'generate-reading-content',
        {
          body: {
            topic: request.topic,
            language: request.language,
            difficulty_level: request.difficulty_level,
            target_length: request.target_length,
            grammar_focus: request.grammar_focus,
            customText: request.customText,
            isCustomText: !!request.customText,
            skipAIAnalysis: request.skipAIAnalysis || false, // Pass the new flag
            directGeneration: false
          }
        }
      );

      if (contentError) {
        console.error('[OPTIMIZED SERVICE] Content generation error:', contentError);
        throw new Error(`Content generation failed: ${contentError.message}`);
      }

      if (onProgress) {
        onProgress({
          progress: 60,
          status: 'generating',
          message: request.skipAIAnalysis ? 'Finalizing local processing...' : 'Content generated! Processing quality metrics...',
          estimatedTime: request.skipAIAnalysis ? 500 : 3000,
          qualityMetrics: contentData.analysis?.qualityMetrics
        });
      }

      console.log('[OPTIMIZED SERVICE] Content generated successfully:', {
        wordCount: contentData.analysis?.wordCount,
        sentences: contentData.sentences?.length,
        strategy: contentData.analysis?.generationStrategy
      });

      if (onProgress) {
        onProgress({
          progress: 80,
          status: 'generating',
          message: 'Saving exercise to database...',
          estimatedTime: 1000
        });
      }

      // Save to database
      const { data: exerciseData, error: insertError } = await supabase
        .from('reading_exercises')
        .insert({
          user_id: user.id,
          title: request.title,
          language: request.language,
          difficulty_level: request.difficulty_level,
          target_length: request.target_length,
          grammar_focus: request.grammar_focus,
          topic: request.topic,
          content: contentData,
          audio_generation_status: 'pending',
          metadata: {
            generation_method: contentData.analysis?.generationStrategy || 'unknown',
            created_at: new Date().toISOString(),
            enhanced_audio_enabled: true,
            skipAIAnalysis: request.skipAIAnalysis,
            localProcessing: contentData.analysis?.localProcessing
          }
        })
        .select()
        .single();

      if (insertError) {
        console.error('[OPTIMIZED SERVICE] Database insert error:', insertError);
        throw new Error(`Failed to save exercise: ${insertError.message}`);
      }

      if (onProgress) {
        onProgress({
          progress: 90,
          status: 'generating',
          message: request.skipAIAnalysis ? 'Exercise ready! Audio will be generated in background...' : 'Scheduling audio generation...',
          estimatedTime: 500
        });
      }

      // Queue audio generation in the background (for both local and AI processing)
      this.queueAudioGeneration(exerciseData.id).catch(error => {
        console.warn('[OPTIMIZED SERVICE] Audio generation queue failed:', error);
      });

      if (onProgress) {
        const duration = Date.now() - startTime;
        onProgress({
          progress: 100,
          status: 'completed',
          message: request.skipAIAnalysis 
            ? `Local processing completed in ${Math.round(duration / 1000)}s! Exercise ready for practice.`
            : `Enhanced exercise created in ${Math.round(duration / 1000)}s! Audio generation started.`,
          qualityMetrics: contentData.analysis?.qualityMetrics
        });
      }

      console.log('[OPTIMIZED SERVICE] Exercise created successfully:', {
        id: exerciseData.id,
        processingMethod: contentData.analysis?.generationStrategy,
        duration: Date.now() - startTime
      });

      // Type assertion to fix the difficulty_level type mismatch
      return {
        ...exerciseData,
        difficulty_level: exerciseData.difficulty_level as 'beginner' | 'intermediate' | 'advanced'
      } as ReadingExercise;

    } catch (error) {
      console.error('[OPTIMIZED SERVICE] Exercise creation failed:', error);
      
      if (onProgress) {
        onProgress({
          progress: 0,
          status: 'error',
          message: `Creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
      
      throw error;
    }
  }

  private async queueAudioGeneration(exerciseId: string): Promise<void> {
    try {
      console.log('[OPTIMIZED SERVICE] Queueing audio generation for exercise:', exerciseId);
      
      // Update status to generating
      await supabase
        .from('reading_exercises')
        .update({ 
          audio_generation_status: 'generating',
          metadata: {
            audio_generation_started: new Date().toISOString()
          }
        })
        .eq('id', exerciseId);

      // Call audio generation function
      const { error } = await supabase.functions.invoke('generate-reading-audio', {
        body: { exerciseId }
      });

      if (error) {
        console.error('[OPTIMIZED SERVICE] Audio generation queue error:', error);
        await supabase
          .from('reading_exercises')
          .update({ 
            audio_generation_status: 'failed',
            metadata: {
              audio_generation_failed: new Date().toISOString(),
              error: error.message
            }
          })
          .eq('id', exerciseId);
      }
    } catch (error) {
      console.error('[OPTIMIZED SERVICE] Audio queue error:', error);
    }
  }

  async generateAudioOnDemand(exerciseId: string): Promise<boolean> {
    try {
      console.log('[OPTIMIZED SERVICE] Generating audio on demand for exercise:', exerciseId);
      
      const { data, error } = await supabase.functions.invoke('generate-reading-audio', {
        body: { exerciseId, onDemand: true }
      });

      if (error) {
        console.error('[OPTIMIZED SERVICE] On-demand audio generation error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[OPTIMIZED SERVICE] On-demand audio generation failed:', error);
      return false;
    }
  }

  async refreshExerciseFromDb(exerciseId: string): Promise<ReadingExercise> {
    const { data, error } = await supabase
      .from('reading_exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();

    if (error) {
      throw new Error(`Failed to refresh exercise: ${error.message}`);
    }

    // Type assertion to fix the difficulty_level type mismatch
    return {
      ...data,
      difficulty_level: data.difficulty_level as 'beginner' | 'intermediate' | 'advanced'
    } as ReadingExercise;
  }

  async getReadingExercises(userId: string): Promise<ReadingExercise[]> {
    const { data, error } = await supabase
      .from('reading_exercises')
      .select('*')
      .eq('user_id', userId)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch reading exercises: ${error.message}`);
    }

    // Type assertion to fix the difficulty_level type mismatch
    return (data || []).map(exercise => ({
      ...exercise,
      difficulty_level: exercise.difficulty_level as 'beginner' | 'intermediate' | 'advanced'
    })) as ReadingExercise[];
  }

  async deleteReadingExercise(exerciseId: string): Promise<void> {
    const { error } = await supabase
      .from('reading_exercises')
      .update({ archived: true })
      .eq('id', exerciseId);

    if (error) {
      throw new Error(`Failed to delete reading exercise: ${error.message}`);
    }
  }
}

export const optimizedReadingService = new OptimizedReadingService();
