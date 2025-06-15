
import { supabase } from '@/integrations/supabase/client';

interface AudioGenerationOptions {
  quality?: 'standard' | 'high';
  priority?: 'normal' | 'high';
}

export interface AudioGenerationResult {
  success: boolean;
  audioUrl?: string;
  error?: string;
  metadata?: {
    filename: string;
    size: number;
    duration: number;
    voice: string;
    quality: string;
    language: string;
  };
}

export interface AudioGenerationProgress {
  isGenerating: boolean;
  progress: number;
  stage: 'initializing' | 'processing' | 'uploading' | 'finalizing' | 'complete';
  estimatedTimeRemaining: number;
  currentItem?: string;
  totalItems?: number;
  completedItems?: number;
}

export class EnhancedAudioService {
  private progressCallback?: (progress: AudioGenerationProgress) => void;
  private abortController?: AbortController;

  setProgressCallback(callback: (progress: AudioGenerationProgress) => void) {
    this.progressCallback = callback;
  }

  abort() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private updateProgress(progress: Partial<AudioGenerationProgress>) {
    if (this.progressCallback) {
      this.progressCallback({
        isGenerating: true,
        progress: 0,
        stage: 'initializing',
        estimatedTimeRemaining: 0,
        ...progress
      });
    }
  }

  estimateGenerationTime(textLength: number): number {
    // Improved estimate: base time + text processing time
    const baseTime = 3; // seconds
    const processingTime = Math.ceil(textLength / 100); // 1 second per 100 chars
    return Math.min(baseTime + processingTime, 30); // Cap at 30 seconds
  }
  
