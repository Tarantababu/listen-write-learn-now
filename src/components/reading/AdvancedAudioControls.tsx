
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Volume2, VolumeX, Settings } from 'lucide-react';

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

// Minimalist monochrome time
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

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
  onSeek,
}) => {
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || audioDuration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * audioDuration;
    onSeek(newTime);
  };

  // Minimalist progress, control style
  return (
    <div className="w-full px-2 py-1 flex flex-col gap-2 bg-white/70 dark:bg-zinc-950/70 rounded-none shadow-none">
      {/* Top controls: only icons, right-aligned */}
      <div className="flex items-center justify-end w-full gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleAudio}
          className="p-1 h-8 w-8 rounded-full bg-transparent hover:bg-gray-100 dark:hover:bg-zinc-900"
          aria-label={audioEnabled ? "Mute audio" : "Unmute audio"}
        >
          {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSettings}
          className="p-1 h-8 w-8 rounded-full bg-transparent hover:bg-gray-100 dark:hover:bg-zinc-900"
          aria-label="Audio speed settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress bar + times */}
      <div className="w-full flex flex-col gap-0.5 items-stretch">
        <div
          className="relative w-full h-2 bg-gray-200 dark:bg-zinc-800 rounded shadow-none cursor-pointer"
          onClick={handleProgressClick}
        >
          <div
            className="absolute top-0 left-0 h-2 rounded bg-zinc-900 dark:bg-zinc-100 transition-all duration-300"
            style={{ width: `${audioDuration > 0 ? (currentPosition / audioDuration) * 100 : 0}%` }}
          />
          {/* Word progress indicator: subtle bar over progress */}
          {totalWords > 0 && highlightedWordIndex >= 0 && (
            <div
              className="absolute top-0 h-2 w-0.5 bg-orange-400 rounded"
              style={{
                left: `${(highlightedWordIndex / totalWords) * 100}%`,
                transform: 'translateX(-50%)',
              }}
            />
          )}
        </div>
        <div className="flex justify-between text-[10px] text-zinc-500 w-full font-mono pt-0.5">
          <span>{formatTime(currentPosition)}</span>
          <span>{formatTime(audioDuration)}</span>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-center gap-2 w-full">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRestart}
          disabled={!audioEnabled || isGeneratingAudio}
          className="p-1 h-8 w-8"
          aria-label="Restart"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSkipBackward}
          disabled={!audioEnabled || isGeneratingAudio}
          className="p-1 h-8 w-8"
          aria-label="Skip backwards"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          variant="default"
          size="icon"
          onClick={onTogglePlayPause}
          disabled={!audioEnabled || isGeneratingAudio}
          className="p-1 h-10 w-10 rounded-full bg-black text-white dark:bg-zinc-200 dark:text-black shadow-none"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSkipForward}
          disabled={!audioEnabled || isGeneratingAudio}
          className="p-1 h-8 w-8"
          aria-label="Skip forward"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Speed Controls (settings) */}
      {showSettings && (
        <div className="flex items-center justify-center gap-2 pt-0 border-t-0 mt-0.5">
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
            <Button
              key={speed}
              variant={audioSpeed === speed ? "default" : "ghost"}
              size="sm"
              onClick={() => onChangeSpeed(speed)}
              className={`text-xs px-2 py-1 rounded ${audioSpeed === speed ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black' : 'bg-transparent text-zinc-500'} shadow-none`}
              aria-label={`Set speed ${speed}x`}
            >
              {speed}x
            </Button>
          ))}
        </div>
      )}
      {/* Generation state - spinner, very minimalist */}
      {isGeneratingAudio && (
        <div className="w-full flex items-center justify-center pt-1">
          <div className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};
