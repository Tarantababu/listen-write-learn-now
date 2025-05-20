
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { OnboardingStep, OnboardingProgress, OnboardingContextType } from '@/types/onboarding';
import { toast } from 'sonner';

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress | null>(null);

  // Fetch onboarding steps and user progress
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchOnboardingData = async () => {
      setIsLoading(true);
      try {
        // Fetch onboarding steps using RPC functions
        const { data: stepsData, error: stepsError } = await supabase.rpc('get_onboarding_steps');

        if (stepsError) throw stepsError;
        
        if (stepsData) {
          // Parse the JSON result from the RPC function
          const parsedSteps = Array.isArray(stepsData) ? stepsData : 
                            (typeof stepsData === 'string' ? JSON.parse(stepsData) : []);
          setSteps(parsedSteps as OnboardingStep[]);
        }

        // Fetch user onboarding progress
        const { data: progressData, error: progressError } = await supabase.rpc(
          'get_user_onboarding_progress', 
          { user_id_param: user.id }
        );

        if (progressError && progressError.code !== 'PGRST116') {
          // PGRST116 is "row not found" error, which is expected if user has no progress yet
          throw progressError;
        }

        if (progressData) {
          // Parse the JSON result from the RPC function
          const parsedProgress = typeof progressData === 'string' ? 
                               JSON.parse(progressData) : progressData;
          
          setOnboardingProgress(parsedProgress as OnboardingProgress);
          setCurrentStepIndex(parsedProgress.last_step_seen || 0);
          
          // Check if onboarding should be active
          const isCompleted = parsedProgress.completed_onboarding;
          const isDismissed = parsedProgress.dismissed_until && 
                              new Date(parsedProgress.dismissed_until) > new Date();
          
          // Activate if not completed and not dismissed
          setIsActive(!isCompleted && !isDismissed);
        } else {
          // Create initial progress record for new users
          const { data: newProgress, error: createError } = await supabase.rpc(
            'create_onboarding_progress',
            { user_id_param: user.id }
          );

          if (createError) throw createError;
          
          if (newProgress) {
            const parsedNewProgress = typeof newProgress === 'string' ? 
                                   JSON.parse(newProgress) : newProgress;
            setOnboardingProgress(parsedNewProgress as OnboardingProgress);
            setIsActive(true); // Activate onboarding for new users
          }
        }
      } catch (error) {
        console.error('Error fetching onboarding data:', error);
        toast.error('Failed to load onboarding data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnboardingData();
  }, [user]);

  // Update user progress when navigating between steps
  const updateProgress = async (updates: Partial<OnboardingProgress>) => {
    if (!user || !onboardingProgress) return;

    try {
      const { error } = await supabase.rpc(
        'update_onboarding_progress',
        {
          user_id_param: user.id,
          updates_param: updates
        }
      );

      if (error) throw error;
      
      // Update local state
      setOnboardingProgress(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating onboarding progress:', error);
      toast.error('Failed to update onboarding progress');
    }
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const newIndex = currentStepIndex + 1;
      setCurrentStepIndex(newIndex);
      updateProgress({ last_step_seen: newIndex });
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      const newIndex = currentStepIndex - 1;
      setCurrentStepIndex(newIndex);
      updateProgress({ last_step_seen: newIndex });
    }
  };

  const goToStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
      updateProgress({ last_step_seen: index });
    }
  };

  const startOnboarding = () => {
    setIsActive(true);
    setCurrentStepIndex(0);
    updateProgress({ 
      last_step_seen: 0, 
      completed_onboarding: false,
      dismissed_until: null 
    });
  };

  const dismissOnboarding = (days = 7) => {
    const dismissDate = new Date();
    dismissDate.setDate(dismissDate.getDate() + days);
    
    setIsActive(false);
    updateProgress({ dismissed_until: dismissDate.toISOString() });
  };

  const completeOnboarding = () => {
    setIsActive(false);
    updateProgress({ completed_onboarding: true });
    toast.success('Onboarding completed! You can restart it anytime from Settings.');
  };

  const restartOnboarding = () => {
    startOnboarding();
    toast.success('Onboarding restarted!');
  };

  const value = {
    steps,
    currentStepIndex,
    isActive,
    isLoading,
    startOnboarding,
    dismissOnboarding,
    completeOnboarding,
    nextStep,
    prevStep,
    goToStep,
    restartOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
