
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SubscriptionState {
  isLoading: boolean;
  isSubscribed: boolean;
  subscriptionTier: string;
  subscriptionStatus: string | null;
  trialEnd: Date | null;
  subscriptionEnd: Date | null;
  canceledAt: Date | null;
  lastChecked: Date | null;
  error: string | null;
}

interface SubscriptionContextProps {
  subscription: SubscriptionState;
  checkSubscription: () => Promise<void>;
  createCheckoutSession: (currency?: string) => Promise<string | null>;
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

// Interface for portal error response
interface PortalErrorResponse {
  error: string;
  details?: string;
  setupUrl?: string;
}

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionState>({
    isLoading: true,
    isSubscribed: false,
    subscriptionTier: 'free',
    subscriptionStatus: null,
    trialEnd: null,
    subscriptionEnd: null,
    canceledAt: null,
    lastChecked: null,
    error: null
  });
  
  const [portalSetupError, setPortalSetupError] = useState<PortalErrorResponse | null>(null);

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
        error: null
      }));
    }
  }, [user]);

  // Check subscription from Stripe
  const checkSubscription = async () => {
    if (!user) return;

    try {
      setSubscription(prev => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        console.error('Error checking subscription:', error);
        setSubscription(prev => ({ 
          ...prev, 
          isLoading: false,
          error: 'Failed to check subscription status. Please try again later.'
        }));
        return;
      }

      console.log('Raw subscription data:', data);

      setSubscription({
        isLoading: false,
        isSubscribed: data?.subscribed || false,
        subscriptionTier: data?.subscription_tier || 'free',
        subscriptionStatus: data?.subscription_status,
        trialEnd: data?.trial_end ? new Date(data?.trial_end) : null,
        subscriptionEnd: data?.subscription_end ? new Date(data?.subscription_end) : null,
        canceledAt: data?.canceled_at ? new Date(data?.canceled_at) : null,
        lastChecked: new Date(),
        error: null
      });

      console.log('Subscription checked:', {
        subscribed: data?.subscribed,
        tier: data?.subscription_tier,
        status: data?.subscription_status,
        canceledAt: data?.canceled_at ? new Date(data?.canceled_at) : 'not canceled'
      });
    } catch (error) {
      console.error('Error in subscription check:', error);
      setSubscription(prev => ({ 
        ...prev, 
        isLoading: false,
        error: 'Failed to check subscription status. Please try again later.'
      }));
    }
  };

  // Create a Stripe checkout session
  const createCheckoutSession = async (currency?: string): Promise<string | null> => {
    try {
      setSubscription(prev => ({ ...prev, error: null }));
      
      const payload = currency ? { currency } : {};
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: payload
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        toast.error('Failed to create checkout session');
        setSubscription(prev => ({ 
          ...prev, 
          error: 'Failed to create checkout session. Please try again later.'
        }));
        return null;
      }

      return data.url;
    } catch (error) {
      console.error('Error in checkout process:', error);
      toast.error('Failed to create checkout session');
      setSubscription(prev => ({ 
        ...prev, 
        error: 'Failed to create checkout session. Please try again later.'
      }));
      return null;
    }
  };

  // Open Stripe customer portal
  const openCustomerPortal = async (): Promise<string | null> => {
    try {
      setSubscription(prev => ({ ...prev, error: null }));
      setPortalSetupError(null);
      
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) {
        console.error('Error opening customer portal:', error);
        toast.error('Failed to open subscription management portal');
        setSubscription(prev => ({ 
          ...prev, 
          error: 'Failed to open customer portal. Please try again later.'
        }));
        return null;
      }
      
      // Check if there's a portal setup error response
      if (data && data.error && data.error === 'Stripe Customer Portal not configured') {
        console.log('Stripe Customer Portal needs setup:', data);
        setPortalSetupError(data as PortalErrorResponse);
        toast.error('Stripe Customer Portal needs configuration');
        return null;
      }

      return data.url;
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open subscription management portal');
      setSubscription(prev => ({ 
        ...prev, 
        error: 'Failed to open customer portal. Please try again later.'
      }));
      return null;
    }
  };

  // Close portal setup error dialog
  const closePortalSetupError = () => {
    setPortalSetupError(null);
  };

  const value = {
    subscription,
    checkSubscription,
    createCheckoutSession,
    openCustomerPortal,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
      
      {/* Portal Setup Error Dialog */}
      <Dialog open={portalSetupError !== null} onOpenChange={closePortalSetupError}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stripe Customer Portal Setup Required</DialogTitle>
            <DialogDescription>
              Your Stripe account requires additional configuration before the Customer Portal can be used.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              {portalSetupError?.details || 
                'The Stripe Customer Portal needs to be configured in the Stripe Dashboard first.'}
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="text-sm text-amber-800">
                Admin action required: Go to the Stripe Dashboard and configure your Customer Portal settings.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            {portalSetupError?.setupUrl && (
              <Button 
                onClick={() => window.open(portalSetupError.setupUrl, '_blank')}
                className="bg-primary"
              >
                Open Stripe Dashboard
              </Button>
            )}
            <Button variant="outline" onClick={closePortalSetupError}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SubscriptionContext.Provider>
  );
};
