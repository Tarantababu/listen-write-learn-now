
import { useState, useEffect } from 'react';
import { ReadingExercise } from '@/types/reading';
import { AudioUtils } from '@/utils/audioUtils';

interface UseReadingAudioOptions {
  exercise: ReadingExercise | null;
  enabled?: boolean;
}

interface UseReadingAudioReturn {
  audioUrl: string;
  isInitialized: boolean;
  isPlaying: boolean;
  currentPosition: number;
  duration: number;
  setIsPlaying: (playing: boolean) => void;
  setCurrentPosition: (position: number) => void;
  setDuration: (duration: number) => void;
}

export const useReadingAudio = ({
  exercise,
  enabled = true
}: UseReadingAudioOptions): UseReadingAudioReturn => {
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!exercise || !enabled) {
      setAudioUrl('');
      setIsInitialized(false);
      return;
    }

    const initializeAudio = async () => {
      console.log('[READING AUDIO] Initializing for exercise:', exercise.id);
      
      try {
        // Simply get the preferred audio URL - no generation logic
        const preferredAudioUrl = AudioUtils.getPreferredAudioUrl(exercise);
        
        if (preferredAudioUrl) {
          console.log('[READING AUDIO] Found audio URL:', preferredAudioUrl);
          
          // Validate accessibility
          const isAccessible = await AudioUtils.validateAudioAccessibility(preferredAudioUrl);
          
          if (isAccessible) {
            console.log('[READING AUDIO] Audio URL is valid and accessible');
            setAudioUrl(preferredAudioUrl);
          } else {
            console.warn('[READING AUDIO] Audio URL is not accessible');
            setAudioUrl('');
          }
        } else {
          console.warn('[READING AUDIO] No audio URL found for exercise');
          setAudioUrl('');
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('[READING AUDIO] Initialization failed:', error);
        setAudioUrl('');
        setIsInitialized(true);
      }
    };

    initializeAudio();
  }, [exercise?.id, enabled]);

  return {
    audioUrl,
    isInitialized,
    isPlaying,
    currentPosition,
    duration,
    setIsPlaying,
    setCurrentPosition,
    setDuration
  };
};
