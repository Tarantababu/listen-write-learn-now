
import { useState, useCallback } from 'react';
import { norwegianAudioService } from '@/services/norwegianAudioService';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { toast } from 'sonner';

interface UseNorwegianAudioOptions {
  enableQualityEnhancement?: boolean;
  enableCaching?: boolean;
  fallbackToOriginal?: boolean;
}

export const useNorwegianAudio = (options: UseNorwegianAudioOptions = {}) => {
  const { settings } = useUserSettingsContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    enableQualityEnhancement = true,
    enableCaching = true,
    fallbackToOriginal = true
  } = options;

  const playNorwegianAudio = useCallback(async (text: string) => {
    // Only use Norwegian enhancement for Norwegian language
    if (settings.selectedLanguage !== 'norwegian') {
      return null; // Let the original system handle non-Norwegian audio
    }

    if (!text || text.trim().length === 0) {
      setError('No text provided for audio generation');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[Norwegian Audio Hook] Starting enhanced audio generation');

      // Check cache first if enabled
      let audioUrl: string | null = null;
      
      if (enableCaching) {
        audioUrl = await norwegianAudioService.getCachedNorwegianAudio(text);
      }

      // Generate new audio if not cached
      if (!audioUrl) {
        audioUrl = await norwegianAudioService.generateNorwegianAudio({
          text,
          enableQualityEnhancement
        });

        // Cache the result if enabled
        if (enableCaching && audioUrl) {
          await norwegianAudioService.cacheNorwegianAudio(text, audioUrl);
        }
      }

      if (audioUrl) {
        // Play the audio
        const audio = new Audio(audioUrl);
        
        // Add error handling for audio playback
        audio.addEventListener('error', (e) => {
          console.error('[Norwegian Audio] Playback error:', e);
          setError('Audio playback failed');
        });

        audio.addEventListener('loadstart', () => {
          console.log('[Norwegian Audio] Audio loading started');
        });

        audio.addEventListener('canplay', () => {
          console.log('[Norwegian Audio] Audio ready to play');
        });

        await audio.play();
        
        console.log('[Norwegian Audio Hook] Audio played successfully');
        return audioUrl;
      }

      throw new Error('No audio URL generated');

    } catch (error) {
      console.error('[Norwegian Audio Hook] Generation failed:', error);
      setError(error instanceof Error ? error.message : 'Audio generation failed');
      
      // Show user-friendly error message
      toast.error('Norwegian audio generation failed');
      
      // Return null to indicate fallback should be used
      return null;
      
    } finally {
      setIsLoading(false);
    }
  }, [settings.selectedLanguage, enableQualityEnhancement, enableCaching]);

  const generateNorwegianAudioUrl = useCallback(async (text: string): Promise<string | null> => {
    // Only use Norwegian enhancement for Norwegian language
    if (settings.selectedLanguage !== 'norwegian') {
      return null; // Let the original system handle non-Norwegian audio
    }

    if (!text || text.trim().length === 0) {
      setError('No text provided for audio generation');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[Norwegian Audio Hook] Generating audio URL');

      // Check cache first if enabled
      let audioUrl: string | null = null;
      
      if (enableCaching) {
        audioUrl = await norwegianAudioService.getCachedNorwegianAudio(text);
      }

      // Generate new audio if not cached
      if (!audioUrl) {
        audioUrl = await norwegianAudioService.generateNorwegianAudio({
          text,
          enableQualityEnhancement
        });

        // Cache the result if enabled
        if (enableCaching && audioUrl) {
          await norwegianAudioService.cacheNorwegianAudio(text, audioUrl);
        }
      }

      console.log('[Norwegian Audio Hook] Audio URL generated successfully');
      return audioUrl;

    } catch (error) {
      console.error('[Norwegian Audio Hook] URL generation failed:', error);
      setError(error instanceof Error ? error.message : 'Audio generation failed');
      
      // Return null to indicate fallback should be used
      return null;
      
    } finally {
      setIsLoading(false);
    }
  }, [settings.selectedLanguage, enableQualityEnhancement, enableCaching]);

  return {
    playNorwegianAudio,
    generateNorwegianAudioUrl,
    isLoading,
    error,
    isNorwegianLanguage: settings.selectedLanguage === 'norwegian'
  };
};
