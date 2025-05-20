
import React, { useEffect, useState } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Portal } from '@/components/ui/portal';

interface SpotlightProps {
  targetElement: string;
  position: 'top' | 'right' | 'bottom' | 'left' | 'center';
  children: React.ReactNode; // Added children prop to the interface
}

const OnboardingSpotlight: React.FC<SpotlightProps> = ({ targetElement, position, children }) => {
  const [coords, setCoords] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
  });

  useEffect(() => {
    const updatePosition = () => {
      if (targetElement === 'body' || !targetElement) {
        // Center on screen for intro/final steps
        const width = 300;
        const height = 200;
        setCoords({
          left: (window.innerWidth - width) / 2,
          top: (window.innerHeight - height) / 2,
          width,
          height,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
        });
        return;
      }

      const element = document.querySelector(targetElement);
      if (element) {
        const rect = element.getBoundingClientRect();
        const padding = 8; // Add some padding around the element
        
        setCoords({
          left: rect.left - padding,
          top: rect.top - padding,
          width: rect.width + (padding * 2),
          height: rect.height + (padding * 2),
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    
    // Re-calculate position every 500ms in case elements move in the DOM
    const interval = setInterval(updatePosition, 500);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      clearInterval(interval);
    };
  }, [targetElement]);

  // Calculate the tooltip position based on the target element and requested position
  const getTooltipStyle = () => {
    if (targetElement === 'body' || !targetElement || position === 'center') {
      // Center tooltip for intro/final steps
      return {
        left: coords.left,
        top: coords.top + coords.height + 20,
        transform: 'translateX(0)',
      };
    }

    const spacing = 12; // Space between target and tooltip
    
    switch (position) {
      case 'top':
        return {
          left: coords.left + (coords.width / 2),
          top: coords.top - spacing,
          transform: 'translate(-50%, -100%)',
        };
      case 'right':
        return {
          left: coords.left + coords.width + spacing,
          top: coords.top + (coords.height / 2),
          transform: 'translateY(-50%)',
        };
      case 'bottom':
        return {
          left: coords.left + (coords.width / 2),
          top: coords.top + coords.height + spacing,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          left: coords.left - spacing,
          top: coords.top + (coords.height / 2),
          transform: 'translate(-100%, -50%)',
        };
      default:
        return {
          left: coords.left + (coords.width / 2),
          top: coords.top + coords.height + spacing,
          transform: 'translateX(-50%)',
        };
    }
  };

  const tooltipStyle = getTooltipStyle();

  // Add arrow class based on position
  const getArrowClass = () => {
    if (targetElement === 'body' || position === 'center') return '';
    
    return `onboarding-tooltip-arrow-${position}`;
  };

  return (
    <>
      {/* Semi-transparent overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999]">
        {/* Cut out "spotlight" for the target element */}
        <div 
          className="absolute bg-transparent box-border"
          style={{
            left: coords.left,
            top: coords.top,
            width: coords.width,
            height: coords.height,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
            borderRadius: '4px',
            zIndex: 1000,
          }}
        />
      </div>

      {/* Tooltip that follows the target */}
      <div 
        className={`absolute z-[1001] bg-background border rounded-lg shadow-lg p-4 w-80 ${getArrowClass()}`}
        style={{
          left: tooltipStyle.left,
          top: tooltipStyle.top,
          transform: tooltipStyle.transform,
        }}
      >
        {children}
      </div>
    </>
  );
};

export const OnboardingTour: React.FC = () => {
  const { 
    isOnboardingActive, 
    currentStep, 
    nextStep, 
    previousStep,
    steps,
    currentStepIndex,
    dismissOnboarding,
    completeOnboarding,
  } = useOnboarding();

  if (!isOnboardingActive || !currentStep) return null;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  
  const handleFinish = () => {
    completeOnboarding();
  };

  const handleSkip = () => {
    dismissOnboarding(30);
  };

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[999] pointer-events-auto"
        >
          <OnboardingSpotlight
            targetElement={currentStep.target_element}
            position={currentStep.position}
          >
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{currentStep.title}</h3>
                <Button variant="ghost" size="icon" onClick={handleSkip}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
              
              <p className="text-muted-foreground">{currentStep.description}</p>
              
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center space-x-1">
                  {/* Step indicators */}
                  {steps.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 w-1.5 rounded-full ${i === currentStepIndex ? 'bg-primary w-3' : 'bg-muted-foreground'}`}
                    />
                  ))}
                </div>
                <div className="flex space-x-2">
                  {!isFirstStep && (
                    <Button variant="outline" size="sm" onClick={previousStep}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                  )}
                  {isLastStep ? (
                    <Button onClick={handleFinish} size="sm">
                      Finish
                    </Button>
                  ) : (
                    <Button onClick={nextStep} size="sm">
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </OnboardingSpotlight>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
};
