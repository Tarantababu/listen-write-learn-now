
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Volume2, 
  X, 
  Clock, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  StopCircle
} from 'lucide-react';
import { TtsProgress } from '@/services/enhancedTtsService';

interface TtsProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel?: () => void;
  progress?: TtsProgress | null;
  estimatedTime?: number;
  complexity?: 'low' | 'medium' | 'high';
  chunksEstimate?: number;
  textLength?: number;
  chunkSize?: string;
  error?: string | null;
  isComplete?: boolean;
  isCancelled?: boolean;
}

export const TtsProgressModal: React.FC<TtsProgressModalProps> = ({
  isOpen,
  onClose,
  onCancel,
  progress,
  estimatedTime = 0,
  complexity = 'medium',
  chunksEstimate = 1,
  textLength = 0,
  chunkSize = 'auto',
  error = null,
  isComplete = false,
  isCancelled = false
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!isOpen || isComplete || isCancelled || error) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isComplete, isCancelled, error, startTime]);

  const progressPercent = progress?.progress || 0;
  const remainingTime = estimatedTime - elapsedTime;
  const isOverEstimate = elapsedTime > estimatedTime;

  const getComplexityColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChunkSizeLabel = (size: string) => {
    switch (size) {
      case 'small': return 'Fast';
      case 'medium': return 'Balanced';
      case 'large': return 'Quality';
      case 'auto': return 'Auto';
      default: return size;
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-blue-600" />
              Audio Generation
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status indicator */}
          {error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">Generation Failed</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : isCancelled ? (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <StopCircle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800">Generation Cancelled</p>
                    <p className="text-sm text-orange-700 mt-1">Audio generation was stopped by user</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : isComplete ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Generation Complete!</p>
                    <p className="text-sm text-green-700 mt-1">Your audio is ready to play</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Progress bar */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-gray-600">{Math.round(progressPercent)}%</span>
                </div>
                <Progress 
                  value={progressPercent} 
                  className="h-3"
                  indicatorClassName={progressPercent === 100 ? 'bg-green-500' : ''}
                />
                {progress?.message && (
                  <p className="text-sm text-gray-600">{progress.message}</p>
                )}
              </div>

              {/* Chunk progress */}
              {progress?.totalChunks && progress.totalChunks > 1 && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-800">Segments</span>
                    <span className="text-sm text-blue-700">
                      {progress.chunksProcessed || 0} / {progress.totalChunks}
                    </span>
                  </div>
                  <div className="mt-2">
                    <Progress 
                      value={(progress.chunksProcessed || 0) / progress.totalChunks * 100} 
                      className="h-2"
                      indicatorClassName="bg-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Time tracking */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Elapsed</p>
                  <p className="font-medium">{formatTime(elapsedTime)}</p>
                </div>
                <div>
                  <p className="text-gray-600">
                    {isOverEstimate ? 'Running over' : 'Remaining'}
                  </p>
                  <p className={`font-medium ${isOverEstimate ? 'text-orange-600' : ''}`}>
                    {isOverEstimate 
                      ? `+${formatTime(elapsedTime - estimatedTime)}`
                      : formatTime(Math.max(0, remainingTime))
                    }
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Generation details */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Text Length</p>
                  <p className="font-medium">{textLength.toLocaleString()} chars</p>
                </div>
                <div>
                  <p className="text-gray-600">Complexity</p>
                  <Badge variant="outline" className={getComplexityColor(complexity)}>
                    {complexity}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-600">Mode</p>
                  <p className="font-medium">{getChunkSizeLabel(chunkSize)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Segments</p>
                  <p className="font-medium">{chunksEstimate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex gap-3">
            {!error && !isComplete && !isCancelled && onCancel && (
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="flex-1"
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button 
              onClick={onClose}
              className="flex-1"
              variant={isComplete ? "default" : "outline"}
            >
              {isComplete ? 'Continue' : 'Close'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
