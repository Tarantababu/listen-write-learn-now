import { supabase } from '@/integrations/supabase/client';

export interface TtsProgress {
  progress: number;
  message: string;
  chunksProcessed?: number;
  totalChunks?: number;
  timestamp: number;
}

export interface TtsGenerationOptions {
  text: string;
  language: string;
  chunkSize?: 'small' | 'medium' | 'large' | 'auto';
  onProgress?: (progress: TtsProgress) => void;
  signal?: AbortSignal;
}

export interface TtsGenerationResult {
  audioUrl: string;
  cached?: boolean;
  chunksProcessed?: number;
  chunkConfig?: string;
  sessionId: string;
}

class EnhancedTtsService {
  private activeGenerations = new Map<string, AbortController>();
  private progressIntervals = new Map<string, NodeJS.Timeout>();

  /**
   * Generate speech audio from text with enhanced features
   */
  async generateAudio(options: TtsGenerationOptions): Promise<TtsGenerationResult> {
    const {
      text,
      language,
      chunkSize = 'auto',
      onProgress,
      signal
    } = options;

    // Generate unique session ID for this request
    const sessionId = this.generateSessionId();
    const controller = new AbortController();
    
    // Store the controller for potential cancellation
    this.activeGenerations.set(sessionId, controller);

    // Handle external cancellation signal
    if (signal) {
      signal.addEventListener('abort', () => {
        this.cancelGeneration(sessionId);
      });
    }

    try {
      // Start progress polling if callback provided
      if (onProgress) {
        this.startProgressPolling(sessionId, onProgress);
      }

      // Check for cancellation before making request
      if (controller.signal.aborted) {
        throw new Error('Audio generation was cancelled');
      }

      // Make the main TTS request (removed signal parameter)
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text,
          language,
          chunkSize,
          sessionId
        }
      });

      // Check for cancellation after request
      if (controller.signal.aborted) {
        throw new Error('Audio generation was cancelled');
      }

      if (error) {
        throw new Error(error.message || 'Failed to generate audio');
      }

      // Stop progress polling
      this.stopProgressPolling(sessionId);

      // Clean up
      this.activeGenerations.delete(sessionId);

      return {
        audioUrl: data.audio_url,
        cached: data.cached,
        chunksProcessed: data.chunks_processed,
        chunkConfig: data.chunk_config,
        sessionId: data.session_id || sessionId
      };

    } catch (error) {
      // Clean up on error
      this.stopProgressPolling(sessionId);
      this.activeGenerations.delete(sessionId);
      
      if (error.name === 'AbortError' || controller.signal.aborted) {
        throw new Error('Audio generation was cancelled');
      }
      
      throw error;
    }
  }

  /**
   * Cancel an active audio generation
   */
  async cancelGeneration(sessionId: string): Promise<void> {
    const controller = this.activeGenerations.get(sessionId);
    
    if (controller) {
      // Cancel the local request
      controller.abort();
      
      // Also notify the server to cancel
      try {
        await supabase.functions.invoke('text-to-speech/cancel', {
          body: { sessionId }
        });
      } catch (error) {
        console.warn('Failed to notify server of cancellation:', error);
      }
      
      // Clean up
      this.stopProgressPolling(sessionId);
      this.activeGenerations.delete(sessionId);
    }
  }

  /**
   * Get current progress for a session
   */
  async getProgress(sessionId: string): Promise<TtsProgress | null> {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech/progress', {
        body: { sessionId }
      });

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Failed to fetch progress:', error);
      return null;
    }
  }

  /**
   * Check if a generation is currently active
   */
  isGenerationActive(sessionId: string): boolean {
    return this.activeGenerations.has(sessionId);
  }

  /**
   * Get all active generation session IDs
   */
  getActiveGenerations(): string[] {
    return Array.from(this.activeGenerations.keys());
  }

  /**
   * Cancel all active generations
   */
  async cancelAllGenerations(): Promise<void> {
    const sessionIds = this.getActiveGenerations();
    
    await Promise.all(
      sessionIds.map(sessionId => this.cancelGeneration(sessionId))
    );
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start polling for progress updates
   */
  private startProgressPolling(sessionId: string, onProgress: (progress: TtsProgress) => void): void {
    // Clear any existing interval
    this.stopProgressPolling(sessionId);

    const interval = setInterval(async () => {
      try {
        // Check if generation was cancelled
        const controller = this.activeGenerations.get(sessionId);
        if (!controller || controller.signal.aborted) {
          this.stopProgressPolling(sessionId);
          return;
        }

        const progress = await this.getProgress(sessionId);
        if (progress) {
          onProgress(progress);
          
          // Stop polling when complete
          if (progress.progress >= 100) {
            this.stopProgressPolling(sessionId);
          }
        }
      } catch (error) {
        console.warn('Progress polling error:', error);
      }
    }, 500); // Poll every 500ms

    this.progressIntervals.set(sessionId, interval);
  }

  /**
   * Stop progress polling for a session
   */
  private stopProgressPolling(sessionId: string): void {
    const interval = this.progressIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.progressIntervals.delete(sessionId);
    }
  }

  /**
   * Estimate generation time based on text characteristics
   */
  estimateGenerationTime(text: string, chunkSize: string = 'auto'): {
    estimatedSeconds: number;
    complexity: 'low' | 'medium' | 'high';
    chunksEstimate: number;
  } {
    const baseTimePerChar = 0.01; // seconds per character
    const chunkOverhead = 2; // seconds per chunk
    
    let maxChars: number;
    switch (chunkSize) {
      case 'small': maxChars = 2000; break;
      case 'medium': maxChars = 3000; break;
      case 'large': maxChars = 3800; break;
      default: maxChars = text.length <= 1000 ? 2000 : text.length <= 5000 ? 3000 : 3800;
    }
    
    const chunksEstimate = Math.ceil(text.length / maxChars);
    const baseTime = text.length * baseTimePerChar;
    const chunkTime = chunksEstimate > 1 ? chunksEstimate * chunkOverhead : 0;
    const estimatedSeconds = Math.round(baseTime + chunkTime);
    
    let complexity: 'low' | 'medium' | 'high';
    if (text.length < 500) complexity = 'low';
    else if (text.length < 2000) complexity = 'medium';
    else complexity = 'high';
    
    return {
      estimatedSeconds,
      complexity,
      chunksEstimate
    };
  }
}

export const enhancedTtsService = new EnhancedTtsService();
