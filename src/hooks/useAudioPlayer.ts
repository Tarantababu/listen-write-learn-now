
import { useState, useRef, useCallback } from 'react';
import { readingExerciseService } from '@/services/readingExerciseService';
import { audioCache } from '@/services/audioCache';
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
      
      // First, try to get cached audio
      let audioUrl = audioCache.getCachedAudio(text, language);
      
      if (!audioUrl) {
        // Generate new audio if not cached
        console.log('Generating new audio for text:', text.substring(0, 50) + '...');
        audioUrl = await readingExerciseService.generateAudio(text, language);
        
        // Cache the newly generated audio
        audioCache.cacheAudio(text, language, audioUrl);
        console.log('Audio cached for future use');
      } else {
        console.log('Using cached audio for text:', text.substring(0, 50) + '...');
      }
      
      // Create new audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Set up event listeners
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
      });
      
      audio.addEventListener('error', (error) => {
        console.error('Audio playback error:', error);
        setIsPlaying(false);
        toast.error('Audio playback failed');
      });
      
      // Play the audio
      await audio.play();
      setIsPlaying(true);
      
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error('Failed to play audio');
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
