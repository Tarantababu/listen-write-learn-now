
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface AudioPlayerProps {
  audioUrl?: string;
  demoMode?: boolean;
  registerMethods?: (methods: { 
    play: () => void; 
    pause: () => void;
    replay: () => void;
  }) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioUrl, 
  demoMode = false,
  registerMethods
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = () => {
    if (!audioRef.current || hasError) return;
    audioRef.current.play().catch((error) => {
      console.error('Audio play error:', error);
      setHasError(true);
    });
    setIsPlaying(true);
  };

  const pause = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const replay = () => {
    if (!audioRef.current || hasError) return;
    
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch((error) => {
      console.error('Audio replay error:', error);
      setHasError(true);
    });
    setIsPlaying(true);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSeekStart = () => {
    setIsDragging(true);
  };

  const handleSeekEnd = () => {
    setIsDragging(false);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Register methods for external control
  useEffect(() => {
    if (registerMethods) {
      registerMethods({ play, pause, replay });
    }
  }, [registerMethods]);

  useEffect(() => {
    // Reset error state when audioUrl changes
    setHasError(false);
    
    // If we have no audio URL and are in demo mode, create a fake audio element
    if (demoMode && !audioUrl) {
      audioRef.current = new Audio();
      return;
    }

    // If we have an audioUrl, create the audio element
    if (audioUrl) {
      const audio = new Audio();
      
      // Handle both data URLs and storage URLs
      if (audioUrl.startsWith('data:') || audioUrl.startsWith('http')) {
        audio.src = audioUrl;
      } else {
        // Handle relative URLs by making them absolute
        audio.src = audioUrl.startsWith('/') ? audioUrl : `/${audioUrl}`;
      }
      
      audioRef.current = audio;
    }
  }, [audioUrl, demoMode]);

  useEffect(() => {
    const audio = audioRef.current;
    
    if (!audio) return;
    
    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setHasError(false);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration || 0);
    };

    const handleError = (error: Event) => {
      console.error('Audio loading error:', error);
      setHasError(true);
      setIsPlaying(false);
    };
    
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('error', handleError);
    };
  }, [isDragging, audioUrl]);

  // If no audio URL and not in demo mode, don't render the player
  if (!audioUrl && !demoMode) {
    return (
      <div className="flex items-center justify-center p-4 rounded-md bg-gray-50">
        <p className="text-sm text-gray-500">Audio not available</p>
      </div>
    );
  }

  // If there's an error loading the audio
  if (hasError && !demoMode) {
    return (
      <div className="flex items-center justify-center p-4 rounded-md bg-red-50">
        <p className="text-sm text-red-600">Audio playback error</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      <div className="flex items-center gap-2">
        <Button 
          onClick={togglePlay}
          variant="outline"
          size="icon"
          className="rounded-full w-12 h-12"
          disabled={hasError && !demoMode}
        >
          {isPlaying ? 
            <Pause className="h-6 w-6" /> : 
            <Play className="h-6 w-6" />
          }
        </Button>
        
        <Button 
          onClick={replay}
          variant="outline"
          size="icon"
          className="rounded-full"
          disabled={hasError && !demoMode}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="w-full space-y-2">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          onValueCommit={handleSeekEnd}
          onPointerDown={handleSeekStart}
          className="w-full"
          disabled={(!audioUrl && !demoMode) || hasError}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      
      {demoMode && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Audio would play here in the full version
        </p>
      )}
    </div>
  );
};

export default AudioPlayer;
