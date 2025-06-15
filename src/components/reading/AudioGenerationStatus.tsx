
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Volume2, AlertCircle, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { readingExerciseService } from '@/services/readingExerciseService';
import { toast } from 'sonner';

interface AudioGenerationStatusProps {
  exerciseId: string;
  onStatusChange?: (status: string) => void;
}

export const AudioGenerationStatus: React.FC<AudioGenerationStatusProps> = ({
  exerciseId,
  onStatusChange
}) => {
  const [status, setStatus] = useState<{
    status: string;
    progress?: number;
    error?: string;
    retryCount?: number;
    canRetry?: boolean;
  }>({ status: 'pending' });
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    checkStatus();
    
    // Poll status every 3 seconds if generating
    const interval = setInterval(() => {
      if (status.status === 'generating' || status.status === 'pending') {
        checkStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [exerciseId, status.status]);

  const checkStatus = async () => {
    try {
      const statusData = await readingExerciseService.getAudioGenerationStatus(exerciseId);
      setStatus(statusData);
      onStatusChange?.(statusData.status);
    } catch (error) {
      console.error('Failed to check audio status:', error);
    }
  };

  const handleRetry = async () => {
    if (isRetrying || !status.canRetry) return;
    
    setIsRetrying(true);
    try {
      await readingExerciseService.retryAudioGeneration(exerciseId);
      toast.success('Audio generation retry started');
      setStatus(prev => ({ ...prev, status: 'generating' }));
    } catch (error) {
      console.error('Failed to retry audio generation:', error);
      toast.error(error.message || 'Failed to retry audio generation');
    } finally {
      setIsRetrying(false);
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'generating':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusMessage = () => {
    switch (status.status) {
      case 'completed':
        return 'Audio generation completed successfully';
      case 'generating':
        return 'Generating audio tracks...';
      case 'failed':
        return status.error || 'Audio generation failed';
      case 'pending':
      default:
        return 'Audio generation pending...';
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'generating':
        return 'border-blue-200 bg-blue-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      case 'pending':
      default:
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  // Don't show component if audio is completed
  if (status.status === 'completed') {
    return null;
  }

  return (
    <Card className={`mb-4 ${getStatusColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{getStatusMessage()}</p>
              {status.retryCount !== undefined && status.retryCount > 0 && (
                <span className="text-xs text-gray-500">
                  Attempt {status.retryCount + 1}/3
                </span>
              )}
            </div>
            
            {status.progress !== undefined && (
              <Progress value={status.progress} className="mt-2 h-2" />
            )}
            
            {status.status === 'failed' && status.canRetry && (
              <div className="mt-3 flex items-center gap-2">
                <Button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3 w-3 mr-1" />
                      Retry Audio Generation
                    </>
                  )}
                </Button>
                <span className="text-xs text-gray-500">
                  {3 - (status.retryCount || 0)} attempts remaining
                </span>
              </div>
            )}
            
            {status.status === 'failed' && !status.canRetry && (
              <p className="mt-2 text-xs text-red-600">
                Maximum retry attempts reached. Please create a new exercise.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
