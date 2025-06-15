
import { useState, useCallback, useRef, useEffect } from 'react';
import { ReadingExercise } from '@/types/reading';
import { optimizedReadingService } from '@/services/optimizedReadingService';
import { AudioUtils } from '@/utils/audioUtils';
import { toast } from 'sonner';

interface UseOnDemandAudioOptions {
  exercise: ReadingExercise | null;
  autoGenerate?: boolean;
}

interface UseOnDemandAudioReturn {
  audioUrl: string;
  isLoading: boolean;
  isGenerating: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  hasAudio: boolean;
  canPlay: boolean;
  error: string | null;
  audioStatus: 'none' | 'pending' | 'generating' | 'ready' | 'error';
  generateAudio: () => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  seekTo: (time: number) => void;
  skipBackward: (seconds?: number) => void;
  skipForward: (seconds?: number) => void;
  restart: () => void;
  setPlaybackRate: (rate: number) => void;
}

export const useOnDemandAudio = ({
  exercise,
  autoGenerate = false
}: UseOnDemandAudioOptions): UseOnDemandAudioReturn => {
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioStatus, setAudioStatus] = useState<'none' | 'pending' | 'generating' | 'ready' | 'error'>('none');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
      });
      
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setError('Audio playback failed');
        setIsPlaying(false);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Check audio status when exercise changes
  useEffect(() => {
    if (!exercise) {
      setAudioStatus('none');
      setAudioUrl('');
      setError(null);
      return;
    }

    const checkAudioStatus = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const status = await AudioUtils.getAudioStatus(exercise);
        
        if (status.hasAudio && status.isAccessible && status.preferredUrl) {
          setAudioUrl(status.preferredUrl);
          setAudioStatus('ready');
          
          if (audioRef.current) {
            audioRef.current.src = status.preferredUrl;
          }
        } else if (exercise.audio_generation_status === 'generating') {
          setAudioStatus('generating');
          setIsGenerating(true);
        } else if (exercise.audio_generation_status === 'failed') {
          setAudioStatus('error');
          setError('Audio generation failed');
        } else {
          setAudioStatus('pending');
          
          if (autoGenerate) {
            generateAudio();
          }
        }
      } catch (err) {
        console.error('Error checking audio status:', err);
        setError(err instanceof Error ? err.message : 'Failed to check audio status');
        setAudioStatus('error');
      } finally {
        setIsLoading(false);
      }
    };

    checkAudioStatus();
  }, [exercise?.id, exercise?.audio_generation_status, exercise?.audio_url, exercise?.full_text_audio_url, autoGenerate]);

  // Update time during playback
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying]);

  const generateAudio = useCallback(async () => {
    if (!exercise?.id || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setAudioStatus('generating');
    
    try {
      toast.info('Generating audio for this exercise...');
      
      const success = await optimizedReadingService.generateAudioOnDemand(exercise.id);
      
      if (success) {
        // Refresh exercise data to get new audio URL
        const refreshedExercise = await optimizedReadingService.refreshExerciseFromDb(exercise.id);
        
        if (refreshedExercise.audio_url || refreshedExercise.full_text_audio_url) {
          const newAudioUrl = refreshedExercise.full_text_audio_url || refreshedExercise.audio_url;
          setAudioUrl(newAudioUrl!);
          setAudioStatus('ready');
          
          if (audioRef.current) {
            audioRef.current.src = newAudioUrl!;
          }
          
          toast.success('Audio generated successfully!');
        } else {
          throw new Error('Audio generation completed but no URL returned');
        }
      } else {
        throw new Error('Audio generation failed');
      }
    } catch (err) {
      console.error('Audio generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate audio';
      setError(errorMessage);
      setAudioStatus('error');
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [exercise?.id, isGenerating]);

  const play = useCallback(async () => {
    if (!audioRef.current || !audioUrl) return;

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setError(null);
    } catch (err) {
      console.error('Play error:', err);
      setError('Failed to play audio');
      setIsPlaying(false);
    }
  }, [audioUrl]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const skipBackward = useCallback((seconds: number = 10) => {
    if (audioRef.current) {
      const newTime = Math.max(0, audioRef.current.currentTime - seconds);
      seekTo(newTime);
    }
  }, [seekTo]);

  const skipForward = useCallback((seconds: number = 10) => {
    if (audioRef.current) {
      const newTime = Math.min(duration, audioRef.current.currentTime + seconds);
      seekTo(newTime);
    }
  }, [duration, seekTo]);

  const restart = useCallback(() => {
    seekTo(0);
  }, [seekTo]);

  const setPlaybackRate = useCallback((rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  const hasAudio = audioStatus === 'ready' && !!audioUrl;
  const canPlay = hasAudio && !isLoading && !isGenerating;

  return {
    audioUrl,
    isLoading,
    isGenerating,
    isPlaying,
    currentTime,
    duration,
    hasAudio,
    canPlay,
    error,
    audioStatus,
    generateAudio,
    play,
    pause,
    seekTo,
    skipBackward,
    skipForward,
    restart,
    setPlaybackRate
  };
};