  async generateSingleAudio(
    text: string, 
    language: string, 
    options: AudioGenerationOptions = {}
  ): Promise<AudioGenerationResult> {
    
    console.log(`[ENHANCED AUDIO] Starting generation for ${text.length} characters in ${language}`);
    
    this.abortController = new AbortController();
    
    try {
      this.updateProgress({
        stage: 'initializing',
        progress: 10
      });

      // Validate input
      if (!text.trim()) {
        throw new Error('Text cannot be empty');
      }

      if (text.length > 4096) {
        console.warn(`[ENHANCED AUDIO] Text truncated from ${text.length} to 4096 characters`);
        text = text.substring(0, 4096);
      }

      this.updateProgress({
        stage: 'processing',
        progress: 30
      });

      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: text.trim(),
          language: language,
          quality: options.quality || 'standard',
          priority: options.priority || 'normal'
        }
      });

      this.updateProgress({
        stage: 'uploading',
        progress: 70
      });

      if (error) {
        console.error('[ENHANCED AUDIO] Supabase function error:', error);
        throw new Error(`Audio generation failed: ${error.message}`);
      }

      if (!data) {
        console.error('[ENHANCED AUDIO] No data returned from function');
        throw new Error('No data returned from audio generation service');
      }

      console.log('[ENHANCED AUDIO] Function response received');

      this.updateProgress({
        stage: 'finalizing',
        progress: 90
      });

      if (data.success && data.audioUrl) {
        console.log(`[ENHANCED AUDIO] Successfully generated audio: ${data.audioUrl}`);
        
        this.updateProgress({
          stage: 'complete',
          progress: 100
        });
        
        return {
          success: true,
          audioUrl: data.audioUrl,
          metadata: {
            filename: data.filename || 'unknown',
            size: data.size || 0,
            duration: data.duration || 0,
            voice: data.voice || 'alloy',
            quality: data.quality || 'standard',
            language: data.language || language
          }
        };
      } else {
        console.error('[ENHANCED AUDIO] Function returned unsuccessful result:', data);
        throw new Error(data.error || 'Audio generation failed');
      }

    } catch (error) {
      console.error('[ENHANCED AUDIO] Generation error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown audio generation error'
      };
    }
  }

  async validateAndFixExerciseAudio(exerciseId: string): Promise<boolean> {
    console.log(`[ENHANCED AUDIO] Validating audio for exercise: ${exerciseId}`);
    
    try {
      // Get exercise details
      const { data: exercise, error: exerciseError } = await supabase
        .from('reading_exercises')
        .select('*')
        .eq('id', exerciseId)
        .single();

      if (exerciseError || !exercise) {
        console.error('[ENHANCED AUDIO] Failed to fetch exercise:', exerciseError);
        return false;
      }

      console.log(`[ENHANCED AUDIO] Exercise status: ${exercise.audio_generation_status}`);
      console.log(`[ENHANCED AUDIO] Has audio_url: ${!!exercise.audio_url}`);
      console.log(`[ENHANCED AUDIO] Has full_text_audio_url: ${!!exercise.full_text_audio_url}`);

      // Check if audio regeneration is needed
      const needsRegeneration = (
        exercise.audio_generation_status === 'completed' && 
        !exercise.audio_url && 
        !exercise.full_text_audio_url
      ) || exercise.audio_generation_status === 'failed';

      if (needsRegeneration) {
        console.log('[ENHANCED AUDIO] Audio regeneration needed');
        
        // Extract full text safely
        let fullText = '';
        if (exercise.content && typeof exercise.content === 'object') {
          const content = exercise.content as any;
          if (content.sentences && Array.isArray(content.sentences)) {
            fullText = content.sentences.map((s: any) => s.text).join(' ');
          }
        }
        
        if (!fullText.trim()) {
          console.error('[ENHANCED AUDIO] No text content found for regeneration');
          return false;
        }

        // Generate audio
        const result = await this.generateSingleAudio(fullText, exercise.language, {
          quality: 'standard',
          priority: 'high'
        });

        if (result.success && result.audioUrl) {
          // Update exercise with audio URL
          const { error: updateError } = await supabase
            .from('reading_exercises')
            .update({
              audio_url: result.audioUrl,
              full_text_audio_url: result.audioUrl,
              audio_generation_status: 'completed',
              metadata: {
                ...(typeof exercise.metadata === 'object' ? exercise.metadata : {}),
                audio_regenerated_at: new Date().toISOString(),
                audio_metadata: result.metadata
              }
            })
            .eq('id', exerciseId);

          if (updateError) {
            console.error('[ENHANCED AUDIO] Failed to update exercise with audio URL:', updateError);
            return false;
          }

          console.log(`[ENHANCED AUDIO] Successfully regenerated audio for exercise: ${exerciseId}`);
          return true;
        } else {
          console.error('[ENHANCED AUDIO] Failed to regenerate audio:', result.error);
          return false;
        }
      }

      // If has audio URLs, validate they're accessible
      const audioUrl = exercise.full_text_audio_url || exercise.audio_url;
      if (audioUrl) {
        try {
          const response = await fetch(audioUrl, { method: 'HEAD' });
          if (response.ok) {
            console.log('[ENHANCED AUDIO] Audio URL is valid and accessible');
            return true;
          } else {
            console.warn('[ENHANCED AUDIO] Audio URL is not accessible, status:', response.status);
            return false;
          }
        } catch (error) {
          console.error('[ENHANCED AUDIO] Failed to validate audio URL:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('[ENHANCED AUDIO] Validation error:', error);
      return false;
    }
  }

  async batchValidateExercises(limit: number = 10): Promise<void> {
    console.log(`[ENHANCED AUDIO] Starting batch validation of up to ${limit} exercises`);
    
    try {
      // Get exercises that need audio regeneration
      const { data: exercises, error } = await supabase
        .from('reading_exercises')
        .select('id, title, language, audio_generation_status, audio_url, full_text_audio_url')
        .or('and(audio_generation_status.eq.completed,audio_url.is.null,full_text_audio_url.is.null),audio_generation_status.eq.failed')
        .limit(limit);

      if (error) {
        console.error('[ENHANCED AUDIO] Failed to fetch exercises for validation:', error);
        return;
      }

      if (!exercises || exercises.length === 0) {
        console.log('[ENHANCED AUDIO] No exercises found that need audio regeneration');
        return;
      }

      console.log(`[ENHANCED AUDIO] Found ${exercises.length} exercises that need audio regeneration`);

      // Process exercises concurrently with controlled concurrency
      const concurrencyLimit = 3;
      const results = [];
      
      for (let i = 0; i < exercises.length; i += concurrencyLimit) {
        const batch = exercises.slice(i, i + concurrencyLimit);
        const batchPromises = batch.map(exercise => {
          console.log(`[ENHANCED AUDIO] Processing exercise: ${exercise.title} (${exercise.id})`);
          return this.validateAndFixExerciseAudio(exercise.id);
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);
        
        // Add a small delay between batches to avoid overwhelming the system
        if (i + concurrencyLimit < exercises.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
      console.log(`[ENHANCED AUDIO] Batch validation completed: ${successful}/${exercises.length} successful`);
    } catch (error) {
      console.error('[ENHANCED AUDIO] Batch validation error:', error);
    }
  }
}

export const enhancedAudioService = new EnhancedAudioService();
