
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target_element: string;
  position: 'top' | 'right' | 'bottom' | 'left' | 'center';
  order_index: number;
  is_active: boolean;
  feature_area: string;
}

export interface OnboardingProgress {
  id: string;
  user_id: string;
  completed_onboarding: boolean;
  last_step_seen: number;
  dismissed_until: string | null;
}

interface OnboardingContextType {
  isOnboardingActive: boolean;
  currentStepIndex: number;
  steps: OnboardingStep[];
  progress: OnboardingProgress | null;
  isLoading: boolean;
  startOnboarding: () => void;
  stopOnboarding: () => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (index: number) => void;
  dismissOnboarding: (days?: number) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  restartOnboarding: () => Promise<void>;
  currentStep: OnboardingStep | null;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export const OnboardingProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { user } = useAuth();
  const [isOnboardingActive, setIsOnboardingActive] = useState<boolean>(false);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Get current step
  const currentStep = steps.length > 0 && currentStepIndex < steps.length 
    ? steps[currentStepIndex] 
    : null;

  // Load onboarding steps and user progress
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadOnboarding = async () => {
      setIsLoading(true);
      try {
        // Fetch active onboarding steps using direct SQL query
        const { data: stepsData, error: stepsError } = await supabase
          .from('onboarding_steps')
          .select('*')
          .order('order_index', { ascending: true });

        if (stepsError) throw stepsError;
        setSteps(stepsData as OnboardingStep[] || []);

        // Fetch user progress using direct SQL query
        const { data: progressData, error: progressError } = await supabase
          .from('user_onboarding_progress')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (progressError && progressError.code !== 'PGRST116') {
          throw progressError;
        }

        if (progressData) {
          setProgress(progressData as OnboardingProgress);
          setCurrentStepIndex(progressData.last_step_seen);

          // Check if we should show onboarding
          const shouldShowOnboarding = !progressData.completed_onboarding && 
            (!progressData.dismissed_until || new Date(progressData.dismissed_until) < new Date());
          
          // Auto-start for first-time users who haven't completed onboarding
          if (shouldShowOnboarding && progressData.last_step_seen === 0) {
            setIsOnboardingActive(true);
          }
        } else {
          // Create a new progress record if none exists
          const { data: newProgress, error: createError } = await supabase
            .from('user_onboarding_progress')
            .insert([{ user_id: user.id }])
            .select()
            .single();

          if (createError) throw createError;
          setProgress(newProgress as OnboardingProgress);
        }
      } catch (error) {
        console.error('Error loading onboarding:', error);
        toast.error('Failed to load onboarding experience');
      } finally {
        setIsLoading(false);
      }
    };

    loadOnboarding();
  }, [user]);

  // Update user's progress in the database
  const updateProgress = async (updates: Partial<OnboardingProgress>) => {
    if (!user || !progress) return;

    try {
      const { error } = await supabase
        .from('user_onboarding_progress')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setProgress((prev) => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating onboarding progress:', error);
      toast.error('Failed to update onboarding progress');
    }
  };

  // Start the onboarding tour
  const startOnboarding = () => {
    setIsOnboardingActive(true);
  };

  // Stop the onboarding tour without saving
  const stopOnboarding = () => {
    setIsOnboardingActive(false);
  };

  // Navigate to the next step
  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const newIndex = currentStepIndex + 1;
      setCurrentStepIndex(newIndex);
      updateProgress({ last_step_seen: newIndex });
    } else {
      completeOnboarding();
    }
  };

  // Navigate to the previous step
  const previousStep = () => {
    if (currentStepIndex > 0) {
      const newIndex = currentStepIndex - 1;
      setCurrentStepIndex(newIndex);
      updateProgress({ last_step_seen: newIndex });
    }
  };

  // Go to a specific step
  const goToStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
      updateProgress({ last_step_seen: index });
    }
  };

  // Dismiss onboarding for a number of days
  const dismissOnboarding = async (days = 7) => {
    const dismissedUntil = new Date();
    dismissedUntil.setDate(dismissedUntil.getDate() + days);
    
    await updateProgress({ dismissed_until: dismissedUntil.toISOString() });
    setIsOnboardingActive(false);
  };

  // Mark onboarding as complete
  const completeOnboarding = async () => {
    await updateProgress({ completed_onboarding: true });
    setIsOnboardingActive(false);
    toast.success('Onboarding completed! You can restart it anytime from Settings.');
  };

  // Restart the onboarding from the beginning
  const restartOnboarding = async () => {
    await updateProgress({ 
      completed_onboarding: false,
      last_step_seen: 0,
      dismissed_until: null
    });
    setCurrentStepIndex(0);
    setIsOnboardingActive(true);
  };

  const value = {
    isOnboardingActive,
    currentStepIndex,
    steps,
    progress,
    isLoading,
    startOnboarding,
    stopOnboarding,
    nextStep,
    previousStep,
    goToStep,
    dismissOnboarding,
    completeOnboarding,
    restartOnboarding,
    currentStep
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
