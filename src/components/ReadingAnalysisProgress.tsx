
import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2, BookOpen, Brain, Lightbulb, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  useEffect(() => {
    if (!isGenerating) {
      setCurrentStepIndex(0);
      setProgress(0);
      setStepProgress(0);
      return;
    }

    const totalDuration = PROGRESS_STEPS.reduce((acc, step) => acc + step.estimatedDuration, 0);
    let elapsedTime = 0;

    const interval = setInterval(() => {
      elapsedTime += 0.1;
      
      // Calculate which step we should be on
      let cumulativeTime = 0;
      let newStepIndex = 0;
      
      for (let i = 0; i < PROGRESS_STEPS.length; i++) {
        if (elapsedTime <= cumulativeTime + PROGRESS_STEPS[i].estimatedDuration) {
          newStepIndex = i;
          break;
        }
        cumulativeTime += PROGRESS_STEPS[i].estimatedDuration;
        newStepIndex = i + 1;
      }
      
      // Update current step if it changed
      if (newStepIndex !== currentStepIndex && newStepIndex < PROGRESS_STEPS.length) {
        setCurrentStepIndex(newStepIndex);
      }
      
      // Calculate overall progress
      const overallProgress = Math.min((elapsedTime / totalDuration) * 100, 95);
      setProgress(overallProgress);
      
      // Calculate step progress
      if (newStepIndex < PROGRESS_STEPS.length) {
        const stepStartTime = PROGRESS_STEPS.slice(0, newStepIndex).reduce((acc, step) => acc + step.estimatedDuration, 0);
        const stepElapsed = elapsedTime - stepStartTime;
        const stepDuration = PROGRESS_STEPS[newStepIndex].estimatedDuration;
        const stepProg = Math.min((stepElapsed / stepDuration) * 100, 100);
        setStepProgress(stepProg);
      }
      
      // If we've completed all steps, stop the interval
      if (overallProgress >= 95) {
        clearInterval(interval);
        if (onComplete) {
          onComplete();
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isGenerating, currentStepIndex, onComplete]);

  if (!isGenerating) return null;

  const currentStep = PROGRESS_STEPS[currentStepIndex];
  const CurrentStepIcon = currentStep?.icon || Loader2;

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      {/* Main Progress Circle */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <CurrentStepIcon className="h-8 w-8 text-primary" />
          </motion.div>
        </div>
        
        {/* Progress ring overlay */}
        <svg className="absolute inset-0 w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            className="text-muted/20"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 36}`}
            strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
            className="text-primary transition-all duration-300"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Current Step Info */}
      <div className="text-center space-y-2">
        <motion.h3 
          key={currentStep?.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-semibold text-primary"
        >
          {currentStep?.label || 'Processing...'}
        </motion.h3>
        
        <motion.p 
          key={`${currentStep?.id}-desc`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground max-w-xs"
        >
          {currentStep?.description || 'Analyzing your text...'}
        </motion.p>
      </div>

      {/* Overall Progress Bar */}
      <div className="w-full max-w-md space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Overall Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress 
          value={progress} 
          className="h-2"
          indicatorClassName="transition-all duration-300"
        />
      </div>

      {/* Step Progress Bar */}
      <div className="w-full max-w-md space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Current Step</span>
          <span>{Math.round(stepProgress)}%</span>
        </div>
        <Progress 
          value={stepProgress} 
          className="h-1"
          indicatorClassName="bg-primary/60 transition-all duration-300"
        />
      </div>

      {/* Steps Overview */}
      <div className="w-full max-w-md">
        <div className="grid grid-cols-4 gap-2">
          {PROGRESS_STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isUpcoming = index > currentStepIndex;
            
            return (
              <motion.div
                key={step.id}
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ 
                  scale: isCurrent ? 1.1 : 1,
                  opacity: isCompleted ? 1 : isCurrent ? 1 : 0.4
                }}
                className="flex flex-col items-center p-2 rounded-lg text-center"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors ${
                  isCompleted 
                    ? 'bg-green-100 text-green-600' 
                    : isCurrent 
                    ? 'bg-primary/20 text-primary' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  isCompleted 
                    ? 'text-green-600' 
                    : isCurrent 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}>
                  {step.label.split(' ')[0]}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Estimated time remaining */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-xs text-muted-foreground text-center"
      >
        This usually takes 10-15 seconds
      </motion.div>
    </div>
  );
};

export default ReadingAnalysisProgress;
