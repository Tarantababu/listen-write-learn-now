
import { useState, useEffect } from 'react';
import { ReadingExercise } from '@/types/reading';
import { AudioUtils } from '@/utils/audioUtils';
import { enhancedAudioService } from '@/services/enhancedAudioService';

interface UseReadingAudioOptions {
  exercise: ReadingExercise | null;
  enabled?: boolean;
  autoRetry?: boolean;
}

interface UseReadingAudioReturn {
  audioUrl: string;
  isInitialized: boolean;
  isPlaying: boolean;
  currentPosition: number;
  duration: number;
  hasAudioIssue: boolean;
  isRetrying: boolean;
  setIsPlaying: (playing: boolean) => void;
  setCurrentPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  retryAudioGeneration: () => Promise<void>;
}

export const useReadingAudio = ({
  exercise,
  enabled = true,
  autoRetry = false
}: UseReadingAudioOptions): UseReadingAudioReturn => {
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasAudioIssue, setHasAudioIssue] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const retryAudioGeneration = async () => {
    if (!exercise) return;
    
    console.log('[READING AUDIO] Manual retry triggered for exercise:', exercise.id);
    setIsRetrying(true);
    setHasAudioIssue(false);
    
    try {
      const success = await enhancedAudioService.validateAndFixExerciseAudio(exercise.id);
      
      if (success) {
        console.log('[READING AUDIO] Retry successful, reinitializing...');
        // Trigger reinitialization
        setIsInitialized(false);
        setAudioUrl('');
      } else {
        console.error('[READING AUDIO] Retry failed');
        setHasAudioIssue(true);
      }
    } catch (error) {
      console.error('[READING AUDIO] Retry error:', error);
      setHasAudioIssue(true);
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    if (!exercise || !enabled) {
      console.log('[READING AUDIO] Clearing state - no exercise or disabled');
      setAudioUrl('');
      setIsInitialized(false);
      setHasAudioIssue(false);
      return;
    }

    const initializeAudio = async () => {
      console.log('[READING AUDIO] Initializing for exercise:', {
        id: exercise.id,
        title: exercise.title,
        language: exercise.language,
        audio_status: exercise.audio_generation_status,
        has_audio_url: !!exercise.audio_url,
        has_full_text_audio_url: !!exercise.full_text_audio_url
      });
      
      try {
        // Check if this is a problematic case: marked as completed but no URLs
        if (exercise.audio_generation_status === 'completed' && 
            !exercise.audio_url && 
            !exercise.full_text_audio_url) {
          
          console.warn('[READING AUDIO] Exercise marked as completed but no audio URLs found');
          setHasAudioIssue(true);
          
          if (autoRetry) {
            console.log('[READING AUDIO] Auto-retry enabled, attempting to fix...');
            await retryAudioGeneration();
            return;
          } else {
            console.log('[READING AUDIO] Auto-retry disabled, marking as issue');
            setIsInitialized(true);
            return;
          }
        }
        
        // Get the preferred audio URL
        const preferredAudioUrl = AudioUtils.getPreferredAudioUrl(exercise);
        
        if (preferredAudioUrl) {
          console.log('[READING AUDIO] Found audio URL:', preferredAudioUrl);
          
          // Validate accessibility
          const isAccessible = await AudioUtils.validateAudioAccessibility(preferredAudioUrl);
          
          if (isAccessible) {
            console.log('[READING AUDIO] Audio URL is valid and accessible');
            setAudioUrl(preferredAudioUrl);
            setHasAudioIssue(false);
          } else {
            console.warn('[READING AUDIO] Audio URL is not accessible');
            setAudioUrl('');
            setHasAudioIssue(true);
          }
        } else {
          console.warn('[READING AUDIO] No audio URL found for exercise');
          setAudioUrl('');
          
          // Only mark as issue if it should have audio (status completed)
          if (exercise.audio_generation_status === 'completed') {
            setHasAudioIssue(true);
          }
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('[READING AUDIO] Initialization failed:', error);
        setAudioUrl('');
        setHasAudioIssue(true);
        setIsInitialized(true);
      }
    };

    initializeAudio();
  }, [exercise?.id, enabled, autoRetry]);

  return {
    audioUrl,
    isInitialized,
    isPlaying,
    currentPosition,
    duration,
    hasAudioIssue,
    isRetrying,
    setIsPlaying,
    setCurrentPosition,
    setDuration,
    retryAudioGeneration
  };
};
