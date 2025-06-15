
import { useState, useCallback, useEffect } from 'react';

export type ReadingViewMode = 'normal' | 'expanded' | 'fullscreen';

export const useFullScreenReading = (initialMode: ReadingViewMode = 'normal') => {
  const [viewMode, setViewMode] = useState<ReadingViewMode>(initialMode);

  const cycleViewMode = useCallback(() => {
    setViewMode(current => {
      switch (current) {
        case 'normal': return 'expanded';
        case 'expanded': return 'fullscreen';
        case 'fullscreen': return 'normal';
        default: return 'normal';
      }
    });
  }, []);

  const setSpecificMode = useCallback((mode: ReadingViewMode) => {
    setViewMode(mode);
  }, []);

  // Handle escape key for full-screen mode
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && viewMode === 'fullscreen') {
        setViewMode('expanded');
      }
    };

    if (viewMode === 'fullscreen') {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [viewMode]);

  return {
    viewMode,
    cycleViewMode,
    setSpecificMode,
    isNormal: viewMode === 'normal',
    isExpanded: viewMode === 'expanded',
    isFullScreen: viewMode === 'fullscreen'
  };
};
