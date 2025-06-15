
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Volume2, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Clock,
  Zap,
  RotateCcw
} from 'lucide-react';
import { EnhancedAudioState } from '@/hooks/useEnhancedAudioProgress';

interface EnhancedAudioProgressIndicatorProps {
  state: EnhancedAudioState;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

const stageLabels = {
  initializing: 'Initializing audio generation...',
  processing: 'Processing audio...',
  uploading: 'Uploading audio file...',
  finalizing: 'Finalizing...',
  complete: 'Audio generation complete!'
};

const stageIcons = {
  initializing: <Clock className="h-4 w-4 animate-pulse" />,
  processing: <Volume2 className="h-4 w-4 animate-pulse" />,
  uploading: <Zap className="h-4 w-4 animate-bounce" />,
  finalizing: <CheckCircle className="h-4 w-4" />,
  complete: <CheckCircle className="h-4 w-4 text-green-500" />
};

export const EnhancedAudioProgressIndicator: React.FC<EnhancedAudioProgressIndicatorProps> = ({
  state,
  onCancel,
  onRetry,
  className = '',
  compact = false
}) => {
  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '';
    if (seconds < 60) return `${Math.ceil(seconds)}s remaining`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `${mins}m ${secs}s remaining`;
  };

  const getProgressColor = () => {
    if (state.error) return 'bg-red-500';
    if (state.stage === 'complete') return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getStageVariant = () => {
    if (state.error) return 'destructive';
    if (state.stage === 'complete') return 'default';
    return 'secondary';
  };

  if (!state.isGenerating && !state.error && state.stage !== 'complete') {
    return null;
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {state.isGenerating && (
          <>
            <div className="flex items-center gap-1">
              {stageIcons[state.stage]}
              <span className="text-sm text-muted-foreground">
                {Math.round(state.progress)}%
              </span>
            </div>
            <Progress 
              value={state.progress} 
              className="h-2 w-20"
              indicatorClassName={getProgressColor()}
            />
          </>
        )}
        
        {state.error && (
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-600">Error</span>
            {onRetry && (
              <Button variant="ghost" size="sm" onClick={onRetry} className="h-6 px-2">
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {state.stage === 'complete' && !state.error && (
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600">Complete</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {stageIcons[state.stage]}
            <h3 className="font-semibold text-sm">
              {state.error ? 'Audio Generation Error' : stageLabels[state.stage]}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={getStageVariant()}>
              {state.error ? 'Error' : state.stage}
            </Badge>
            
            {state.canCancel && onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {state.isGenerating && (
          <div className="space-y-2">
            <Progress 
              value={state.progress} 
              className="h-3"
              indicatorClassName={`transition-all duration-300 ${getProgressColor()}`}
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(state.progress)}%</span>
              {state.estimatedTimeRemaining > 0 && (
                <span>{formatTime(state.estimatedTimeRemaining)}</span>
              )}
            </div>
          </div>
        )}

        {/* Current Item */}
        {state.currentItem && (
          <div className="text-sm text-muted-foreground">
            {state.currentItem}
          </div>
        )}

        {/* Batch Progress */}
        {state.totalItems && state.totalItems > 1 && (
          <div className="text-sm text-muted-foreground">
            Processing {state.completedItems || 0} of {state.totalItems} items
          </div>
        )}

        {/* Error Message */}
        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Error:</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{state.error}</p>
            
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="mt-2 border-red-300 text-red-700 hover:bg-red-50"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            )}
          </div>
        )}

        {/* Success Summary */}
        {state.stage === 'complete' && !state.error && state.results && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Generation Complete</span>
            </div>
            <div className="text-sm text-green-700 mt-1">
              {state.results.size} audio file(s) generated successfully
              {Array.from(state.results.values()).some(r => !r.success) && (
                <span className="text-orange-600">
                  {' '}({Array.from(state.results.values()).filter(r => !r.success).length} failed)
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
