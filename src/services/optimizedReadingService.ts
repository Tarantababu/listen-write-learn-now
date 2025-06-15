
import { supabase } from '@/integrations/supabase/client';
import { ReadingExercise } from '@/types/reading';

export class OptimizedReadingService {
  
  async getReadingExercises(language?: string): Promise<ReadingExercise[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('[OPTIMIZED READING SERVICE] Fetching reading exercises for user:', user.id, 'language:', language || 'all');

    let query = supabase
      .from('reading_exercises')
      .select('*')
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (language) {
      query = query.eq('language', language);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[OPTIMIZED READING SERVICE] Database query error:', error);
      throw error;
    }

    console.log('[OPTIMIZED READING SERVICE] Raw database results:', data?.length || 0, 'exercises');
    
    const mappedExercises = (data || []).map(exercise => this.mapExerciseFromDb(exercise));
    
    console.log('[OPTIMIZED READING SERVICE] Mapped exercises:', mappedExercises.length);

    return mappedExercises;
  }

  async createReadingExercise(exerciseData: any, onProgress?: (progress: any) => void): Promise<ReadingExercise> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('[OPTIMIZED READING SERVICE] Creating reading exercise with streamlined workflow');

    // Enhanced error handling for the edge function call
    try {
      const { data, error } = await supabase.functions.invoke('generate-reading-content', {
        body: {
          ...exerciseData,
          user_id: user.id,
          optimized: true,
          // Ensure target_length has a default value
          target_length: exerciseData.target_length || 500
        }
      });

      if (error) {
        console.error('[OPTIMIZED READING SERVICE] Exercise creation error:', error);
        
        // Enhanced error handling - check if it's a recoverable error
        if (error.message?.includes('timeout') || error.message?.includes('504')) {
          console.warn('[OPTIMIZED READING SERVICE] Timeout detected, retrying with smaller target length');
          
          // Retry with smaller target length
          const retryData = {
            ...exerciseData,
            target_length: Math.min(exerciseData.target_length || 500, 300)
          };
          
          const retryResult = await supabase.functions.invoke('generate-reading-content', {
            body: {
              ...retryData,
              user_id: user.id,
              optimized: true
            }
          });
          
          if (retryResult.error) {
            throw retryResult.error;
          }
          
          return this.processCreatedExercise(retryResult.data, exerciseData);
        }
        
        throw error;
      }

      // Fixed logic: Check if we have valid data instead of requiring an ID
      if (!data) {
        throw new Error('Failed to create exercise - no data returned');
      }

      // Check if data has either an ID or content structure
      if (!data.id && !data.sentences) {
        throw new Error('Failed to create exercise - invalid response format');
      }

      return this.processCreatedExercise(data, exerciseData);
      
    } catch (error) {
      console.error('[OPTIMIZED READING SERVICE] Unexpected error:', error);
      throw new Error(`Failed to create reading exercise: ${error.message}`);
    }
  }

  private async processCreatedExercise(data: any, originalData: any): Promise<ReadingExercise> {
    // If we got an exercise ID, fetch the complete exercise
    if (data.id) {
      return this.getReadingExercise(data.id);
    }
    
    // If we got exercise content directly, create the exercise in the database
    if (data.sentences && Array.isArray(data.sentences)) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data: createdExercise, error: createError } = await supabase
        .from('reading_exercises')
        .insert({
          user_id: user.id,
          title: originalData.title,
          language: originalData.language,
          difficulty_level: originalData.difficulty_level,
          target_length: originalData.target_length || 500,
          grammar_focus: originalData.grammar_focus,
          topic: originalData.topic,
          content: data,
          audio_generation_status: 'pending',
          metadata: {
            generation_method: 'optimized_workflow',
            created_at: new Date().toISOString()
          }
        })
        .select()
        .single();
      
      if (createError) {
        console.error('[OPTIMIZED READING SERVICE] Database insert error:', createError);
        throw createError;
      }
      
      return this.mapExerciseFromDb(createdExercise);
    }
    
    throw new Error('Invalid response format from exercise creation');
  }

  async deleteReadingExercise(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('[OPTIMIZED READING SERVICE] Deleting reading exercise:', id);

    const { error } = await supabase
      .from('reading_exercises')
      .update({ archived: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[OPTIMIZED READING SERVICE] Delete error:', error);
      throw error;
    }
  }

  // Enhanced method to refresh exercise data from database
  async refreshExerciseFromDb(id: string): Promise<ReadingExercise> {
    console.log('[OPTIMIZED READING SERVICE] Refreshing exercise from database:', id);

    const { data, error } = await supabase
      .from('reading_exercises')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[OPTIMIZED READING SERVICE] Refresh query error:', error);
      throw error;
    }

    const refreshed = this.mapExerciseFromDb(data);
    console.log('[OPTIMIZED READING SERVICE] Exercise refreshed:', {
      id: refreshed.id,
      audio_status: refreshed.audio_generation_status,
      has_audio_url: !!refreshed.audio_url,
      has_full_text_audio_url: !!refreshed.full_text_audio_url
    });

    return refreshed;
  }

  private mapExerciseFromDb(exercise: any): ReadingExercise {
    const mapped: ReadingExercise = {
      id: exercise.id,
      user_id: exercise.user_id,
      title: exercise.title,
      language: exercise.language,
      difficulty_level: exercise.difficulty_level as 'beginner' | 'intermediate' | 'advanced',
      target_length: exercise.target_length,
      grammar_focus: exercise.grammar_focus,
      topic: exercise.topic,
      content: this.parseContentFromDatabase(exercise.content),
      audio_url: exercise.audio_url,
      full_text_audio_url: exercise.full_text_audio_url,
      audio_generation_status: (exercise.audio_generation_status || 'pending') as 'pending' | 'generating' | 'completed' | 'failed',
      metadata: this.parseMetadataFromDatabase(exercise.metadata),
      created_at: exercise.created_at,
      updated_at: exercise.updated_at,
      archived: exercise.archived || false
    };

    return mapped;
  }

  private parseContentFromDatabase(content: any): ReadingExercise['content'] {
    if (!content) {
      return { sentences: [] };
    }
    
    if (typeof content === 'object' && content !== null) {
      return content as ReadingExercise['content'];
    }
    
    if (typeof content === 'string') {
      try {
        return JSON.parse(content) as ReadingExercise['content'];
      } catch {
        return { sentences: [] };
      }
    }
    
    return { sentences: [] };
  }

  private parseMetadataFromDatabase(metadata: any): ReadingExercise['metadata'] {
    if (!metadata) return undefined;
    
    if (typeof metadata === 'object' && metadata !== null) {
      return metadata;
    }
    
    if (typeof metadata === 'string') {
      try {
        return JSON.parse(metadata);
      } catch {
        return undefined;
      }
    }
    
    return undefined;
  }

  async getReadingExercise(id: string): Promise<ReadingExercise> {
    console.log('[OPTIMIZED READING SERVICE] Fetching single exercise:', id);

    const { data, error } = await supabase
      .from('reading_exercises')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[OPTIMIZED READING SERVICE] Single exercise query error:', error);
      throw error;
    }

    const mapped = this.mapExerciseFromDb(data);
    
    console.log('[OPTIMIZED READING SERVICE] Single exercise mapped successfully');

    return mapped;
  }

  // New method to trigger audio generation for an exercise
  async triggerAudioGeneration(exerciseId: string): Promise<boolean> {
    console.log('[OPTIMIZED READING SERVICE] Triggering audio generation for:', exerciseId);
    
    try {
      // Update status to generating
      const { error: updateError } = await supabase
        .from('reading_exercises')
        .update({
          audio_generation_status: 'generating',
          updated_at: new Date().toISOString()
        })
        .eq('id', exerciseId);

      if (updateError) {
        console.error('[OPTIMIZED READING SERVICE] Failed to update status:', updateError);
        return false;
      }

      // Call the enhanced audio service
      const success = await import('@/services/enhancedAudioService').then(module => 
        module.enhancedAudioService.validateAndFixExerciseAudio(exerciseId)
      );

      return success;
    } catch (error) {
      console.error('[OPTIMIZED READING SERVICE] Audio generation trigger failed:', error);
      return false;
    }
  }
}

export const optimizedReadingService = new OptimizedReadingService();
