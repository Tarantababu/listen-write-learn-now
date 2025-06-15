
import { useState, useCallback, useRef } from 'react';
import { enhancedAudioService, AudioGenerationProgress, AudioGenerationResult } from '@/services/enhancedAudioService';

export interface EnhancedAudioState extends AudioGenerationProgress {
  error?: string;
  results?: Map<string, AudioGenerationResult>;
  canCancel: boolean;
}

export const useEnhancedAudioProgress = () => {
  const [state, setState] = useState<EnhancedAudioState>({
    isGenerating: false,
    progress: 0,
    stage: 'initializing',
    estimatedTimeRemaining: 0,
    canCancel: false
  });

  const timeoutRef = useRef<NodeJS.Timeout>();

  const updateProgress = useCallback((progress: AudioGenerationProgress) => {
    setState(prev => ({
      ...prev,
      ...progress,
      canCancel: progress.isGenerating && progress.stage !== 'complete'
    }));
  }, []);

  const startProgress = useCallback((estimatedTime?: number) => {
    enhancedAudioService.setProgressCallback(updateProgress);
    
    setState({
      isGenerating: true,
      progress: 0,
      stage: 'initializing',
      estimatedTimeRemaining: estimatedTime || 30,
      canCancel: true,
      error: undefined
    });

    // Auto-complete after a reasonable timeout if something goes wrong
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        stage: 'complete',
        progress: 100,
        error: 'Audio generation timed out, but may continue in background'
      }));
    }, (estimatedTime || 30) * 2000); // 2x the estimated time
  }, [updateProgress]);

  const completeProgress = useCallback((results?: Map<string, AudioGenerationResult>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setState(prev => ({
      ...prev,
      isGenerating: false,
      stage: 'complete',
      progress: 100,
      canCancel: false,
      results
    }));
  }, []);

  const setError = useCallback((error: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setState(prev => ({
      ...prev,
      isGenerating: false,
      error,
      canCancel: false
    }));
  }, []);

  const cancelProgress = useCallback(() => {
    enhancedAudioService.abort();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setState(prev => ({
      ...prev,
      isGenerating: false,
      stage: 'initializing',
      progress: 0,
      canCancel: false,
      error: 'Audio generation cancelled'
    }));
  }, []);

  const resetProgress = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setState({
      isGenerating: false,
      progress: 0,
      stage: 'initializing',
      estimatedTimeRemaining: 0,
      canCancel: false,
      error: undefined,
      results: undefined
    });
  }, []);

  return {
    ...state,
    startProgress,
    completeProgress,
    setError,
    cancelProgress,
    resetProgress
  };
};
