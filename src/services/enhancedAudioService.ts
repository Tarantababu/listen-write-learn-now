
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
    retryCount?: number;
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
      maxRetries?: number;
    } = {}
  ): Promise<AudioGenerationResult> {
    const { 
      priority = 'normal', 
      quality = 'standard', 
      background = false,
      maxRetries = 2
    } = options;
    
    let lastError: any = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.abortController = new AbortController();
        
        if (!background) {
          this.updateProgress({
            stage: 'initializing',
            progress: 0,
            estimatedTimeRemaining: this.estimateGenerationTime(text.length),
            currentItem: attempt > 0 ? `Retry ${attempt}: Preparing audio...` : 'Preparing audio generation...'
          });
        }

        // Enhanced text validation and preprocessing
        if (!text || text.trim().length === 0) {
          throw new Error('Text is required for audio generation');
        }

        if (text.length > 4096) {
          console.warn('[ENHANCED AUDIO] Text too long, truncating to 4096 characters');
          text = text.substring(0, 4096);
        }

        const processedText = this.preprocessTextForAudio(text);
        
        if (!background) {
          this.updateProgress({
            stage: 'processing',
            progress: 25,
            currentItem: attempt > 0 ? `Retry ${attempt}: Generating audio...` : 'Generating audio...'
          });
        }

        console.log(`[ENHANCED AUDIO] Generating audio (attempt ${attempt + 1}/${maxRetries + 1}) for ${processedText.length} characters in ${language}`);

        const { data, error } = await supabase.functions.invoke('text-to-speech', {
          body: {
            text: processedText,
            language,
            quality,
            priority
          },
          headers: {
            'x-generation-mode': background ? 'background' : 'foreground',
            'x-retry-attempt': attempt.toString()
          }
        });

        if (error) {
          console.error(`[ENHANCED AUDIO] Generation error (attempt ${attempt + 1}):`, error);
          lastError = new Error(error.message || 'Failed to generate audio');
          
          if (attempt < maxRetries) {
            console.log(`[ENHANCED AUDIO] Retrying in ${(attempt + 1) * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
            continue;
          }
          throw lastError;
        }

        if (!data || !data.success) {
          console.error(`[ENHANCED AUDIO] Invalid response (attempt ${attempt + 1}):`, data);
          lastError = new Error(data?.error || 'Invalid response from audio service');
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
            continue;
          }
          throw lastError;
        }

        // Validate that we have a proper audio URL
        const audioUrl = data.audio_url || data.audioUrl;
        if (!audioUrl) {
          console.error(`[ENHANCED AUDIO] No audio URL in response (attempt ${attempt + 1}):`, data);
          lastError = new Error('No audio URL returned from service');
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
            continue;
          }
          throw lastError;
        }

        // Validate the URL format
        if (!this.isValidUrl(audioUrl)) {
          console.error(`[ENHANCED AUDIO] Invalid audio URL format (attempt ${attempt + 1}):`, audioUrl);
          lastError = new Error('Invalid audio URL format returned');
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
            continue;
          }
          throw lastError;
        }

        if (!background) {
          this.updateProgress({
            stage: 'finalizing',
            progress: 90,
            currentItem: 'Validating audio...'
          });
        }

        // Enhanced validation with multiple checks
        const isAccessible = await this.validateAudioUrlEnhanced(audioUrl);
        if (!isAccessible && attempt < maxRetries) {
          console.warn(`[ENHANCED AUDIO] Generated audio URL not accessible (attempt ${attempt + 1}), retrying...`);
          lastError = new Error('Generated audio URL is not accessible');
          await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
          continue;
        }

        const result: AudioGenerationResult = {
          success: true,
          audioUrl: audioUrl,
          metadata: {
            duration: data.duration,
            size: data.size,
            quality: quality,
            retryCount: attempt
          }
        };

        if (!background) {
          this.updateProgress({
            stage: 'complete',
            progress: 100,
            currentItem: attempt > 0 ? `Audio generated successfully after ${attempt + 1} attempts!` : 'Audio generation complete!'
          });
        }

        console.log(`[ENHANCED AUDIO] Successfully generated audio (attempt ${attempt + 1}): ${audioUrl}`);
        return result;

      } catch (error) {
        console.error(`[ENHANCED AUDIO] Generation failed (attempt ${attempt + 1}):`, error);
        lastError = error;
        
        if (attempt < maxRetries) {
          console.log(`[ENHANCED AUDIO] Will retry attempt ${attempt + 2}/${maxRetries + 1}`);
          continue;
        }
      }
    }

    console.error(`[ENHANCED AUDIO] All ${maxRetries + 1} attempts failed:`, lastError);
    return {
      success: false,
      error: lastError?.message || 'Audio generation failed after multiple attempts',
      metadata: {
        retryCount: maxRetries
      }
    };
  }

  async generateBatchAudio(
    items: Array<{ text: string; language: string; id: string }>,
    options: {
      maxConcurrent?: number;
      quality?: 'standard' | 'high';
      retryFailures?: boolean;
    } = {}
  ): Promise<Map<string, AudioGenerationResult>> {
    const { maxConcurrent = 2, quality = 'standard', retryFailures = true } = options;
    const results = new Map<string, AudioGenerationResult>();
    
    console.log(`[ENHANCED BATCH] Starting batch generation for ${items.length} items with max ${maxConcurrent} concurrent`);
    
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

    for (const [batchIndex, batch] of batches.entries()) {
      console.log(`[ENHANCED BATCH] Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} items`);
      
      const batchPromises = batch.map(async (item) => {
        try {
          const result = await this.generateSingleAudio(item.text, item.language, {
            quality,
            background: true,
            maxRetries: 1 // Reduce retries in batch mode for speed
          });
          
          results.set(item.id, result);
          completedCount++;
          
          this.updateProgress({
            stage: 'processing',
            progress: (completedCount / items.length) * 80, // Reserve 20% for final processing
            completedItems: completedCount,
            currentItem: `Generated audio for item ${completedCount}/${items.length} (${item.id})`
          });

          return { id: item.id, result };
        } catch (error) {
          const errorResult: AudioGenerationResult = {
            success: false,
            error: error.message,
            metadata: { retryCount: 0 }
          };
          results.set(item.id, errorResult);
          completedCount++;
          console.error(`[ENHANCED BATCH] Failed to generate audio for item ${item.id}:`, error);
          return { id: item.id, result: errorResult };
        }
      });

      await Promise.allSettled(batchPromises);
      
      // Adaptive delay between batches based on success rate
      if (batchIndex < batches.length - 1) {
        const batchResults = Array.from(results.values()).slice(-batch.length);
        const successRate = batchResults.filter(r => r.success).length / batchResults.length;
        const delay = successRate < 0.5 ? 3000 : successRate < 0.8 ? 2000 : 1000;
        
        console.log(`[ENHANCED BATCH] Batch ${batchIndex + 1} success rate: ${(successRate * 100).toFixed(1)}%, waiting ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Enhanced retry logic for failed items
    if (retryFailures) {
      const failedItems = Array.from(results.entries())
        .filter(([_, result]) => !result.success)
        .map(([id]) => items.find(item => item.id === id))
        .filter(Boolean);

      if (failedItems.length > 0) {
        console.log(`[ENHANCED BATCH] Retrying ${failedItems.length} failed items with enhanced parameters`);
        
        this.updateProgress({
          stage: 'processing',
          progress: 85,
          currentItem: `Retrying ${failedItems.length} failed items with enhanced settings...`
        });

        for (const item of failedItems) {
          try {
            const retryResult = await this.generateSingleAudio(item.text, item.language, {
              quality,
              background: true,
              maxRetries: 2 // More retries for failed items
            });
            results.set(item.id, retryResult);
            
            if (retryResult.success) {
              console.log(`[ENHANCED BATCH] Successfully retried item ${item.id}`);
            }
          } catch (error) {
            console.warn(`[ENHANCED BATCH] Enhanced retry failed for item ${item.id}:`, error);
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

    const successCount = Array.from(results.values()).filter(r => r.success).length;
    const failureCount = items.length - successCount;
    
    console.log(`[ENHANCED BATCH] Completed with ${successCount}/${items.length} successful generations`);
    if (failureCount > 0) {
      console.warn(`[ENHANCED BATCH] ${failureCount} items failed generation`);
    }

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
      .replace(/\b(\d+)\.(\d+)\b/g, '$1 point $2') // Handle decimal numbers
      .replace(/\n+/g, '. ') // Convert line breaks to sentence breaks
      .replace(/\s*\.\s*\./g, '.'); // Remove double periods
  }

  private estimateGenerationTime(textLength: number): number {
    // Enhanced estimation based on text length and system load
    const baseTime = 8; // 8 seconds base
    const timePerChar = 0.03; // 30ms per character (reduced from 50ms)
    const complexity = textLength > 2000 ? 1.5 : textLength > 1000 ? 1.2 : 1.0;
    
    return Math.max(baseTime, (textLength * timePerChar * complexity));
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') &&
             parsedUrl.hostname.length > 0 &&
             !parsedUrl.hostname.includes('localhost') &&
             !parsedUrl.hostname.includes('127.0.0.1');
    } catch {
      return false;
    }
  }

  abort() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private async validateAudioUrlEnhanced(url: string): Promise<boolean> {
    const maxAttempts = 3;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const response = await fetch(url, { 
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          // Additional validation: check content type
          const contentType = response.headers.get('content-type');
          if (contentType && (contentType.includes('audio') || contentType.includes('mpeg'))) {
            console.log(`[ENHANCED AUDIO] URL validation successful (attempt ${attempt + 1}): ${url}`);
            return true;
          } else {
            console.warn(`[ENHANCED AUDIO] Invalid content type (attempt ${attempt + 1}): ${contentType}`);
          }
        } else {
          console.warn(`[ENHANCED AUDIO] URL validation failed (attempt ${attempt + 1}): ${response.status}`);
        }
        
      } catch (error) {
        console.warn(`[ENHANCED AUDIO] URL validation error (attempt ${attempt + 1}):`, error.message);
      }
      
      // Wait before retry
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.error(`[ENHANCED AUDIO] URL validation failed after ${maxAttempts} attempts: ${url}`);
    return false;
  }

  async getAudioMetadata(url: string): Promise<{ duration?: number; size?: number } | null> {
    try {
      const audio = new Audio(url);
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          audio.removeEventListener('loadedmetadata', onLoad);
          audio.removeEventListener('error', onError);
          resolve(null);
        }, 15000); // 15 second timeout
        
        const onLoad = () => {
          clearTimeout(timeout);
          audio.removeEventListener('error', onError);
          resolve({
            duration: audio.duration,
            size: undefined // Size would need to be tracked during generation
          });
        };
        
        const onError = () => {
          clearTimeout(timeout);
          audio.removeEventListener('loadedmetadata', onLoad);
          resolve(null);
        };
        
        audio.addEventListener('loadedmetadata', onLoad);
        audio.addEventListener('error', onError);
      });
    } catch {
      return null;
    }
  }
}

export const enhancedAudioService = new EnhancedAudioService();
