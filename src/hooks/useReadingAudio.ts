
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
  accessibilityUncertain: boolean;
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
  const [accessibilityUncertain, setAccessibilityUncertain] = useState(false);

  const retryAudioGeneration = async () => {
    if (!exercise) return;
    
    console.log('[READING AUDIO] Manual retry triggered for exercise:', exercise.id);
    setIsRetrying(true);
    setHasAudioIssue(false);
    setAccessibilityUncertain(false);
    
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
    console.log('[READING AUDIO] useEffect triggered with:', {
      exercise_id: exercise?.id,
      exercise_title: exercise?.title,
      enabled,
      exercise_audio_url: exercise?.audio_url,
      exercise_full_text_audio_url: exercise?.full_text_audio_url,
      exercise_audio_status: exercise?.audio_generation_status
    });

    if (!exercise || !enabled) {
      console.log('[READING AUDIO] Clearing state - no exercise or disabled');
      setAudioUrl('');
      setIsInitialized(false);
      setHasAudioIssue(false);
      setAccessibilityUncertain(false);
      return;
    }

    const initializeAudio = async () => {
      console.log('[READING AUDIO] Initializing for exercise:', {
        id: exercise.id,
        title: exercise.title,
        language: exercise.language,
        audio_status: exercise.audio_generation_status,
        has_audio_url: !!exercise.audio_url,
        has_full_text_audio_url: !!exercise.full_text_audio_url,
        audio_url_value: exercise.audio_url,
        full_text_audio_url_value: exercise.full_text_audio_url
      });
      
      try {
        // Check if this is a problematic case: marked as completed but no URLs
        if (exercise.audio_generation_status === 'completed' && 
            !exercise.audio_url && 
            !exercise.full_text_audio_url) {
          
          console.warn('[READING AUDIO] Exercise marked as completed but no audio URLs found');
          setHasAudioIssue(true);
          setAccessibilityUncertain(false);
          
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
        
        console.log('[READING AUDIO] Preferred audio URL result:', preferredAudioUrl);
        
        if (preferredAudioUrl) {
          console.log('[READING AUDIO] Found audio URL:', preferredAudioUrl);
          
          // Try strict validation first
          let isAccessible = await AudioUtils.validateAudioAccessibility(preferredAudioUrl, false);
          
          if (isAccessible) {
            console.log('[READING AUDIO] Audio URL is accessible, setting audioUrl state');
            setAudioUrl(preferredAudioUrl);
            setHasAudioIssue(false);
            setAccessibilityUncertain(false);
          } else {
            console.warn('[READING AUDIO] Audio URL failed accessibility check, trying fallback mode');
            // Try fallback mode (skip accessibility check for network issues)
            const isValidFormat = await AudioUtils.validateAudioAccessibility(preferredAudioUrl, true);
            
            if (isValidFormat) {
              console.log('[READING AUDIO] Using fallback mode - assuming audio is accessible');
              setAudioUrl(preferredAudioUrl);
              setHasAudioIssue(false);
              setAccessibilityUncertain(true); // Mark as uncertain
            } else {
              console.error('[READING AUDIO] Audio URL format is invalid');
              setAudioUrl('');
              setHasAudioIssue(true);
              setAccessibilityUncertain(false);
            }
          }
        } else {
          console.warn('[READING AUDIO] No audio URL found for exercise');
          setAudioUrl('');
          setAccessibilityUncertain(false);
          
          // Only mark as issue if it should have audio (status completed)
          if (exercise.audio_generation_status === 'completed') {
            setHasAudioIssue(true);
          }
        }
        
        setIsInitialized(true);
        
        console.log('[READING AUDIO] Initialization complete:', {
          audioUrl: preferredAudioUrl || '',
          hasAudioIssue: !preferredAudioUrl && exercise.audio_generation_status === 'completed',
          accessibilityUncertain,
          isInitialized: true
        });
        
      } catch (error) {
        console.error('[READING AUDIO] Initialization failed:', error);
        setAudioUrl('');
        setHasAudioIssue(true);
        setAccessibilityUncertain(false);
        setIsInitialized(true);
      }
    };

    initializeAudio();
  }, [
    exercise?.id, 
    exercise?.audio_url, 
    exercise?.full_text_audio_url, 
    exercise?.audio_generation_status, 
    enabled, 
    autoRetry
  ]);

  console.log('[READING AUDIO] Current hook state:', {
    audioUrl: !!audioUrl,
    audioUrlValue: audioUrl,
    isInitialized,
    hasAudioIssue,
    accessibilityUncertain,
    isRetrying,
    exercise_id: exercise?.id
  });

  return {
    audioUrl,
    isInitialized,
    isPlaying,
    currentPosition,
    duration,
    hasAudioIssue,
    isRetrying,
    accessibilityUncertain,
    setIsPlaying,
    setCurrentPosition,
    setDuration,
    retryAudioGeneration
  };
};
