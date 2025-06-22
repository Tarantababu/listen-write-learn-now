
import { useState, useRef, useCallback } from 'react';
import { readingExerciseService } from '@/services/readingExerciseService';
import { toast } from 'sonner';

interface UseAudioPlayerReturn {
  isPlaying: boolean;
  isLoading: boolean;
  playText: (text: string, language: string) => Promise<void>;
  stopAudio: () => void;
}

export const useAudioPlayer = (): UseAudioPlayerReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const playText = useCallback(async (text: string, language: string) => {
    try {
      // Stop any currently playing audio
      stopAudio();
      
      setIsLoading(true);
      
      // Generate audio using the existing service
      const audioUrl = await readingExerciseService.generateAudio(text, language);
      
      // Create new audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Set up event listeners
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
      });
      
      audio.addEventListener('error', () => {
        setIsPlaying(false);
        toast.error('Audio playback failed');
      });
      
      // Play the audio
      await audio.play();
      setIsPlaying(true);
      
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error('Failed to generate audio');
    } finally {
      setIsLoading(false);
    }
  }, [stopAudio]);

  return {
    isPlaying,
    isLoading,
    playText,
    stopAudio
  };
};
