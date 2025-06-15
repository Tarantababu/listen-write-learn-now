
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

    console.log('[OPTIMIZED READING SERVICE] Creating reading exercise without audio generation');

    try {
      const { data, error } = await supabase.functions.invoke('generate-reading-content', {
        body: {
          ...exerciseData,
          user_id: user.id,
          optimized: true,
          // Skip audio generation during creation
          skipAudio: true,
          target_length: exerciseData.target_length || 500
        }
      });

      if (error) {
        console.error('[OPTIMIZED READING SERVICE] Exercise creation error:', error);
        
        if (error.message?.includes('timeout') || error.message?.includes('504')) {
          console.warn('[OPTIMIZED READING SERVICE] Timeout detected, retrying with smaller target length');
          
          const retryData = {
            ...exerciseData,
            target_length: Math.min(exerciseData.target_length || 500, 300)
          };
          
          const retryResult = await supabase.functions.invoke('generate-reading-content', {
            body: {
              ...retryData,
              user_id: user.id,
              optimized: true,
              skipAudio: true
            }
          });
          
          if (retryResult.error) {
            throw retryResult.error;
          }
          
          return this.processCreatedExercise(retryResult.data, exerciseData);
        }
        
        throw error;
      }

      if (!data) {
        throw new Error('Failed to create exercise - no data returned');
      }

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
    if (data.id) {
      return this.getReadingExercise(data.id);
    }
    
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
          // Start with pending audio status instead of generating during creation
          audio_generation_status: 'pending',
          metadata: {
            generation_method: 'optimized_workflow',
            created_at: new Date().toISOString(),
            audio_on_demand: true
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

  // New method for on-demand audio generation
  async generateAudioOnDemand(exerciseId: string): Promise<boolean> {
    console.log('[OPTIMIZED READING SERVICE] Starting on-demand audio generation for:', exerciseId);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      // Get exercise details
      const exercise = await this.getReadingExercise(exerciseId);
      
      // Update status to generating
      await supabase
        .from('reading_exercises')
        .update({
          audio_generation_status: 'generating',
          updated_at: new Date().toISOString()
        })
        .eq('id', exerciseId);

      // Extract full text from exercise content
      const fullText = exercise.content.sentences.map(s => s.text).join(' ');
      
      if (!fullText.trim()) {
        throw new Error('No text content found for audio generation');
      }

      // Generate audio using enhanced audio service
      const { enhancedAudioService } = await import('@/services/enhancedAudioService');
      const result = await enhancedAudioService.generateSingleAudio(
        fullText, 
        exercise.language, 
        { quality: 'standard', priority: 'high' }
      );

      if (result.success && result.audioUrl) {
        // Update exercise with audio URL
        await supabase
          .from('reading_exercises')
          .update({
            audio_url: result.audioUrl,
            full_text_audio_url: result.audioUrl,
            audio_generation_status: 'completed',
            metadata: {
              ...(typeof exercise.metadata === 'object' ? exercise.metadata : {}),
              audio_generated_on_demand: true,
              audio_generated_at: new Date().toISOString(),
              audio_metadata: result.metadata
            }
          })
          .eq('id', exerciseId);

        console.log('[OPTIMIZED READING SERVICE] On-demand audio generation successful');
        return true;
      } else {
        // Update status to failed
        await supabase
          .from('reading_exercises')
          .update({
            audio_generation_status: 'failed',
            metadata: {
              ...(typeof exercise.metadata === 'object' ? exercise.metadata : {}),
              audio_error: result.error,
              audio_failed_at: new Date().toISOString()
            }
          })
          .eq('id', exerciseId);

        console.error('[OPTIMIZED READING SERVICE] On-demand audio generation failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('[OPTIMIZED READING SERVICE] On-demand audio generation error:', error);
      
      // Update status to failed
      await supabase
        .from('reading_exercises')
        .update({
          audio_generation_status: 'failed',
          metadata: {
            audio_error: error.message,
            audio_failed_at: new Date().toISOString()
          }
        })
        .eq('id', exerciseId);

      return false;
    }
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

  // Enhanced method to trigger audio generation for an exercise
  async triggerAudioGeneration(exerciseId: string): Promise<boolean> {
    console.log('[OPTIMIZED READING SERVICE] Triggering audio generation for:', exerciseId);
    
    return this.generateAudioOnDemand(exerciseId);
  }
}

export const optimizedReadingService = new OptimizedReadingService();
