
import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  textSelectionTime: number;
  audioLoadTime: number;
  wordSyncAccuracy: number;
  userInteractions: number;
  sessionDuration: number;
}

export const useReadingPerformance = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    textSelectionTime: 0,
    audioLoadTime: 0,
    wordSyncAccuracy: 0,
    userInteractions: 0,
    sessionDuration: 0
  });

  const sessionStartRef = useRef<number>(Date.now());
  const lastSelectionRef = useRef<number>(0);

  const trackTextSelection = () => {
    const now = Date.now();
    const selectionTime = lastSelectionRef.current ? now - lastSelectionRef.current : 0;
    lastSelectionRef.current = now;

    setMetrics(prev => ({
      ...prev,
      textSelectionTime: selectionTime,
      userInteractions: prev.userInteractions + 1
    }));
  };

  const trackAudioLoad = (loadTime: number) => {
    setMetrics(prev => ({
      ...prev,
      audioLoadTime: loadTime
    }));
  };

  const trackWordSyncAccuracy = (accuracy: number) => {
    setMetrics(prev => ({
      ...prev,
      wordSyncAccuracy: accuracy
    }));
  };

  // Update session duration every second
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        sessionDuration: Date.now() - sessionStartRef.current
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getPerformanceReport = () => {
    const { textSelectionTime, audioLoadTime, wordSyncAccuracy, userInteractions, sessionDuration } = metrics;
    
    return {
      avgSelectionTime: textSelectionTime,
      audioPerformance: audioLoadTime < 2000 ? 'Good' : audioLoadTime < 5000 ? 'Fair' : 'Poor',
      syncQuality: wordSyncAccuracy > 0.9 ? 'Excellent' : wordSyncAccuracy > 0.7 ? 'Good' : 'Needs Improvement',
      engagementLevel: userInteractions / (sessionDuration / 60000), // interactions per minute
      sessionLength: Math.round(sessionDuration / 1000), // seconds
    };
  };

  return {
    metrics,
    trackTextSelection,
    trackAudioLoad,
    trackWordSyncAccuracy,
    getPerformanceReport
  };
};
