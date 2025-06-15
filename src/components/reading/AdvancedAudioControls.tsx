
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
import { AudioWaveformPulse } from './AudioWaveformPulse';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

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

  // Dynamic classes for mobile vs desktop
  const btnSize = isMobile ? "icon" : "sm";
  const ctrlBtnMin = isMobile ? "min-w-[48px] min-h-[48px]" : "";
  const ctrlBtnClass = `touch-manipulation ${ctrlBtnMin} rounded-full active:scale-95 focus-visible:ring-2 transition duration-100`;
  const playBtnSize = isMobile ? "icon" : "lg";
  const playBtnWH = isMobile ? "w-14 h-14" : "w-16 h-12";
  const playBtnClass = `touch-manipulation rounded-full ${playBtnWH} flex items-center justify-center active:scale-95 transition duration-100`;

  // Mobile: increase spacing between controls
  const mainCtrlGap = isMobile ? "gap-4" : "gap-2";

  // Progress bar hit area + visual
  const progressH = isMobile ? "h-5" : "h-3";
  const progressClass = `w-full bg-gray-200 rounded-full ${progressH} cursor-pointer relative`;
  const progressFGClass = `bg-blue-600 ${progressH} rounded-full transition-all duration-300`;

  // Word progress indicator thicker on mobile
  const wordIndicatorClass = `absolute top-0 ${progressH} w-1 ${isMobile ? "bg-yellow-400" : "bg-yellow-500"} rounded-full transition-all duration-300`;

  return (
    <Card className={`p-4 space-y-4 ${isMobile ? 'select-none' : ''}`}>
      {/* Status/Settings Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isMobile && (
            <Badge variant="outline" className="text-xs">
              Word {highlightedWordIndex + 1} of {totalWords}
            </Badge>
          )}
          {isGeneratingAudio && (
            <AudioWaveformPulse className="ml-2" />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size={btnSize}
            onClick={onToggleAudio}
            className={ctrlBtnClass}
            aria-label={audioEnabled ? "Mute audio" : "Unmute audio"}
            tabIndex={0}
          >
            {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size={btnSize}
            onClick={onToggleSettings}
            className={ctrlBtnClass}
            aria-label="Audio settings"
            tabIndex={0}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Controls */}
      <div className={`flex items-center justify-center ${mainCtrlGap}`}>
        <Button
          variant="outline"
          size={btnSize}
          onClick={onRestart}
          disabled={!audioEnabled || isGeneratingAudio}
          className={ctrlBtnClass}
          aria-label="Restart audio"
        >
          <RotateCcw className="h-6 w-6" />
        </Button>
        
        <Button
          variant="outline"
          size={btnSize}
          onClick={onSkipBackward}
          disabled={!audioEnabled || isGeneratingAudio}
          className={ctrlBtnClass}
          aria-label="Skip back 10 seconds"
        >
          <SkipBack className="h-6 w-6" />
        </Button>
        
        <Button
          variant="default"
          size={playBtnSize}
          onClick={onTogglePlayPause}
          disabled={!audioEnabled || isGeneratingAudio}
          className={playBtnClass}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
        </Button>
        
        <Button
          variant="outline"
          size={btnSize}
          onClick={onSkipForward}
          disabled={!audioEnabled || isGeneratingAudio}
          className={ctrlBtnClass}
          aria-label="Skip forward 10 seconds"
        >
          <SkipForward className="h-6 w-6" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div 
          className={progressClass}
          onClick={handleProgressClick}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={audioDuration}
          aria-valuenow={currentPosition}
          aria-label="Audio progress"
        >
          <div 
            className={progressFGClass}
            style={{ width: `${audioDuration > 0 ? (currentPosition / audioDuration) * 100 : 0}%` }}
          />
          
          {/* Word progress indicator */}
          {totalWords > 0 && (
            <div 
              className={wordIndicatorClass}
              style={{ 
                left: `${totalWords > 0 ? (highlightedWordIndex / totalWords) * 100 : 0}%`,
                transform: 'translateX(-50%)'
              }}
            />
          )}
        </div>
        
        <div className={`flex justify-between text-sm text-muted-foreground ${isMobile ? "text-base font-medium" : ""}`}>
          <span>{formatTime(currentPosition)}</span>
          <span>{formatTime(audioDuration)}</span>
        </div>
      </div>

      {/* Speed Controls */}
      {showSettings && (
        <div className={`flex items-center justify-center gap-1 pt-2 border-t ${isMobile ? "gap-2 pt-3" : ""}`}>
          <span className={`text-sm text-muted-foreground ${isMobile ? "mr-2" : "mr-2"}`}>Speed:</span>
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
            <Button
              key={speed}
              variant={audioSpeed === speed ? "default" : "outline"}
              size={isMobile ? "sm" : "sm"}
              onClick={() => onChangeSpeed(speed)}
              className={`text-xs px-2 ${isMobile ? "min-w-[40px] min-h-[32px] rounded-lg touch-manipulation active:scale-95" : ""}`}
              aria-label={`Set speed to ${speed}x`}
            >
              {speed}x
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
};
