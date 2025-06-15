
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw,
  Volume2,
  VolumeX,
  Settings
} from 'lucide-react';

interface AdvancedAudioControlsProps {
  isPlaying: boolean;
  isGeneratingAudio: boolean;
  audioEnabled: boolean;
  currentPosition: number;
  audioDuration: number;
  audioSpeed: number;
  showSettings: boolean;
  highlightedWordIndex: number;
  totalWords: number;
  onTogglePlayPause: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onRestart: () => void;
  onToggleAudio: () => void;
  onToggleSettings: () => void;
  onChangeSpeed: (speed: number) => void;
  onSeek?: (time: number) => void;
}

export const AdvancedAudioControls: React.FC<AdvancedAudioControlsProps> = ({
  isPlaying,
  isGeneratingAudio,
  audioEnabled,
  currentPosition,
  audioDuration,
  audioSpeed,
  showSettings,
  highlightedWordIndex,
  totalWords,
  onTogglePlayPause,
  onSkipBackward,
  onSkipForward,
  onRestart,
  onToggleAudio,
  onToggleSettings,
  onChangeSpeed,
  onSeek
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || audioDuration === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * audioDuration;
    onSeek(newTime);
  };

  return (
    <Card className="p-4 space-y-4">
      {/* Status Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Word {highlightedWordIndex + 1} of {totalWords}
          </Badge>
          {isGeneratingAudio && (
            <Badge variant="secondary" className="text-xs">
              Generating audio...
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleAudio}
          >
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSettings}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRestart}
          disabled={!audioEnabled || isGeneratingAudio}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onSkipBackward}
          disabled={!audioEnabled || isGeneratingAudio}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        
        <Button
          variant="default"
          size="lg"
          onClick={onTogglePlayPause}
          disabled={!audioEnabled || isGeneratingAudio}
          className="w-16 h-12"
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onSkipForward}
          disabled={!audioEnabled || isGeneratingAudio}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div 
          className="w-full bg-gray-200 rounded-full h-3 cursor-pointer relative"
          onClick={handleProgressClick}
        >
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${audioDuration > 0 ? (currentPosition / audioDuration) * 100 : 0}%` }}
          />
          
          {/* Word progress indicator */}
          {totalWords > 0 && (
            <div 
              className="absolute top-0 h-3 w-1 bg-yellow-500 rounded-full transition-all duration-300"
              style={{ 
                left: `${totalWords > 0 ? (highlightedWordIndex / totalWords) * 100 : 0}%`,
                transform: 'translateX(-50%)'
              }}
            />
          )}
        </div>
        
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatTime(currentPosition)}</span>
          <span>{formatTime(audioDuration)}</span>
        </div>
      </div>

      {/* Speed Controls */}
      {showSettings && (
        <div className="flex items-center justify-center gap-2 pt-2 border-t">
          <span className="text-sm text-muted-foreground mr-2">Speed:</span>
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
            <Button
              key={speed}
              variant={audioSpeed === speed ? "default" : "outline"}
              size="sm"
              onClick={() => onChangeSpeed(speed)}
              className="text-xs px-2"
            >
              {speed}x
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
};
