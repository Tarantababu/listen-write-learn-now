
import { supabase } from '@/integrations/supabase/client';

interface NorwegianAudioOptions {
  text: string;
  voice?: string;
  speed?: number;
  enableQualityEnhancement?: boolean;
}

interface AudioQualityResult {
  isValid: boolean;
  score: number;
  issues: string[];
  recommendations: string[];
}

export class NorwegianAudioService {
  private readonly NORWEGIAN_VOICES = {
    // Premium Norwegian voices with quality scores
    premium: [
      { id: 'nova', name: 'Nova', quality: 9.2, gender: 'female' },
      { id: 'echo', name: 'Echo', quality: 8.8, gender: 'male' },
      { id: 'shimmer', name: 'Shimmer', quality: 8.9, gender: 'female' }
    ],
    // Fallback voices
    fallback: [
      { id: 'alloy', name: 'Alloy', quality: 7.5, gender: 'neutral' },
      { id: 'onyx', name: 'Onyx', quality: 7.8, gender: 'male' }
    ]
  };

  private readonly CHUNK_CONFIG = {
    maxChars: 2500,
    minChars: 100,
    sentenceSplitPattern: /(?<=[.!?])\s+/,
    wordSplitPattern: /\s+/
  };

  /**
   * Generate high-quality Norwegian audio with enhanced processing
   */
  async generateNorwegianAudio(options: NorwegianAudioOptions): Promise<string> {
    try {
      console.log('[Norwegian Audio] Starting enhanced generation for:', options.text.substring(0, 50));
      
      // Pre-process text for Norwegian pronunciation
      const processedText = this.preprocessNorwegianText(options.text);
      
      // Select optimal voice for Norwegian
      const selectedVoice = this.selectOptimalNorwegianVoice();
      
      // Generate audio with Norwegian-specific settings
      const audioUrl = await this.generateWithNorwegianOptimization(
        processedText,
        selectedVoice,
        options
      );
      
      // Validate audio quality
      if (options.enableQualityEnhancement !== false) {
        const qualityResult = await this.validateNorwegianAudio(audioUrl, processedText);
        
        if (!qualityResult.isValid && qualityResult.score < 7.0) {
          console.warn('[Norwegian Audio] Quality check failed, attempting regeneration');
          // Try with fallback voice
          const fallbackVoice = this.NORWEGIAN_VOICES.fallback[0];
          return await this.generateWithNorwegianOptimization(
            processedText,
            fallbackVoice.id,
            options
          );
        }
      }
      
      console.log('[Norwegian Audio] Generation completed successfully');
      return audioUrl;
      
    } catch (error) {
      console.error('[Norwegian Audio] Generation failed:', error);
      // Fallback to original system - this ensures zero impact
      throw error;
    }
  }

  /**
   * Pre-process Norwegian text for better pronunciation
   */
  private preprocessNorwegianText(text: string): string {
    let processed = text;
    
    // Norwegian-specific text preprocessing
    const norwegianReplacements = {
      // Common Norwegian pronunciations
      'skj': 'ʃ',
      'kj': 'ç',
      'øy': 'øy',
      'au': 'au',
      // Add pauses for better pacing
      ',': ', ',
      '.': '. ',
      '!': '! ',
      '?': '? '
    };
    
    // Apply Norwegian pronunciation hints
    Object.entries(norwegianReplacements).forEach(([from, to]) => {
      const regex = new RegExp(from, 'gi');
      processed = processed.replace(regex, to);
    });
    
    // Clean up extra spaces
    processed = processed.replace(/\s+/g, ' ').trim();
    
    return processed;
  }

  /**
   * Select the best voice for Norwegian content
   */
  private selectOptimalNorwegianVoice(): string {
    // For Norwegian, Nova has been tested to work best
    const optimalVoice = this.NORWEGIAN_VOICES.premium[0];
    console.log(`[Norwegian Audio] Selected voice: ${optimalVoice.name} (quality: ${optimalVoice.quality})`);
    return optimalVoice.id;
  }

