
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  FileText, 
  Volume2,
  X,
  Layers
} from 'lucide-react';

interface ProgressStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  estimatedTime?: number;
}

interface ReadingExerciseCreationProgressProps {
  steps: ProgressStep[];
  currentStep: number;
  overallProgress: number;
  onCancel: () => void;
  estimatedTimeRemaining?: number;
}

const STEP_ICONS = {
  'content-generation': Sparkles,
  'text-processing': FileText,
  'chunked-generation': Layers,
  'audio-generation': Volume2,
  'finalization': CheckCircle
};

export const ReadingExerciseCreationProgress: React.FC<ReadingExerciseCreationProgressProps> = ({
  steps,
  currentStep,
  overallProgress,
  onCancel,
  estimatedTimeRemaining
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <h3 className="text-lg font-semibold">Creating Your Reading Exercise</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Using advanced chunking strategy for optimal content generation
        </p>
        {estimatedTimeRemaining && (
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            ~{estimatedTimeRemaining}s remaining
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const IconComponent = STEP_ICONS[step.id as keyof typeof STEP_ICONS] || FileText;
            const isActive = index === currentStep;
            const isCompleted = step.status === 'completed';
            const isError = step.status === 'error';
            
            return (
              <Card
                key={step.id}
                className={`
                  transition-all duration-300
                  ${isActive ? 'ring-2 ring-primary shadow-lg' : ''}
                  ${isCompleted ? 'bg-green-50 border-green-200' : ''}
                  ${isError ? 'bg-red-50 border-red-200' : ''}
                `}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${isCompleted 
                        ? 'bg-green-100 text-green-600' 
                        : isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : isError
                            ? 'bg-red-100 text-red-600'
                            : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : isActive ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <IconComponent className="h-5 w-5" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{step.label}</h4>
                        {step.estimatedTime && isActive && (
                          <Badge variant="outline" className="text-xs">
                            ~{step.estimatedTime}s
                          </Badge>
                        )}
                        {step.id === 'chunked-generation' && isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Advanced Strategy
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>

                    <div className={`
                      w-4 h-4 rounded-full border-2
                      ${isCompleted 
                        ? 'bg-green-500 border-green-500' 
                        : isActive 
                          ? 'border-primary bg-primary/20' 
                          : 'border-muted-foreground/30'
                      }
                    `} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center">
        <Button variant="outline" onClick={onCancel} size="sm">
          <X className="h-4 w-4 mr-2" />
          Cancel Creation
        </Button>
      </div>
    </div>
  );
};
