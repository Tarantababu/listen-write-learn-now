
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';

interface ClozeAudioPlayerProps {
  text: string;
  language: string;
  className?: string;
}

export const ClozeAudioPlayer: React.FC<ClozeAudioPlayerProps> = ({
  text,
  language,
  className = ""
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { settings } = useUserSettingsContext();

  const playAudio = async () => {
    if (isPlaying || isLoading) return;

    try {
      setIsLoading(true);
      
      // Generate audio using the text-to-speech function
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text,
          language: language.toLowerCase(),
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true
          }
        }
      });

      if (error) {
        console.error('Error generating audio:', error);
        return;
      }

      if (data?.audio_url) {
        const audio = new Audio(data.audio_url);
        setIsPlaying(true);
        
        audio.onended = () => {
          setIsPlaying(false);
        };
        
        audio.onerror = () => {
          setIsPlaying(false);
          console.error('Audio playback error');
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={playAudio}
      disabled={isLoading || isPlaying}
      className={`flex items-center gap-2 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPlaying ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
      {isLoading ? 'Loading...' : isPlaying ? 'Playing...' : 'Listen'}
    </Button>
  );
};
