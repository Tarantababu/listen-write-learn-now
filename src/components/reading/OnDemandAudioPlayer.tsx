
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
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
  Settings,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useOnDemandAudio } from '@/hooks/useOnDemandAudio';
import { ReadingExercise } from '@/types/reading';
import { cn } from '@/lib/utils';

interface OnDemandAudioPlayerProps {
  exercise: ReadingExercise;
  autoGenerate?: boolean;
  className?: string;
  compact?: boolean;
}

export const OnDemandAudioPlayer: React.FC<OnDemandAudioPlayerProps> = ({
  exercise,
  autoGenerate = false,
  className,
  compact = false
}) => {
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    isLoading,
    isGenerating,
    isPlaying,
    currentTime,
    duration,
    hasAudio,
    canPlay,
    error,
    audioStatus,
    generateAudio,
    play,
    pause,
    seekTo,
    skipBackward,
    skipForward,
    restart,
    setPlaybackRate: updatePlaybackRate
  } = useOnDemandAudio({ exercise, autoGenerate });

  const formatTime = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleSpeedChange = (newRate: number) => {
    setPlaybackRate(newRate);
    updatePlaybackRate(newRate);
  };

  const renderAudioStatus = () => {
    switch (audioStatus) {
      case 'none':
      case 'pending':
        return (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">No Audio</Badge>
            <Button
              onClick={generateAudio}
              disabled={isGenerating}
              size="sm"
              variant="outline"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Volume2 className="h-3 w-3 mr-1" />
                  Generate Audio
                </>
              )}
            </Button>
          </div>
        );
      
      case 'generating':
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="animate-pulse">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Generating
            </Badge>
          </div>
        );
      
      case 'error':
        return (
          <div className="flex items-center gap-2">
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              Error
            </Badge>
            <Button
              onClick={generateAudio}
              disabled={isGenerating}
              size="sm"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        );
      
      case 'ready':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <Volume2 className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        );
      
      default:
        return null;
    }
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {renderAudioStatus()}
        {hasAudio && (
          <div className="flex items-center gap-1">
            <Button
              onClick={handlePlayPause}
              disabled={!canPlay}
              size="sm"
              variant="outline"
            >
              {isPlaying ? (
                <Pause className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3" />
              )}
            </Button>
            <span className="text-xs text-gray-500">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("p-4", className)}>
      <div className="space-y-4">
        {/* Status and Generate Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium">Audio</span>
          </div>
          {renderAudioStatus()}
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {/* Audio Controls */}
        {hasAudio && (
          <>
            {/* Main Controls */}
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={() => skipBackward(10)}
                disabled={!canPlay}
                size="sm"
                variant="outline"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={restart}
                disabled={!canPlay}
                size="sm"
                variant="outline"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={handlePlayPause}
                disabled={!canPlay}
                size="lg"
                className="px-6"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              
              <Button
                onClick={() => skipForward(10)}
                disabled={!canPlay}
                size="sm"
                variant="outline"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={() => setShowSettings(!showSettings)}
                size="sm"
                variant="outline"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                onValueChange={(value) => seekTo(value[0])}
                max={duration}
                step={0.1}
                className="w-full"
                disabled={!canPlay}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Playback Speed</span>
                  <span className="text-sm text-gray-600">{playbackRate}x</span>
                </div>
                <div className="flex gap-2">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <Button
                      key={rate}
                      onClick={() => handleSpeedChange(rate)}
                      size="sm"
                      variant={playbackRate === rate ? "default" : "outline"}
                      className="text-xs"
                    >
                      {rate}x
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-gray-600">Loading audio...</span>
          </div>
        )}
      </div>
    </Card>
  );
};