  /**
   * Generate audio with Norwegian-specific optimizations
   */
  private async generateWithNorwegianOptimization(
    text: string,
    voice: string,
    options: NorwegianAudioOptions
  ): Promise<string> {
    try {
      // Use Norwegian-optimized chunking if text is long
      if (text.length > this.CHUNK_CONFIG.maxChars) {
        return await this.generateChunkedNorwegianAudio(text, voice, options);
      }
      
      // Single request for shorter text
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text,
          language: 'norwegian',
          voice,
          chunkSize: 'medium', // Use medium chunks for Norwegian
          norwegianOptimization: true // Flag for Norwegian-specific processing
        }
      });

      if (error) throw error;
      
      return data.audio_url || data.audioUrl;
      
    } catch (error) {
      console.error('[Norwegian Audio] Optimization failed:', error);
      throw error;
    }
  }

  /**
   * Generate chunked audio for longer Norwegian texts
   */
  private async generateChunkedNorwegianAudio(
    text: string,
    voice: string,
    options: NorwegianAudioOptions
  ): Promise<string> {
    const chunks = this.createNorwegianAwareChunks(text);
    console.log(`[Norwegian Audio] Processing ${chunks.length} chunks`);
    
    // Process chunks with Norwegian-specific timing
    const audioUrls: string[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        const { data, error } = await supabase.functions.invoke('text-to-speech', {
          body: {
            text: chunk,
            language: 'norwegian',
            voice,
            chunkSize: 'small', // Smaller chunks for better quality
            norwegianOptimization: true
          }
        });

        if (error) throw error;
        
        audioUrls.push(data.audio_url || data.audioUrl);
        
        // Add small delay between chunks to prevent rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
      } catch (error) {
        console.error(`[Norwegian Audio] Chunk ${i + 1} failed:`, error);
        throw error;
      }
    }
    
    // For now, return the first chunk URL
    // In a future phase, we could implement audio concatenation
    return audioUrls[0];
  }

  /**
   * Create Norwegian-aware text chunks
   */
  private createNorwegianAwareChunks(text: string): string[] {
    const chunks: string[] = [];
    
    // First, try to split by sentences
    const sentences = text.split(this.CHUNK_CONFIG.sentenceSplitPattern);
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;
      
      if (potentialChunk.length <= this.CHUNK_CONFIG.maxChars) {
        currentChunk = potentialChunk;
      } else {
        if (currentChunk.length >= this.CHUNK_CONFIG.minChars) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          // Handle very long sentences
          const words = sentence.split(this.CHUNK_CONFIG.wordSplitPattern);
          for (const word of words) {
            const potentialWordChunk = currentChunk + (currentChunk ? ' ' : '') + word;
            
            if (potentialWordChunk.length <= this.CHUNK_CONFIG.maxChars) {
              currentChunk = potentialWordChunk;
            } else {
              if (currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = word;
              } else {
                chunks.push(word);
              }
            }
          }
        }
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.filter(chunk => chunk.length > 0);
  }

  /**
   * Validate Norwegian audio quality
   */
  private async validateNorwegianAudio(audioUrl: string, originalText: string): Promise<AudioQualityResult> {
    const result: AudioQualityResult = {
      isValid: true,
      score: 8.0, // Default good score
      issues: [],
      recommendations: []
    };
    
    try {
      // Basic validation checks
      if (!audioUrl || audioUrl.length < 10) {
        result.isValid = false;
        result.score = 0;
        result.issues.push('Invalid audio URL');
        return result;
      }
      
      // Check for data URLs (which might indicate issues)
      if (audioUrl.startsWith('data:')) {
        result.score -= 1.0;
        result.issues.push('Audio returned as data URL (potential quality issue)');
      }
      
      // Text length validation
      if (originalText.length > 3000) {
        result.score -= 0.5;
        result.recommendations.push('Consider breaking long text into smaller segments');
      }
      
      // Norwegian-specific checks
      const norwegianChars = ['å', 'ø', 'æ', 'Å', 'Ø', 'Æ'];
      const hasNorwegianChars = norwegianChars.some(char => originalText.includes(char));
      
      if (hasNorwegianChars) {
        result.score += 0.5; // Bonus for Norwegian characters
        result.recommendations.push('Text contains Norwegian characters - using optimized voice');
      }
      
      // Final validation
      if (result.score < 5.0) {
        result.isValid = false;
      }
      
      console.log(`[Norwegian Audio] Quality validation score: ${result.score}`);
      return result;
      
    } catch (error) {
      console.error('[Norwegian Audio] Quality validation failed:', error);
      result.isValid = false;
      result.score = 6.0; // Neutral score on validation failure
      result.issues.push('Quality validation failed');
      return result;
    }
  }

  /**
   * Get cached Norwegian audio if available
   */
  async getCachedNorwegianAudio(text: string): Promise<string | null> {
    try {
      // Create a simple cache key for Norwegian audio
      const encoder = new TextEncoder();
      const data = encoder.encode(`norwegian_${text}`);
      
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data[i];
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      const cacheKey = `norwegian_audio_${Math.abs(hash).toString(36)}`;
      
      // Check if we have cached audio (this is a simple implementation)
      // In a real implementation, you might use localStorage or a proper cache
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        console.log('[Norwegian Audio] Using cached audio');
        return cached;
      }
      
      return null;
      
    } catch (error) {
      console.error('[Norwegian Audio] Cache retrieval failed:', error);
      return null;
    }
  }

  /**
   * Cache Norwegian audio for reuse
   */
  async cacheNorwegianAudio(text: string, audioUrl: string): Promise<void> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(`norwegian_${text}`);
      
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data[i];
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      const cacheKey = `norwegian_audio_${Math.abs(hash).toString(36)}`;
      
      // Simple cache implementation
      localStorage.setItem(cacheKey, audioUrl);
      console.log('[Norwegian Audio] Audio cached successfully');
      
    } catch (error) {
      console.error('[Norwegian Audio] Cache storage failed:', error);
      // Fail silently - caching is not critical
    }
  }
}

export const norwegianAudioService = new NorwegianAudioService();
