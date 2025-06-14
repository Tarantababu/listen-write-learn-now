
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
  Layers,
  AlertTriangle,
  Zap
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
  hasOptimizations?: boolean;
}

const STEP_ICONS = {
  'content-generation': Sparkles,
  'text-processing': FileText,
  'chunked-generation': Layers,
  'optimized-generation': Zap,
  'audio-generation': Volume2,
  'finalization': CheckCircle
};

export const ReadingExerciseCreationProgress: React.FC<ReadingExerciseCreationProgressProps> = ({
  steps,
  currentStep,
  overallProgress,
  onCancel,
  estimatedTimeRemaining,
  hasOptimizations = true
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <h3 className="text-lg font-semibold">Creating Your Reading Exercise</h3>
        </div>
        
        {hasOptimizations && (
          <div className="flex items-center justify-center gap-2 text-sm text-green-600">
            <Zap className="h-4 w-4" />
            <span>Using optimized generation strategy</span>
          </div>
        )}
        
        <p className="text-sm text-muted-foreground">
          Enhanced performance with timeout protection and parallel processing
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
          <Progress 
            value={overallProgress} 
            className="h-2" 
            indicatorClassName="transition-all duration-500"
          />
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
                  ${isActive ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : ''}
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
                      ) : isError ? (
                        <AlertTriangle className="h-5 w-5" />
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
                        {step.id === 'optimized-generation' && isActive && (
                          <Badge variant="secondary" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            Optimized
                          </Badge>
                        )}
                        {step.id === 'chunked-generation' && isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Smart Chunking
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                      
                      {isError && (
                        <div className="mt-2 text-xs text-red-600">
                          Processing failed, but we'll continue with available content
                        </div>
                      )}
                    </div>

                    <div className={`
                      w-4 h-4 rounded-full border-2 transition-all duration-300
                      ${isCompleted 
                        ? 'bg-green-500 border-green-500' 
                        : isError
                          ? 'bg-red-500 border-red-500'
                          : isActive 
                            ? 'border-primary bg-primary/20 animate-pulse' 
                            : 'border-muted-foreground/30'
                      }
                    `} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {hasOptimizations && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-800">Performance Optimizations Active</div>
                <div className="text-blue-600 mt-1">
                  • Intelligent chunking strategy<br/>
                  • Timeout protection with graceful fallback<br/>
                  • Parallel processing for faster generation<br/>
                  • Enhanced error recovery
                </div>
              </div>
            </div>
          </div>
        )}
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
