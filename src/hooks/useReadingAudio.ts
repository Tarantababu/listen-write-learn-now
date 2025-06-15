
import { useState, useEffect, useCallback } from 'react';
import { ReadingExercise } from '@/types/reading';
import { AudioUtils } from '@/utils/audioUtils';
import { enhancedAudioService } from '@/services/enhancedAudioService';

interface UseReadingAudioOptions {
  exercise: ReadingExercise | null;
  enabled?: boolean;
  autoRetry?: boolean;
  onAudioReady?: (audioUrl: string) => void;
  onAudioError?: (error: string) => void;
}

interface UseReadingAudioReturn {
  audioUrl: string;
  isInitialized: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  currentPosition: number;
  duration: number;
  hasAudioIssue: boolean;
  isRetrying: boolean;
  accessibilityUncertain: boolean;
  audioStatus: 'loading' | 'ready' | 'error' | 'missing' | 'regenerating';
  setIsPlaying: (playing: boolean) => void;
  setCurrentPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  retryAudioGeneration: () => Promise<void>;
  refreshAudioStatus: () => Promise<void>;
}

export const useReadingAudio = ({
  exercise,
  enabled = true,
  autoRetry = false,
  onAudioReady,
  onAudioError
}: UseReadingAudioOptions): UseReadingAudioReturn => {
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasAudioIssue, setHasAudioIssue] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [accessibilityUncertain, setAccessibilityUncertain] = useState(false);
  const [audioStatus, setAudioStatus] = useState<'loading' | 'ready' | 'error' | 'missing' | 'regenerating'>('loading');

  const retryAudioGeneration = useCallback(async () => {
    if (!exercise) return;
    
    console.log('[READING AUDIO] Manual retry triggered for exercise:', exercise.id);
    setIsRetrying(true);
    setAudioStatus('regenerating');
    setHasAudioIssue(false);
    setAccessibilityUncertain(false);
    
    try {
      const success = await enhancedAudioService.validateAndFixExerciseAudio(exercise.id);
      
      if (success) {
        console.log('[READING AUDIO] Retry successful, reinitializing...');
        // Trigger reinitialization
        setIsInitialized(false);
        setAudioUrl('');
        setAudioStatus('loading');
      } else {
        console.error('[READING AUDIO] Retry failed');
        setHasAudioIssue(true);
        setAudioStatus('error');
        onAudioError?.('Failed to regenerate audio');
      }
    } catch (error) {
      console.error('[READING AUDIO] Retry error:', error);
      setHasAudioIssue(true);
      setAudioStatus('error');
      onAudioError?.(error instanceof Error ? error.message : 'Unknown error during audio retry');
    } finally {
      setIsRetrying(false);
    }
  }, [exercise, onAudioError]);

  const refreshAudioStatus = useCallback(async () => {
    if (!exercise) return;
    
    console.log('[READING AUDIO] Refreshing audio status for exercise:', exercise.id);
    setIsLoading(true);
    
    try {
      const status = await AudioUtils.getAudioStatus(exercise);
      
      if (status.hasAudio && status.isAccessible) {
        setAudioUrl(status.preferredUrl!);
        setAudioStatus('ready');
        setHasAudioIssue(false);
        setAccessibilityUncertain(false);
        onAudioReady?.(status.preferredUrl!);
      } else if (status.hasAudio && status.isAccessible === false) {
        // Try fallback URL if available
        if (status.fallbackUrl) {
          const fallbackAccessible = await AudioUtils.validateAudioAccessibility(status.fallbackUrl);
          if (fallbackAccessible) {
            setAudioUrl(status.fallbackUrl);
            setAudioStatus('ready');
            setHasAudioIssue(false);
            setAccessibilityUncertain(true);
            onAudioReady?.(status.fallbackUrl);
          } else {
            setAudioStatus('error');
            setHasAudioIssue(true);
            onAudioError?.('Audio files are not accessible');
          }
        } else {
          setAudioStatus('error');
          setHasAudioIssue(true);
          onAudioError?.('Audio file is not accessible');
        }
      } else {
        setAudioStatus('missing');
        setHasAudioIssue(true);
        onAudioError?.('No audio available for this exercise');
      }
    } catch (error) {
      console.error('[READING AUDIO] Error refreshing audio status:', error);
      setAudioStatus('error');
      setHasAudioIssue(true);
      onAudioError?.(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [exercise, onAudioReady, onAudioError]);

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
      setIsLoading(false);
      setHasAudioIssue(false);
      setAccessibilityUncertain(false);
      setAudioStatus('loading');
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
      
      setIsLoading(true);
      setAudioStatus('loading');
      
      try {
        // Check if audio regeneration is needed
        if (AudioUtils.shouldRegenerateAudio(exercise)) {
          console.warn('[READING AUDIO] Exercise needs audio regeneration');
          setHasAudioIssue(true);
          setAudioStatus('missing');
          
          if (autoRetry) {
            console.log('[READING AUDIO] Auto-retry enabled, attempting to fix...');
            await retryAudioGeneration();
            return;
          } else {
            console.log('[READING AUDIO] Auto-retry disabled, marking as issue');
            setIsInitialized(true);
            setIsLoading(false);
            onAudioError?.('Audio generation is needed for this exercise');
            return;
          }
        }
        
        // Get comprehensive audio status
        const status = await AudioUtils.getAudioStatus(exercise);
        
        console.log('[READING AUDIO] Audio status result:', status);
        
        if (status.hasAudio && status.isAccessible) {
          console.log('[READING AUDIO] Audio is ready and accessible');
          setAudioUrl(status.preferredUrl!);
          setHasAudioIssue(false);
          setAccessibilityUncertain(false);
          setAudioStatus('ready');
          onAudioReady?.(status.preferredUrl!);
        } else if (status.hasAudio && status.isAccessible === false) {
          console.warn('[READING AUDIO] Audio URL failed accessibility check, trying fallback mode');
          // Try fallback mode (skip accessibility check for network issues)
          const isValidFormat = await AudioUtils.validateAudioAccessibility(status.preferredUrl!, true);
          
          if (isValidFormat) {
            console.log('[READING AUDIO] Using fallback mode - assuming audio is accessible');
            setAudioUrl(status.preferredUrl!);
            setHasAudioIssue(false);
            setAccessibilityUncertain(true);
            setAudioStatus('ready');
            onAudioReady?.(status.preferredUrl!);
          } else {
            console.error('[READING AUDIO] Audio URL format is invalid');
            setAudioUrl('');
            setHasAudioIssue(true);
            setAccessibilityUncertain(false);
            setAudioStatus('error');
            onAudioError?.('Audio format is invalid');
          }
        } else {
          console.warn('[READING AUDIO] No audio URL found for exercise');
          setAudioUrl('');
          setAccessibilityUncertain(false);
          setAudioStatus('missing');
          
          // Only mark as issue if it should have audio (status completed)
          if (exercise.audio_generation_status === 'completed') {
            setHasAudioIssue(true);
            onAudioError?.('Audio should be available but was not found');
          } else {
            setHasAudioIssue(false);
            onAudioError?.('Audio is being generated');
          }
        }
        
        setIsInitialized(true);
        
        console.log('[READING AUDIO] Initialization complete:', {
          audioUrl: status.preferredUrl || '',
          hasAudioIssue: !status.hasAudio && exercise.audio_generation_status === 'completed',
          accessibilityUncertain,
          isInitialized: true,
          audioStatus
        });
        
      } catch (error) {
        console.error('[READING AUDIO] Initialization failed:', error);
        setAudioUrl('');
        setHasAudioIssue(true);
        setAccessibilityUncertain(false);
        setIsInitialized(true);
        setAudioStatus('error');
        onAudioError?.(error instanceof Error ? error.message : 'Audio initialization failed');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAudio();
  }, [
    exercise?.id, 
    exercise?.audio_url, 
    exercise?.full_text_audio_url, 
    exercise?.audio_generation_status, 
    enabled, 
    autoRetry,
    onAudioReady,
    onAudioError,
    retryAudioGeneration
  ]);

  console.log('[READING AUDIO] Current hook state:', {
    audioUrl: !!audioUrl,
    audioUrlValue: audioUrl,
    isInitialized,
    isLoading,
    hasAudioIssue,
    accessibilityUncertain,
    isRetrying,
    audioStatus,
    exercise_id: exercise?.id
  });

  return {
    audioUrl,
    isInitialized,
    isLoading,
    isPlaying,
    currentPosition,
    duration,
    hasAudioIssue,
    isRetrying,
    accessibilityUncertain,
    audioStatus,
    setIsPlaying,
    setCurrentPosition,
    setDuration,
    retryAudioGeneration,
    refreshAudioStatus
  };
};
