
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CreateExerciseStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  estimatedTime?: number;
  actualTime?: number;
}

interface CreateExerciseProgressProps {
  steps: CreateExerciseStep[];
  currentStepIndex: number;
  overallProgress: number;
  totalEstimatedTime?: number;
  elapsedTime?: number;
  canCancel?: boolean;
  onCancel?: () => void;
}

export const CreateExerciseProgress: React.FC<CreateExerciseProgressProps> = ({
  steps,
  currentStepIndex,
  overallProgress,
  totalEstimatedTime,
  elapsedTime,
  canCancel,
  onCancel
}) => {
  const getStepIcon = (step: CreateExerciseStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: CreateExerciseStep['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in-progress': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Creating Exercise</h3>
            <span className="text-xs text-muted-foreground">
              {Math.round(overallProgress)}%
            </span>
          </div>
          <Progress 
            value={overallProgress} 
            className="h-2"
            indicatorClassName="transition-all duration-500 ease-out"
          />
        </div>

        {/* Time Information */}
        {(totalEstimatedTime || elapsedTime) && (
          <div className="flex justify-between text-xs text-muted-foreground">
            {elapsedTime !== undefined && (
              <span>Elapsed: {formatTime(elapsedTime)}</span>
            )}
            {totalEstimatedTime && (
              <span>Est. Total: {formatTime(totalEstimatedTime)}</span>
            )}
          </div>
        )}

        {/* Steps List */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-start gap-3 p-2 rounded-md transition-all duration-200",
                index === currentStepIndex && step.status === 'in-progress' 
                  ? "bg-blue-50 dark:bg-blue-950/20" 
                  : ""
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getStepIcon(step)}
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn("text-sm font-medium", getStatusColor(step.status))}>
                  {step.label}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {step.description}
                </div>
                {step.estimatedTime && step.status === 'pending' && (
                  <div className="text-xs text-muted-foreground mt-1">
                    ~{formatTime(step.estimatedTime)}
                  </div>
                )}
                {step.actualTime && step.status === 'completed' && (
                  <div className="text-xs text-green-600 mt-1">
                    Completed in {formatTime(step.actualTime)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Cancel Button */}
        {canCancel && onCancel && (
          <div className="pt-2 border-t">
            <button
              onClick={onCancel}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel Creation
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
