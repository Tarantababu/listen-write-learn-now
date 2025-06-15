
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

    console.log('[OPTIMIZED READING SERVICE] Creating simplified reading exercise');

    try {
      const { data, error } = await supabase.functions.invoke('generate-reading-content', {
        body: {
          ...exerciseData,
          user_id: user.id,
          optimized: true,
          target_length: exerciseData.target_length || 500
        }
      });

      if (error) {
        console.error('[OPTIMIZED READING SERVICE] Exercise creation error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Failed to create exercise - no data returned');
      }

      // Handle both successful response and fallback response
      const content = data.text ? data : data.fallback_content;
      
      if (!content || !content.text) {
        throw new Error('Failed to create exercise - invalid response format');
      }

      return this.processCreatedExercise(content, exerciseData);
      
    } catch (error) {
      console.error('[OPTIMIZED READING SERVICE] Unexpected error:', error);
      throw new Error(`Failed to create reading exercise: ${error.message}`);
    }
  }

  private async processCreatedExercise(data: any, originalData: any): Promise<ReadingExercise> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    console.log('[OPTIMIZED READING SERVICE] Processing simplified exercise data');
    
    // Store the simplified content format
    const simplifiedContent = {
      text: data.text,
      metadata: data.metadata || {}
    };
    
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
        content: simplifiedContent,
        audio_generation_status: 'pending',
        metadata: {
          generation_method: data.metadata?.generation_method || 'simplified_workflow',
          created_at: new Date().toISOString(),
          audio_on_demand: true,
          processing_type: data.metadata?.processing_type || 'simplified'
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

  async generateAudioOnDemand(exerciseId: string): Promise<boolean> {
    console.log('[OPTIMIZED READING SERVICE] Starting on-demand audio generation for:', exerciseId);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const exercise = await this.getReadingExercise(exerciseId);
      
      await supabase
        .from('reading_exercises')
        .update({
          audio_generation_status: 'generating',
          updated_at: new Date().toISOString()
        })
        .eq('id', exerciseId);

      // Extract full text from simplified content format
      const fullText = exercise.content.text || '';
      
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
      return { text: '' };
    }
    
    if (typeof content === 'object' && content !== null) {
      // Handle both new simplified format and legacy format
      if (content.text) {
        return { text: content.text, metadata: content.metadata };
      }
      // Legacy format with sentences array - convert to simple text
      if (content.sentences && Array.isArray(content.sentences)) {
        const text = content.sentences.map(s => s.text).join(' ');
        return { text, metadata: content.metadata };
      }
      return content as ReadingExercise['content'];
    }
    
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        return this.parseContentFromDatabase(parsed);
      } catch {
        // If it's just a plain string, treat it as text content
        return { text: content };
      }
    }
    
    return { text: '' };
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

  async triggerAudioGeneration(exerciseId: string): Promise<boolean> {
    console.log('[OPTIMIZED READING SERVICE] Triggering audio generation for:', exerciseId);
    
    return this.generateAudioOnDemand(exerciseId);
  }
}

export const optimizedReadingService = new OptimizedReadingService();
