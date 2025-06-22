
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Loader2, Volume2 } from 'lucide-react';

interface AudioPlayButtonProps {
  isPlaying: boolean;
  isLoading: boolean;
  onPlay: () => void;
  onStop: () => void;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export const AudioPlayButton: React.FC<AudioPlayButtonProps> = ({
  isPlaying,
  isLoading,
  onPlay,
  onStop,
  size = 'sm',
  variant = 'outline',
  className = ''
}) => {
  const handleClick = () => {
    if (isPlaying) {
      onStop();
    } else {
      onPlay();
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      size={size}
      variant={variant}
      className={`flex items-center gap-2 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPlaying ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Play className="h-4 w-4" />
      )}
      <Volume2 className="h-4 w-4" />
      <span className="text-xs">
        {isLoading ? 'Loading...' : isPlaying ? 'Stop' : 'Play'}
      </span>
    </Button>
  );
};
