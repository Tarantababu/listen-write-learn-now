
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';

interface MobileReadingNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLastStep: boolean;
}

export const MobileReadingNavigation: React.FC<MobileReadingNavigationProps> = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onComplete,
  canGoNext,
  canGoPrevious,
  isLastStep
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 safe-area-bottom">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="flex-1 min-h-[48px] touch-manipulation"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Previous
        </Button>
        
        <div className="flex flex-col items-center min-w-[80px]">
          <span className="text-sm font-medium">{currentStep}</span>
          <span className="text-xs text-muted-foreground">of {totalSteps}</span>
        </div>
        
        {isLastStep ? (
          <Button
            size="lg"
            onClick={onComplete}
            className="flex-1 min-h-[48px] touch-manipulation bg-primary"
          >
            <SkipForward className="h-5 w-5 mr-2" />
            Continue
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={onNext}
            disabled={!canGoNext}
            className="flex-1 min-h-[48px] touch-manipulation"
          >
            Next
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};
