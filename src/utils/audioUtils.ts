
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
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced timeout
      
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
    // Priority: full_text_audio_url > audio_url
    const candidates = [
      exercise.full_text_audio_url,
      exercise.audio_url
    ];

    for (const url of candidates) {
      if (this.isValidAudioUrl(url)) {
        return url;
      }
    }

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
        }, 10000);
        
        const onLoad = () => {
          clearTimeout(timeout);
          audio.removeEventListener('error', onError);
          resolve(audio);
        };
        
        const onError = () => {
          clearTimeout(timeout);
          audio.removeEventListener('canplaythrough', onLoad);
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
    // Rough estimate: ~150 words per minute, ~5 chars per word
    const wordsPerMinute = 150;
    const charsPerWord = 5;
    const words = textLength / charsPerWord;
    return Math.max(1, (words / wordsPerMinute) * 60);
  }
}
