
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target_element: string;
  position: string;
  order_index: number;
  is_active: boolean;
  feature_area: string;
  created_at?: string;
  updated_at?: string;
}

export interface OnboardingProgress {
  id: string;
  user_id: string;
  completed_onboarding: boolean;
  last_step_seen: number;
  dismissed_until: string | null;
  created_at?: string;
  updated_at?: string;
}

export type OnboardingContextType = {
  steps: OnboardingStep[];
  currentStepIndex: number;
  isActive: boolean;
  isLoading: boolean;
  startOnboarding: () => void;
  dismissOnboarding: (days?: number) => void;
  completeOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  restartOnboarding: () => void;
};
