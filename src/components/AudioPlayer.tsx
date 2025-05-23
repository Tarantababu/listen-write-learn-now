
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = () => {
    if (!audioRef.current) return;
    audioRef.current.play();
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
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setIsPlaying(true);
  };

  // Register methods for external control
  useEffect(() => {
    if (registerMethods) {
      registerMethods({ play, pause, replay });
    }
  }, [registerMethods]);

  useEffect(() => {
    // If we have no audio URL and are in demo mode, create a fake audio element
    if (demoMode && !audioUrl) {
      audioRef.current = new Audio();
    }
  }, [audioUrl, demoMode]);

  useEffect(() => {
    const audio = audioRef.current;
    
    if (!audio) return;
    
    const handleEnded = () => {
      setIsPlaying(false);
    };
    
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // If no audio URL and not in demo mode, don't render the player
  if (!audioUrl && !demoMode) {
    return (
      <div className="flex items-center justify-center p-4 rounded-md bg-gray-50">
        <p className="text-sm text-gray-500">Audio not available yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {audioUrl && <audio ref={audioRef} src={audioUrl} />}
      
      <div className="flex items-center gap-2">
        <Button 
          onClick={togglePlay}
          variant="outline"
          size="icon"
          className="rounded-full w-12 h-12"
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
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      
      {demoMode && (
        <p className="text-xs text-muted-foreground mt-2">
          Audio would play here in the full version
        </p>
      )}
    </div>
  );
};

export default AudioPlayer;
