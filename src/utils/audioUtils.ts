
export class AudioUtils {
  static isValidAudioUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    try {
      const parsedUrl = new URL(url);
      return (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') &&
             parsedUrl.pathname.includes('supabase') &&
             (parsedUrl.pathname.endsWith('.mp3') || parsedUrl.pathname.endsWith('.wav'));
    } catch {
      return false;
    }
  }

  static async validateAudioAccessibility(url: string, skipAccessibilityCheck = false): Promise<boolean> {
    if (!this.isValidAudioUrl(url)) {
      console.warn(`[AUDIO UTILS] Invalid audio URL format: ${url}`);
      return false;
    }
    
    // If we're skipping accessibility check (fallback mode), just validate URL format
    if (skipAccessibilityCheck) {
      console.log(`[AUDIO UTILS] Skipping accessibility check for ${url} - assuming accessible`);
      return true;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Increased timeout for better reliability
      
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const isAccessible = response.ok;
      
      if (!isAccessible) {
        console.warn(`[AUDIO UTILS] Audio not accessible (${response.status}): ${url}`);
      } else {
        console.log(`[AUDIO UTILS] Audio accessible: ${url}`);
      }
      
      return isAccessible;
    } catch (error) {
      console.warn(`[AUDIO UTILS] Accessibility check failed for ${url}:`, error);
      // Don't treat network errors as definitive failures
      return false;
    }
  }

  static getPreferredAudioUrl(exercise: any): string | null {
    // Enhanced priority: full_text_audio_url > audio_url
    const candidates = [
      exercise.full_text_audio_url,
      exercise.audio_url
    ];

    for (const url of candidates) {
      if (this.isValidAudioUrl(url)) {
        console.log(`[AUDIO UTILS] Found valid audio URL: ${url}`);
        return url;
      }
    }

    console.warn(`[AUDIO UTILS] No valid audio URL found in exercise:`, {
      full_text_audio_url: exercise.full_text_audio_url,
      audio_url: exercise.audio_url
    });
    return null;
  }

  static async preloadAudio(url: string): Promise<HTMLAudioElement | null> {
    if (!this.isValidAudioUrl(url)) return null;

    try {
      const audio = new Audio();
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          audio.removeEventListener('canplaythrough', onLoad);
          audio.removeEventListener('error', onError);
          reject(new Error('Audio preload timeout'));
        }, 10000); // Increased timeout
        
        const onLoad = () => {
          clearTimeout(timeout);
          audio.removeEventListener('error', onError);
          console.log(`[AUDIO UTILS] Audio preloaded successfully: ${url}`);
          resolve(audio);
        };
        
        const onError = () => {
          clearTimeout(timeout);
          audio.removeEventListener('canplaythrough', onLoad);
          console.error(`[AUDIO UTILS] Audio preload failed: ${url}`);
          reject(new Error('Audio preload failed'));
        };
        
        audio.addEventListener('canplaythrough', onLoad);
        audio.addEventListener('error', onError);
        audio.src = url;
        audio.load();
      });
    } catch (error) {
      console.error('[AUDIO UTILS] Preload failed:', error);
      return null;
    }
  }

  static formatAudioDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  static calculateEstimatedDuration(textLength: number): number {
    // Improved estimate: ~12 characters per second (average reading speed with pauses)
    const charsPerSecond = 12;
    return Math.max(1, Math.ceil(textLength / charsPerSecond));
  }

  // Enhanced utility methods for optimized workflow
  static async validateAudioQuickly(url: string): Promise<boolean> {
    if (!this.isValidAudioUrl(url)) return false;
    
    try {
      // Quick HEAD request with short timeout
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }

  static getAudioMetadata(url: string): { type: string; source: string } {
    if (!url) return { type: 'none', source: 'none' };
    
    if (url.includes('tts/')) {
      return { type: 'text-to-speech', source: 'optimized' };
    }
    
    return { type: 'audio', source: 'legacy' };
  }

  // New comprehensive audio status check
  static async getAudioStatus(exercise: any): Promise<{
    hasAudio: boolean;
    isAccessible: boolean | null;
    preferredUrl: string | null;
    fallbackUrl: string | null;
    metadata: any;
  }> {
    console.log(`[AUDIO UTILS] Getting audio status for exercise:`, {
      id: exercise.id,
      audio_generation_status: exercise.audio_generation_status,
      has_audio_url: !!exercise.audio_url,
      has_full_text_audio_url: !!exercise.full_text_audio_url
    });

    const preferredUrl = this.getPreferredAudioUrl(exercise);
    const fallbackUrl = exercise.audio_url !== preferredUrl ? exercise.audio_url : null;
    
    if (!preferredUrl) {
      return {
        hasAudio: false,
        isAccessible: null,
        preferredUrl: null,
        fallbackUrl: null,
        metadata: this.getAudioMetadata('')
      };
    }

    // Check accessibility of preferred URL
    const isAccessible = await this.validateAudioAccessibility(preferredUrl, false);
    
    return {
      hasAudio: true,
      isAccessible,
      preferredUrl,
      fallbackUrl,
      metadata: this.getAudioMetadata(preferredUrl)
    };
  }

  // Enhanced audio regeneration check
  static shouldRegenerateAudio(exercise: any): boolean {
    const status = exercise.audio_generation_status;
    const hasUrls = exercise.audio_url || exercise.full_text_audio_url;
    
    // Need regeneration if:
    // 1. Status is failed
    // 2. Status is completed but no URLs exist
    // 3. Status is pending for too long (could add timestamp check)
    return status === 'failed' || (status === 'completed' && !hasUrls);
  }
}
