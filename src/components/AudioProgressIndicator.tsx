
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface AudioProgressIndicatorProps {
  isGenerating: boolean;
  progress: number;
  estimatedTimeRemaining: number;
  stage: 'initializing' | 'processing' | 'uploading' | 'finalizing' | 'complete';
  className?: string;
}

const stageLabels = {
  initializing: 'Initializing...',
  processing: 'Generating audio...',
  uploading: 'Uploading...',
  finalizing: 'Finalizing...',
  complete: 'Complete!'
};

export const AudioProgressIndicator: React.FC<AudioProgressIndicatorProps> = ({
  isGenerating,
  progress,
  estimatedTimeRemaining,
  stage,
  className = ''
}) => {
  if (!isGenerating) return null;

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '';
    if (seconds < 60) return `${Math.ceil(seconds)}s remaining`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `${mins}m ${secs}s remaining`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {stageLabels[stage]}
        </span>
        {estimatedTimeRemaining > 0 && (
          <span className="text-xs text-muted-foreground">
            {formatTime(estimatedTimeRemaining)}
          </span>
        )}
      </div>
      
      <Progress 
        value={progress} 
        className="h-2"
        indicatorClassName={`transition-all duration-300 ${
          stage === 'complete' ? 'bg-green-500' : 'bg-primary'
        }`}
      />
      
      <div className="text-xs text-center text-muted-foreground">
        {Math.round(progress)}%
      </div>
    </div>
  );
};
