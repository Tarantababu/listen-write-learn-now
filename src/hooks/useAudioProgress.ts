
import { useState, useCallback, useRef } from 'react';

interface AudioProgressState {
  isGenerating: boolean;
  progress: number;
  estimatedTimeRemaining: number;
  stage: 'initializing' | 'processing' | 'uploading' | 'finalizing' | 'complete';
}

export const useAudioProgress = () => {
  const [state, setState] = useState<AudioProgressState>({
    isGenerating: false,
    progress: 0,
    estimatedTimeRemaining: 0,
    stage: 'initializing'
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startProgress = useCallback(() => {
    startTimeRef.current = Date.now();
    setState({
      isGenerating: true,
      progress: 0,
      estimatedTimeRemaining: 15, // Initial estimate: 15 seconds
      stage: 'initializing'
    });

    // Simulate realistic progress with different stages
    let currentProgress = 0;
    intervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 3 + 1; // Variable progress speed
      
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      let stage: AudioProgressState['stage'] = 'initializing';
      let estimatedTotal = 15;

      // Determine stage and adjust estimates based on progress
      if (currentProgress < 20) {
        stage = 'initializing';
        estimatedTotal = 15;
      } else if (currentProgress < 70) {
        stage = 'processing';
        estimatedTotal = 12;
      } else if (currentProgress < 90) {
        stage = 'uploading';
        estimatedTotal = 10;
      } else if (currentProgress < 100) {
        stage = 'finalizing';
        estimatedTotal = 8;
      }

      const estimatedTimeRemaining = Math.max(0, estimatedTotal - elapsed);
      
      setState(prev => ({
        ...prev,
        progress: Math.min(95, currentProgress), // Cap at 95% until complete
        estimatedTimeRemaining,
        stage
      }));

      // Don't complete automatically - wait for manual completion
      if (currentProgress >= 100) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 200); // Update every 200ms for smooth animation
  }, []);

  const completeProgress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setState(prev => ({
      ...prev,
      progress: 100,
      estimatedTimeRemaining: 0,
      stage: 'complete'
    }));

    // Auto-reset after completion
    setTimeout(() => {
      setState({
        isGenerating: false,
        progress: 0,
        estimatedTimeRemaining: 0,
        stage: 'initializing'
      });
    }, 1000);
  }, []);

  const resetProgress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setState({
      isGenerating: false,
      progress: 0,
      estimatedTimeRemaining: 0,
      stage: 'initializing'
    });
  }, []);

  return {
    ...state,
    startProgress,
    completeProgress,
    resetProgress
  };
};
