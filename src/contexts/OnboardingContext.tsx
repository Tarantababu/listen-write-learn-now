
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
        // Fetch onboarding steps
        const { data: stepsData, error: stepsError } = await supabase
          .from('onboarding_steps')
          .select('*')
          .order('order_index', { ascending: true })
          .eq('is_active', true);

        if (stepsError) throw stepsError;
        
        if (stepsData) {
          setSteps(stepsData as OnboardingStep[]);
        }

        // Fetch user onboarding progress
        const { data: progressData, error: progressError } = await supabase
          .from('user_onboarding_progress')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (progressError && progressError.code !== 'PGRST116') {
          // PGRST116 is "row not found" error, which is expected if user has no progress yet
          throw progressError;
        }

        if (progressData) {
          setOnboardingProgress(progressData as OnboardingProgress);
          setCurrentStepIndex(progressData.last_step_seen || 0);
          
          // Check if onboarding should be active
          const isCompleted = progressData.completed_onboarding;
          const isDismissed = progressData.dismissed_until && 
                              new Date(progressData.dismissed_until) > new Date();
          
          // Activate if not completed and not dismissed
          setIsActive(!isCompleted && !isDismissed);
        } else {
          // Create initial progress record for new users
          const { data: newProgress, error: createError } = await supabase
            .from('user_onboarding_progress')
            .insert([
              { user_id: user.id, completed_onboarding: false, last_step_seen: 0 }
            ])
            .select()
            .single();

          if (createError) throw createError;
          
          if (newProgress) {
            setOnboardingProgress(newProgress as OnboardingProgress);
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
      const { error } = await supabase
        .from('user_onboarding_progress')
        .update(updates)
        .eq('user_id', user.id);

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
