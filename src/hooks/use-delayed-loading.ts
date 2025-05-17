
import { useState, useEffect } from 'react';

/**
 * Hook that provides a debounced loading state to prevent UI flashing
 * @param isLoading The actual loading state
 * @param delay Delay in ms before showing the loading state (default: 300ms)
 * @returns A debounced loading state that only becomes true if loading lasts longer than the delay
 */
export function useDelayedLoading(isLoading: boolean, delay = 300): boolean {
  const [delayedLoading, setDelayedLoading] = useState(false);
  
  useEffect(() => {
    let timer: number;
    
    if (isLoading) {
      // Set a timer to show loading state only if it takes longer than the delay
      timer = window.setTimeout(() => {
        setDelayedLoading(true);
      }, delay);
    } else {
      // When loading completes, immediately hide the loading state
      setDelayedLoading(false);
    }
    
    // Clean up the timer if component unmounts or loading state changes
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isLoading, delay]);
  
  return delayedLoading;
}
