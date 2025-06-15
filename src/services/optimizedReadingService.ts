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
    
    if (data && data.length > 0) {
      console.log('[OPTIMIZED READING SERVICE] Sample raw exercise:', {
        id: data[0].id,
        title: data[0].title,
        audio_url: data[0].audio_url,
        full_text_audio_url: data[0].full_text_audio_url,
        audio_generation_status: data[0].audio_generation_status
      });
    }

    const mappedExercises = (data || []).map(exercise => this.mapExerciseFromDb(exercise));
    
    console.log('[OPTIMIZED READING SERVICE] Mapped exercises:', mappedExercises.length);
    
    if (mappedExercises.length > 0) {
      console.log('[OPTIMIZED READING SERVICE] Sample mapped exercise:', {
        id: mappedExercises[0].id,
        title: mappedExercises[0].title,
        audio_url: mappedExercises[0].audio_url,
        full_text_audio_url: mappedExercises[0].full_text_audio_url,
        audio_generation_status: mappedExercises[0].audio_generation_status
      });
    }

    return mappedExercises;
  }

  async createReadingExercise(exerciseData: any, onProgress?: (progress: any) => void): Promise<ReadingExercise> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('[OPTIMIZED READING SERVICE] Creating reading exercise');

    // Call the generate-reading-content edge function
    const { data, error } = await supabase.functions.invoke('generate-reading-content', {
      body: {
        ...exerciseData,
        user_id: user.id
      }
    });

    if (error) {
      console.error('[OPTIMIZED READING SERVICE] Exercise creation error:', error);
      throw error;
    }

    if (!data || !data.id) {
      throw new Error('Failed to create exercise');
    }

    // Fetch the created exercise
    return this.getReadingExercise(data.id);
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

  private mapExerciseFromDb(exercise: any): ReadingExercise {
    console.log('[OPTIMIZED READING SERVICE] Mapping exercise from DB:', {
      id: exercise.id,
      title: exercise.title,
      audio_url: exercise.audio_url,
      full_text_audio_url: exercise.full_text_audio_url,
      audio_generation_status: exercise.audio_generation_status
    });

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
      audio_url: exercise.audio_url, // Explicitly preserve audio_url
      full_text_audio_url: exercise.full_text_audio_url, // Explicitly preserve full_text_audio_url
      audio_generation_status: (exercise.audio_generation_status || 'pending') as 'pending' | 'generating' | 'completed' | 'failed',
      metadata: this.parseMetadataFromDatabase(exercise.metadata),
      created_at: exercise.created_at,
      updated_at: exercise.updated_at,
      archived: exercise.archived || false
    };

    console.log('[OPTIMIZED READING SERVICE] Mapped exercise result:', {
      id: mapped.id,
      title: mapped.title,
      audio_url: mapped.audio_url,
      full_text_audio_url: mapped.full_text_audio_url,
      audio_generation_status: mapped.audio_generation_status
    });

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

    console.log('[OPTIMIZED READING SERVICE] Single exercise raw data:', {
      id: data.id,
      title: data.title,
      audio_url: data.audio_url,
      full_text_audio_url: data.full_text_audio_url,
      audio_generation_status: data.audio_generation_status
    });

    const mapped = this.mapExerciseFromDb(data);
    
    console.log('[OPTIMIZED READING SERVICE] Single exercise mapped:', {
      id: mapped.id,
      title: mapped.title,
      audio_url: mapped.audio_url,
      full_text_audio_url: mapped.full_text_audio_url,
      audio_generation_status: mapped.audio_generation_status
    });

    return mapped;
  }
}

export const optimizedReadingService = new OptimizedReadingService();
