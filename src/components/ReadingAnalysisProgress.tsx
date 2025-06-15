
import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2, BookOpen, Brain, Lightbulb, FileText } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ReadingAnalysisProgressProps {
  isGenerating: boolean;
  onComplete?: () => void;
}

interface ProgressStep {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  estimatedDuration: number; // in seconds
}

const PROGRESS_STEPS: ProgressStep[] = [
  {
    id: 'analyzing',
    label: 'Analyzing Text',
    description: 'Breaking down sentences and identifying key components',
    icon: BookOpen,
    estimatedDuration: 3
  },
  {
    id: 'vocabulary',
    label: 'Processing Vocabulary',
    description: 'Extracting important words and generating definitions',
    icon: Brain,
    estimatedDuration: 4
  },
  {
    id: 'grammar',
    label: 'Grammar Analysis',
    description: 'Identifying patterns and grammatical structures',
    icon: Lightbulb,
    estimatedDuration: 3
  },
  {
    id: 'finalizing',
    label: 'Finalizing Analysis',
    description: 'Compiling insights and generating summary',
    icon: FileText,
    estimatedDuration: 2
  }
];

export const ReadingAnalysisProgress: React.FC<ReadingAnalysisProgressProps> = ({
  isGenerating,
  onComplete
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isGenerating) {
      // Reset all states when not generating
      setCurrentStepIndex(0);
      setProgress(0);
      setStepProgress(0);
      setIsAnimating(false);
      return;
    }

    // Start animation when generation begins
    setIsAnimating(true);
    
    const totalDuration = PROGRESS_STEPS.reduce((acc, step) => acc + step.estimatedDuration, 0);
    let elapsedTime = 0;
    let hasCompleted = false;

    const interval = setInterval(() => {
      if (hasCompleted) return;
      
      elapsedTime += 0.1;
      
      // Calculate which step we should be on
      let cumulativeTime = 0;
      let newStepIndex = 0;
      
      for (let i = 0; i < PROGRESS_STEPS.length; i++) {
        const stepEndTime = cumulativeTime + PROGRESS_STEPS[i].estimatedDuration;
        if (elapsedTime <= stepEndTime) {
          newStepIndex = i;
          break;
        }
        cumulativeTime += PROGRESS_STEPS[i].estimatedDuration;
      }
      
      // Ensure we don't exceed the last step
      newStepIndex = Math.min(newStepIndex, PROGRESS_STEPS.length - 1);
      
      // Update current step if it changed
      if (newStepIndex !== currentStepIndex) {
        setCurrentStepIndex(newStepIndex);
      }
      
      // Calculate overall progress (cap at 95% until completion)
      const overallProgress = Math.min((elapsedTime / totalDuration) * 100, 95);
      setProgress(overallProgress);
      
      // Calculate step progress
      const stepStartTime = PROGRESS_STEPS.slice(0, newStepIndex).reduce((acc, step) => acc + step.estimatedDuration, 0);
      const stepElapsed = Math.max(0, elapsedTime - stepStartTime);
      const stepDuration = PROGRESS_STEPS[newStepIndex].estimatedDuration;
      const stepProg = Math.min((stepElapsed / stepDuration) * 100, 100);
      setStepProgress(stepProg);
      
      // If we've reached 95% progress, trigger completion
      if (overallProgress >= 95 && !hasCompleted) {
        hasCompleted = true;
        setProgress(100);
        setStepProgress(100);
        
        // Wait a moment before calling onComplete
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 500);
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [isGenerating, onComplete]);

  if (!isGenerating) return null;

  const currentStep = PROGRESS_STEPS[currentStepIndex];
  const CurrentStepIcon = currentStep?.icon || Loader2;

  return (
    <div className={`flex flex-col items-center justify-center ${isMobile ? 'p-6 min-h-screen' : 'p-8'} space-y-6`}>
      {/* Main Progress Circle */}
      <div className="relative">
        <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} rounded-full bg-primary/10 flex items-center justify-center`}>
          <div 
            className={`transition-transform duration-1000 ${isAnimating ? 'animate-spin' : ''}`}
            style={{ 
              animation: isAnimating ? 'spin 2s linear infinite' : 'none'
            }}
          >
            <CurrentStepIcon className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-primary`} />
          </div>
        </div>
        
        {/* Progress ring overlay */}
        <svg className={`absolute inset-0 ${isMobile ? 'w-16 h-16' : 'w-20 h-20'} transform -rotate-90`}>
          <circle
            cx={isMobile ? "32" : "40"}
            cy={isMobile ? "32" : "40"}
            r={isMobile ? "28" : "36"}
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            className="text-muted/20"
          />
          <circle
            cx={isMobile ? "32" : "40"}
            cy={isMobile ? "32" : "40"}
            r={isMobile ? "28" : "36"}
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * (isMobile ? 28 : 36)}`}
            strokeDashoffset={`${2 * Math.PI * (isMobile ? 28 : 36) * (1 - progress / 100)}`}
            className="text-primary transition-all duration-500 ease-out"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Current Step Info */}
      <div className="text-center space-y-2">
        <h3 
          key={currentStep?.id}
          className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-primary transition-opacity duration-300`}
        >
          {currentStep?.label || 'Processing...'}
        </h3>
        
        <p 
          key={`${currentStep?.id}-desc`}
          className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground ${isMobile ? 'max-w-xs' : 'max-w-xs'} transition-opacity duration-300`}
        >
          {currentStep?.description || 'Analyzing your text...'}
        </p>
      </div>

      {/* Overall Progress Bar */}
      <div className={`${isMobile ? 'w-full max-w-sm' : 'w-full max-w-md'} space-y-2`}>
        <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
          <span>Overall Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress 
          value={progress} 
          className="h-2"
        />
      </div>

      {/* Step Progress Bar */}
      <div className={`${isMobile ? 'w-full max-w-sm' : 'w-full max-w-md'} space-y-2`}>
        <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
          <span>Current Step</span>
          <span>{Math.round(stepProgress)}%</span>
        </div>
        <Progress 
          value={stepProgress} 
          className="h-1 bg-muted"
        />
      </div>

      {/* Steps Overview - Responsive Grid */}
      <div className={`${isMobile ? 'w-full max-w-sm' : 'w-full max-w-md'}`}>
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-4 gap-2'}`}>
          {PROGRESS_STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            
            return (
              <div
                key={step.id}
                className={`flex flex-col items-center ${isMobile ? 'p-3' : 'p-2'} rounded-lg text-center transition-all duration-300 ${
                  isCurrent ? 'scale-105' : 'scale-100'
                }`}
                style={{
                  opacity: isCompleted ? 1 : isCurrent ? 1 : 0.4
                }}
              >
                <div className={`${isMobile ? 'w-10 h-10' : 'w-8 h-8'} rounded-full flex items-center justify-center mb-1 transition-colors duration-300 ${
                  isCompleted 
                    ? 'bg-green-100 text-green-600' 
                    : isCurrent 
                    ? 'bg-primary/20 text-primary' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
                  ) : (
                    <StepIcon className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
                  )}
                </div>
                <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium transition-colors duration-300 ${
                  isCompleted 
                    ? 'text-green-600' 
                    : isCurrent 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}>
                  {isMobile ? step.label : step.label.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Estimated time remaining */}
      <div 
        className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground text-center transition-opacity duration-1000 delay-1000`}
        style={{ opacity: isAnimating ? 1 : 0 }}
      >
        This usually takes 10-15 seconds
      </div>
    </div>
  );
};

export default ReadingAnalysisProgress;
