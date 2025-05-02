
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SubscriptionState {
  isLoading: boolean;
  isSubscribed: boolean;
  subscriptionTier: string;
  subscriptionStatus: string | null;
  trialEnd: Date | null;
  subscriptionEnd: Date | null;
  lastChecked: Date | null;
}

interface SubscriptionContextProps {
  subscription: SubscriptionState;
  checkSubscription: () => Promise<void>;
  createCheckoutSession: () => Promise<string | null>;
  openCustomerPortal: () => Promise<string | null>;
}

const SubscriptionContext = createContext<SubscriptionContextProps | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionState>({
    isLoading: true,
    isSubscribed: false,
    subscriptionTier: 'free',
    subscriptionStatus: null,
    trialEnd: null,
    subscriptionEnd: null,
    lastChecked: null,
  });

  // Check subscription status when user changes
  useEffect(() => {
    if (user) {
      checkSubscription();
    } else {
      setSubscription(prev => ({
        ...prev,
        isLoading: false,
        isSubscribed: false,
        subscriptionTier: 'free',
        subscriptionStatus: null,
      }));
    }
  }, [user]);

  // Check subscription from Stripe
  const checkSubscription = async () => {
    if (!user) return;

    try {
      setSubscription(prev => ({ ...prev, isLoading: true }));

      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        console.error('Error checking subscription:', error);
        toast.error('Failed to check subscription status');
        return;
      }

      setSubscription({
        isLoading: false,
        isSubscribed: data.subscribed || false,
        subscriptionTier: data.subscription_tier || 'free',
        subscriptionStatus: data.subscription_status,
        trialEnd: data.trial_end ? new Date(data.trial_end) : null,
        subscriptionEnd: data.subscription_end ? new Date(data.subscription_end) : null,
        lastChecked: new Date(),
      });

      console.log('Subscription checked:', data);
    } catch (error) {
      console.error('Error in subscription check:', error);
      setSubscription(prev => ({ ...prev, isLoading: false }));
      toast.error('Failed to check subscription status');
    }
  };

  // Create a Stripe checkout session
  const createCheckoutSession = async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');

      if (error) {
        console.error('Error creating checkout session:', error);
        toast.error('Failed to create checkout session');
        return null;
      }

      return data.url;
    } catch (error) {
      console.error('Error in checkout process:', error);
      toast.error('Failed to create checkout session');
      return null;
    }
  };

  // Open Stripe customer portal
  const openCustomerPortal = async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) {
        console.error('Error opening customer portal:', error);
        toast.error('Failed to open subscription management portal');
        return null;
      }

      return data.url;
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open subscription management portal');
      return null;
    }
  };

  const value = {
    subscription,
    checkSubscription,
    createCheckoutSession,
    openCustomerPortal,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};
