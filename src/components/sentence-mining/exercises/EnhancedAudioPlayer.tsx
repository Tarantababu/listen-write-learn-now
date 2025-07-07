
import React from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Loader2 } from 'lucide-react';
import { useNorwegianAudio } from '@/hooks/useNorwegianAudio';
import { supabase } from '@/integrations/supabase/client';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { toast } from 'sonner';

interface EnhancedAudioPlayerProps {
  text: string;
  onPlayAudio?: () => void;
  audioLoading?: boolean;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export const EnhancedAudioPlayer: React.FC<EnhancedAudioPlayerProps> = ({
  text,
  onPlayAudio,
  audioLoading = false,
  className = '',
  size = 'default',
  variant = 'outline'
}) => {
  const { settings } = useUserSettingsContext();
  const {
    playNorwegianAudio,
    isLoading: norwegianLoading,
    error: norwegianError,
    isNorwegianLanguage
  } = useNorwegianAudio({
    enableQualityEnhancement: true,
    enableCaching: true,
    fallbackToOriginal: true
  });

  const handlePlayAudio = async () => {
    if (!text || text.trim().length === 0) {
      toast.error('No text available for audio');
      return;
    }

    try {
      // Try Norwegian enhancement first if language is Norwegian
      if (isNorwegianLanguage) {
        console.log('[Enhanced Audio Player] Attempting Norwegian audio generation');
        
        const norwegianResult = await playNorwegianAudio(text);
        
        if (norwegianResult) {
          console.log('[Enhanced Audio Player] Norwegian audio played successfully');
          return; // Success - no need to fallback
        }
        
        console.log('[Enhanced Audio Player] Norwegian audio failed, falling back to original system');
      }

      // Fallback to original audio system
      if (onPlayAudio) {
        onPlayAudio();
      } else {
        // Default fallback implementation
        const { data, error } = await supabase.functions.invoke('text-to-speech', {
          body: {
            text,
            language: settings.selectedLanguage
          }
        });

        if (error) throw error;

        if (data?.audio_url || data?.audioUrl) {
          const audio = new Audio(data.audio_url || data.audioUrl);
          await audio.play();
        } else {
          throw new Error('No audio URL received');
        }
      }

    } catch (error) {
      console.error('[Enhanced Audio Player] All audio generation failed:', error);
      toast.error('Audio playback failed');
    }
  };

  const isLoading = audioLoading || norwegianLoading;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePlayAudio}
      disabled={isLoading}
      className={`flex items-center gap-2 transition-transform duration-200 hover:scale-105 active:scale-95 ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {size !== 'sm' && (isNorwegianLanguage ? 'Generating...' : 'Loading...')}
        </>
      ) : (
        <>
          <Volume2 className="h-4 w-4" />
          {size !== 'sm' && (isNorwegianLanguage ? 'Listen (Enhanced)' : 'Listen')}
        </>
      )}
    </Button>
  );
};
