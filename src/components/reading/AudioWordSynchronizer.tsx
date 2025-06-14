
import React, { useRef, useEffect, useState } from 'react';

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
  index: number;
}

interface AudioWordSynchronizerProps {
  audioUrl?: string;
  text: string;
  onWordHighlight: (wordIndex: number) => void;
  onTimeUpdate: (currentTime: number) => void;
  isPlaying: boolean;
  playbackRate: number;
  onLoadedMetadata: (duration: number) => void;
  onEnded: () => void;
  children: (audioRef: React.RefObject<HTMLAudioElement>) => React.ReactNode;
}

export const AudioWordSynchronizer: React.FC<AudioWordSynchronizerProps> = ({
  audioUrl,
  text,
  onWordHighlight,
  onTimeUpdate,
  isPlaying,
  playbackRate,
  onLoadedMetadata,
  onEnded,
  children
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [wordTimings, setWordTimings] = useState<WordTiming[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);

  // Generate estimated word timings based on audio duration and text
  const generateWordTimings = (duration: number, text: string): WordTiming[] => {
    const words = text.split(/\s+/);
    const totalDuration = duration;
    
    // Estimate timing based on word length and reading speed
    let currentTime = 0;
    const timings: WordTiming[] = [];
    
    // Average speaking rate: ~150 words per minute = 2.5 words per second
    const avgWordsPerSecond = 2.5;
    const timePerWord = 1 / avgWordsPerSecond;
    
    words.forEach((word, index) => {
      // Adjust timing based on word length (longer words take more time)
      const wordDuration = Math.max(0.2, timePerWord * (word.length / 5));
      
      timings.push({
        word,
        startTime: currentTime,
        endTime: currentTime + wordDuration,
        index
      });
      
      currentTime += wordDuration;
    });
    
    // Scale timings to fit actual audio duration
    const estimatedDuration = currentTime;
    const scaleFactor = totalDuration / estimatedDuration;
    
    return timings.map(timing => ({
      ...timing,
      startTime: timing.startTime * scaleFactor,
      endTime: timing.endTime * scaleFactor
    }));
  };

  // Update word highlighting based on current time
  useEffect(() => {
    if (!wordTimings.length || !audioRef.current) return;

    const updateWordHighlight = () => {
      const currentTime = audioRef.current?.currentTime || 0;
      onTimeUpdate(currentTime);

      // Find the current word based on timing
      const activeWordIndex = wordTimings.findIndex(
        timing => currentTime >= timing.startTime && currentTime < timing.endTime
      );

      if (activeWordIndex !== currentWordIndex) {
        setCurrentWordIndex(activeWordIndex);
        onWordHighlight(activeWordIndex);
      }
    };

    const audio = audioRef.current;
    audio.addEventListener('timeupdate', updateWordHighlight);

    return () => {
      audio.removeEventListener('timeupdate', updateWordHighlight);
    };
  }, [wordTimings, currentWordIndex, onWordHighlight, onTimeUpdate]);

  // Handle audio metadata loading
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      const duration = audio.duration;
      onLoadedMetadata(duration);
      
      // Generate word timings when audio is loaded
      const timings = generateWordTimings(duration, text);
      setWordTimings(timings);
    };

    const handleEnded = () => {
      setCurrentWordIndex(-1);
      onWordHighlight(-1);
      onEnded();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [text, onLoadedMetadata, onEnded, onWordHighlight]);

  // Update playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Update audio source
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }
  }, [audioUrl]);

  return (
    <>
      {children(audioRef)}
      <audio ref={audioRef} preload="metadata" />
    </>
  );
};
