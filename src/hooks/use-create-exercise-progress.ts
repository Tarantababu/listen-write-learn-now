
import { useState, useCallback, useRef } from 'react';
import type { CreateExerciseStep } from '@/components/bidirectional/CreateExerciseProgress';

interface UseCreateExerciseProgressOptions {
  onComplete?: () => void;
  onError?: (error: Error, step: string) => void;
  onCancel?: () => void;
}

export const useCreateExerciseProgress = (options: UseCreateExerciseProgressOptions = {}) => {
  const [steps, setSteps] = useState<CreateExerciseStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const intervalRef = useRef<number | null>(null);
  const stepStartTimes = useRef<Record<string, number>>({});

  const initializeSteps = useCallback((stepDefinitions: Omit<CreateExerciseStep, 'status'>[]) => {
    const initialSteps: CreateExerciseStep[] = stepDefinitions.map(step => ({
      ...step,
      status: 'pending'
    }));
    
    setSteps(initialSteps);
    setCurrentStepIndex(0);
    setIsActive(true);
    setStartTime(Date.now());
    setElapsedTime(0);
    
    // Start timer
    intervalRef.current = window.setInterval(() => {
      if (startTime) {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }
    }, 1000);
  }, [startTime]);

  const startStep = useCallback((stepId: string) => {
    stepStartTimes.current[stepId] = Date.now();
    
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status: 'in-progress' }
        : step
    ));
    
    const stepIndex = steps.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      setCurrentStepIndex(stepIndex);
    }
  }, [steps]);

  const completeStep = useCallback((stepId: string) => {
    const startTime = stepStartTimes.current[stepId];
    const actualTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : undefined;
    
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status: 'completed', actualTime }
        : step
    ));
  }, []);

  const errorStep = useCallback((stepId: string, error: Error) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status: 'error' }
        : step
    ));
    
    options.onError?.(error, stepId);
  }, [options]);

  const completeAll = useCallback(() => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    options.onComplete?.();
  }, [options]);

  const cancel = useCallback(() => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    options.onCancel?.();
  }, [options]);

  const reset = useCallback(() => {
    setSteps([]);
    setCurrentStepIndex(0);
    setIsActive(false);
    setStartTime(null);
    setElapsedTime(0);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Calculate overall progress
  const overallProgress = steps.length > 0 
    ? (steps.filter(step => step.status === 'completed').length / steps.length) * 100
    : 0;

  // Calculate total estimated time
  const totalEstimatedTime = steps.reduce((total, step) => 
    total + (step.estimatedTime || 0), 0
  );

  return {
    steps,
    currentStepIndex,
    isActive,
    elapsedTime,
    overallProgress,
    totalEstimatedTime,
    initializeSteps,
    startStep,
    completeStep,
    errorStep,
    completeAll,
    cancel,
    reset
  };
};
