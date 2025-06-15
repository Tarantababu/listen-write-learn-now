
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AudioGenerationProgress {
  isGenerating: boolean;
  progress: number;
  stage: 'initializing' | 'processing' | 'uploading' | 'finalizing' | 'complete';
  estimatedTimeRemaining: number;
  currentItem?: string;
  totalItems?: number;
  completedItems?: number;
}

export interface AudioGenerationResult {
  success: boolean;
  audioUrl?: string;
  error?: string;
  metadata?: {
    duration?: number;
    size?: number;
    quality?: string;
  };
}

export class EnhancedAudioService {
  private progressCallback?: (progress: AudioGenerationProgress) => void;
  private abortController?: AbortController;

  setProgressCallback(callback: (progress: AudioGenerationProgress) => void) {
    this.progressCallback = callback;
  }

  private updateProgress(update: Partial<AudioGenerationProgress>) {
    if (this.progressCallback) {
      this.progressCallback({
        isGenerating: true,
        progress: 0,
        stage: 'initializing',
        estimatedTimeRemaining: 0,
        ...update
      });
    }
  }

  async generateSingleAudio(
    text: string, 
    language: string,
    options: {
      priority?: 'high' | 'normal' | 'low';
      quality?: 'standard' | 'high';
      background?: boolean;
    } = {}
  ): Promise<AudioGenerationResult> {
    const { priority = 'normal', quality = 'standard', background = false } = options;
    
    try {
      this.abortController = new AbortController();
      
      if (!background) {
        this.updateProgress({
          stage: 'initializing',
          progress: 0,
          estimatedTimeRemaining: this.estimateGenerationTime(text.length),
          currentItem: 'Preparing audio generation...'
        });
      }

      // Enhanced text processing for better audio quality
      const processedText = this.preprocessTextForAudio(text);
      
      if (!background) {
        this.updateProgress({
          stage: 'processing',
          progress: 25,
          currentItem: 'Generating audio...'
        });
      }

      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: processedText,
          language,
          quality,
          priority
        },
        headers: {
          'x-generation-mode': background ? 'background' : 'foreground'
        }
      });

      if (error) {
        console.error('Audio generation error:', error);
        throw new Error(error.message || 'Failed to generate audio');
      }

      if (!background) {
        this.updateProgress({
          stage: 'finalizing',
          progress: 90,
          currentItem: 'Finalizing audio...'
        });
      }

      const result: AudioGenerationResult = {
        success: true,
        audioUrl: data.audio_url || data.audioUrl,
        metadata: {
          duration: data.duration,
          size: data.size,
          quality: quality
        }
      };

      if (!background) {
        this.updateProgress({
          stage: 'complete',
          progress: 100,
          currentItem: 'Audio generation complete!'
        });
      }

      return result;

    } catch (error) {
      console.error('Enhanced audio generation failed:', error);
      return {
        success: false,
        error: error.message || 'Audio generation failed'
      };
    }
  }

  async generateBatchAudio(
    items: Array<{ text: string; language: string; id: string }>,
    options: {
      maxConcurrent?: number;
      quality?: 'standard' | 'high';
      retryFailures?: boolean;
    } = {}
  ): Promise<Map<string, AudioGenerationResult>> {
    const { maxConcurrent = 3, quality = 'standard', retryFailures = true } = options;
    const results = new Map<string, AudioGenerationResult>();
    
    this.updateProgress({
      stage: 'initializing',
      progress: 0,
      totalItems: items.length,
      completedItems: 0,
      currentItem: 'Starting batch audio generation...'
    });

    // Process items in batches to avoid overwhelming the service
    const batches = this.createBatches(items, maxConcurrent);
    let completedCount = 0;

    for (const batch of batches) {
      const batchPromises = batch.map(async (item) => {
        try {
          const result = await this.generateSingleAudio(item.text, item.language, {
            quality,
            background: true
          });
          
          results.set(item.id, result);
          completedCount++;
          
          this.updateProgress({
            stage: 'processing',
            progress: (completedCount / items.length) * 100,
            completedItems: completedCount,
            currentItem: `Generated audio for item ${completedCount}/${items.length}`
          });

          return { id: item.id, result };
        } catch (error) {
          const errorResult: AudioGenerationResult = {
            success: false,
            error: error.message
          };
          results.set(item.id, errorResult);
          completedCount++;
          return { id: item.id, result: errorResult };
        }
      });

      await Promise.allSettled(batchPromises);
      
      // Small delay between batches to prevent rate limiting
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Retry failed items if requested
    if (retryFailures) {
      const failedItems = Array.from(results.entries())
        .filter(([_, result]) => !result.success)
        .map(([id]) => items.find(item => item.id === id))
        .filter(Boolean);

      if (failedItems.length > 0) {
        this.updateProgress({
          stage: 'processing',
          progress: 95,
          currentItem: `Retrying ${failedItems.length} failed items...`
        });

        for (const item of failedItems) {
          try {
            const retryResult = await this.generateSingleAudio(item.text, item.language, {
              quality,
              background: true
            });
            results.set(item.id, retryResult);
          } catch (error) {
            console.warn(`Retry failed for item ${item.id}:`, error);
          }
        }
      }
    }

    this.updateProgress({
      stage: 'complete',
      progress: 100,
      completedItems: items.length,
      currentItem: 'Batch audio generation complete!'
    });

    return results;
  }

  private preprocessTextForAudio(text: string): string {
    // Enhanced text preprocessing for better audio quality
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Ensure proper sentence spacing
      .replace(/([,;:])\s*/g, '$1 ') // Normalize punctuation spacing
      .replace(/\b(Dr|Mr|Ms|Mrs|Prof)\./g, '$1') // Handle common abbreviations
      .replace(/\b(\d+)\.(\d+)\b/g, '$1 point $2'); // Handle decimal numbers
  }

  private estimateGenerationTime(textLength: number): number {
    // Estimate based on text length (rough calculation)
    const baseTime = 5; // 5 seconds base
    const timePerChar = 0.05; // 50ms per character
    return Math.max(baseTime, textLength * timePerChar);
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  abort() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  async validateAudioUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getAudioMetadata(url: string): Promise<{ duration?: number; size?: number } | null> {
    try {
      const audio = new Audio(url);
      return new Promise((resolve) => {
        audio.addEventListener('loadedmetadata', () => {
          resolve({
            duration: audio.duration,
            size: undefined // Size would need to be tracked during generation
          });
        });
        audio.addEventListener('error', () => resolve(null));
      });
    } catch {
      return null;
    }
  }
}

export const enhancedAudioService = new EnhancedAudioService();
