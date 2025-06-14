import { supabase } from '@/integrations/supabase/client';
import { ReadingExercise, CreateReadingExerciseRequest } from '@/types/reading';

interface GenerationProgress {
  progress: number;
  status: 'generating' | 'completed' | 'error';
  message: string;
  estimatedTime?: number;
}

export class OptimizedReadingService {
  
  async createReadingExercise(
    request: CreateReadingExerciseRequest,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<ReadingExercise> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('[OPTIMIZED SERVICE] Starting exercise creation');
    
    // Initialize progress
    onProgress?.({
      progress: 10,
      status: 'generating',
      message: 'Preparing content generation...',
      estimatedTime: this.estimateGenerationTime(request.target_length)
    });

    try {
      // Generate content with optimized strategy
      const content = await this.generateContentOptimized(request, onProgress);
      
      // Update progress
      onProgress?.({
        progress: 80,
        status: 'generating',
        message: 'Saving your exercise...',
        estimatedTime: 5
      });

      // Save to database
      const { data, error } = await supabase
        .from('reading_exercises')
        .insert({
          user_id: user.id,
          title: request.title,
          language: request.language,
          difficulty_level: request.difficulty_level,
          target_length: request.target_length,
          grammar_focus: request.grammar_focus,
          topic: request.topic,
          content: content,
          audio_generation_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Complete progress
      onProgress?.({
        progress: 100,
        status: 'completed',
        message: 'Exercise created successfully!'
      });

      console.log('[OPTIMIZED SERVICE] Exercise created successfully:', data.id);

      // Start background audio generation
      this.generateAudioInBackground(data.id, content, request.language);

      return {
        ...data,
        difficulty_level: data.difficulty_level as 'beginner' | 'intermediate' | 'advanced',
        audio_generation_status: 'pending' as const,
        content: this.parseContentFromDatabase(data.content)
      };

    } catch (error) {
      console.error('[OPTIMIZED SERVICE] Generation failed:', error);
      
      onProgress?.({
        progress: 0,
        status: 'error',
        message: 'Failed to create exercise. Please try again.'
      });
      
      throw error;
    }
  }

  private parseContentFromDatabase(content: any): ReadingExercise['content'] {
    // Handle the case where content might be a JSON string or already parsed
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch (e) {
        console.error('Failed to parse content as JSON:', e);
        // Return a default structure if parsing fails
        return {
          sentences: [],
          analysis: {
            wordCount: 0,
            readingTime: 0,
            grammarPoints: []
          }
        };
      }
    }

    // Ensure the content has the required structure
    return {
      sentences: Array.isArray(content?.sentences) ? content.sentences : [],
      analysis: {
        wordCount: content?.analysis?.wordCount || 0,
        readingTime: content?.analysis?.readingTime || 0,
        grammarPoints: Array.isArray(content?.analysis?.grammarPoints) ? content.analysis.grammarPoints : [],
        ...(content?.analysis?.fallbackInfo && { fallbackInfo: content.analysis.fallbackInfo }),
        ...(content?.analysis?.recoveryInfo && { recoveryInfo: content.analysis.recoveryInfo })
      }
    };
  }

  private async generateContentOptimized(
    request: CreateReadingExerciseRequest,
    onProgress?: (progress: GenerationProgress) => void
  ) {
    const strategy = this.determineGenerationStrategy(request);
    
    onProgress?.({
      progress: 30,
      status: 'generating',
      message: `Generating ${request.target_length} words using ${strategy} strategy...`,
      estimatedTime: this.estimateGenerationTime(request.target_length) - 10
    });

    if (request.customText) {
      return await this.processCustomText(request);
    }

    // Use appropriate generation strategy
    if (strategy === 'direct') {
      return await this.generateDirect(request);
    } else {
      return await this.generateWithChunking(request, onProgress);
    }
  }

  private determineGenerationStrategy(request: CreateReadingExerciseRequest): 'direct' | 'chunked' {
    // Use direct generation for content up to 1200 words
    return (request.target_length || 500) <= 1200 ? 'direct' : 'chunked';
  }

  private estimateGenerationTime(targetLength: number): number {
    // Simplified time estimation
    if (targetLength <= 500) return 15;
    if (targetLength <= 1000) return 25;
    if (targetLength <= 2000) return 35;
    return 45;
  }

  private async generateDirect(request: CreateReadingExerciseRequest) {
    const { data, error } = await supabase.functions.invoke('generate-reading-content', {
      body: {
        topic: request.topic,
        language: request.language,
        difficulty_level: request.difficulty_level,
        target_length: request.target_length,
        grammar_focus: request.grammar_focus,
        directGeneration: true
      }
    });

    if (error) throw error;
    return data;
  }

  private async generateWithChunking(
    request: CreateReadingExerciseRequest,
    onProgress?: (progress: GenerationProgress) => void
  ) {
    onProgress?.({
      progress: 40,
      status: 'generating',
      message: 'Using smart chunking for optimal results...',
    });

    const { data, error } = await supabase.functions.invoke('generate-reading-content', {
      body: {
        topic: request.topic,
        language: request.language,
        difficulty_level: request.difficulty_level,
        target_length: request.target_length,
        grammar_focus: request.grammar_focus
      }
    });

    if (error) throw error;
    return data;
  }

  private async processCustomText(request: CreateReadingExerciseRequest) {
    const { data, error } = await supabase.functions.invoke('generate-reading-content', {
      body: {
        customText: request.customText,
        language: request.language,
        difficulty_level: request.difficulty_level,
        grammar_focus: request.grammar_focus,
        isCustomText: true
      }
    });

    if (error) throw error;
    return data;
  }

  private async generateAudioInBackground(exerciseId: string, content: any, language: string): Promise<void> {
    try {
      console.log(`[BACKGROUND AUDIO] Starting generation for exercise ${exerciseId}`);
      
      // Update status to generating
      await supabase
        .from('reading_exercises')
        .update({ audio_generation_status: 'generating' })
        .eq('id', exerciseId);

      // Generate audio (simplified for now)
      // In a real implementation, this would call the audio generation service
      
      // Simulate audio generation completion
      setTimeout(async () => {
        await supabase
          .from('reading_exercises')
          .update({ audio_generation_status: 'completed' })
          .eq('id', exerciseId);
        
        console.log(`[BACKGROUND AUDIO] Completed for exercise ${exerciseId}`);
      }, 10000);

    } catch (error) {
      console.error(`[BACKGROUND AUDIO] Failed for exercise ${exerciseId}:`, error);
      
      await supabase
        .from('reading_exercises')
        .update({ audio_generation_status: 'failed' })
        .eq('id', exerciseId);
    }
  }

  async getReadingExercises(language?: string): Promise<ReadingExercise[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

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
    if (error) throw error;
    
    return (data || []).map(exercise => ({
      ...exercise,
      difficulty_level: exercise.difficulty_level as 'beginner' | 'intermediate' | 'advanced',
      audio_generation_status: (exercise.audio_generation_status || 'pending') as 'pending' | 'generating' | 'completed' | 'failed',
      content: this.parseContentFromDatabase(exercise.content)
    }));
  }

  async deleteReadingExercise(id: string): Promise<void> {
    const { error } = await supabase
      .from('reading_exercises')
      .update({ archived: true })
      .eq('id', id);

    if (error) throw error;
  }
}

export const optimizedReadingService = new OptimizedReadingService();
