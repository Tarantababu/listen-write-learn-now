
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  BookOpen, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Sparkles
} from 'lucide-react';

interface ReadingExerciseCreationProgressProps {
  isGenerating: boolean;
  progress: number;
  stage: 'initializing' | 'generating' | 'processing' | 'finalizing' | 'complete';
  currentStep?: string;
  estimatedTime?: number;
  error?: string;
  className?: string;
}

const stageLabels = {
  initializing: 'Initializing exercise creation...',
  generating: 'Generating reading content...',
  processing: 'Processing and analyzing text...',
  finalizing: 'Creating your exercise...',
  complete: 'Exercise created successfully!'
};

const stageIcons = {
  initializing: <Clock className="h-4 w-4 animate-pulse" />,
  generating: <BookOpen className="h-4 w-4 animate-pulse" />,
  processing: <Sparkles className="h-4 w-4 animate-spin" />,
  finalizing: <CheckCircle className="h-4 w-4" />,
  complete: <CheckCircle className="h-4 w-4 text-green-500" />
};

export const ReadingExerciseCreationProgress: React.FC<ReadingExerciseCreationProgressProps> = ({
  isGenerating,
  progress,
  stage,
  currentStep,
  estimatedTime,
  error,
  className = ''
}) => {
  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '';
    if (seconds < 60) return `${Math.ceil(seconds)}s remaining`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `${mins}m ${secs}s remaining`;
  };

  const getProgressColor = () => {
    if (error) return 'bg-red-500';
    if (stage === 'complete') return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getStageVariant = () => {
    if (error) return 'destructive';
    if (stage === 'complete') return 'default';
    return 'secondary';
  };

  if (!isGenerating && !error && stage !== 'complete') {
    return null;
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {stageIcons[stage]}
            <h3 className="font-semibold text-sm">
              {error ? 'Exercise Creation Error' : stageLabels[stage]}
            </h3>
          </div>
          
          <Badge variant={getStageVariant()}>
            {error ? 'Error' : stage}
          </Badge>
        </div>

        {/* Progress Bar */}
        {isGenerating && (
          <div className="space-y-2">
            <Progress 
              value={progress} 
              className="h-3"
              indicatorClassName={`transition-all duration-300 ${getProgressColor()}`}
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(progress)}%</span>
              {estimatedTime && estimatedTime > 0 && (
                <span>{formatTime(estimatedTime)}</span>
              )}
            </div>
          </div>
        )}

        {/* Current Step */}
        {currentStep && (
          <div className="text-sm text-muted-foreground">
            {currentStep}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Error:</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {stage === 'complete' && !error && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Success!</span>
            </div>
            <div className="text-sm text-green-700 mt-1">
              Your reading exercise has been created successfully. Audio generation will continue in the background.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
