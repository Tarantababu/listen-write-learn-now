
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_PLANS, AVAILABLE_CURRENCIES, DEFAULT_CURRENCY } from '@/lib/stripe';
import { useAdmin } from '@/hooks/use-admin';

interface SubscriptionState {
  isLoading: boolean;
  isSubscribed: boolean;
  subscriptionTier: string;
  subscriptionStatus: string | null;
  planType: string | null;
  trialEnd: Date | null;
  subscriptionEnd: Date | null;
  canceledAt: Date | null;
  lastChecked: Date | null;
  error: string | null;
}

interface SubscriptionContextProps {
  subscription: SubscriptionState;
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  checkSubscription: () => Promise<void>;
  createCheckoutSession: (planId: string) => Promise<string | null>;
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
  const { isAdmin } = useAdmin();
  const [subscription, setSubscription] = useState<SubscriptionState>({
    isLoading: true,
    isSubscribed: false,
    subscriptionTier: 'free',
    subscriptionStatus: null,
    planType: null,
    trialEnd: null,
    subscriptionEnd: null,
    canceledAt: null,
    lastChecked: null,
    error: null
  });
  
  const [portalSetupError, setPortalSetupError] = useState<PortalErrorResponse | null>(null);
  
  // Currency selection state
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    // Try to get from localStorage
    const saved = localStorage.getItem('preferred_currency');
    if (saved) return saved;
    
    // Try to detect from browser
    try {
      const browserLocale = navigator.language;
      if (browserLocale.includes('en-US')) return 'USD';
      if (browserLocale.includes('en-GB')) return 'GBP';
      if (browserLocale.includes('de') || browserLocale.includes('fr') || browserLocale.includes('it') || browserLocale.includes('es')) return 'EUR';
      if (browserLocale.includes('tr')) return 'TRY';
      if (browserLocale.includes('ja')) return 'JPY';
      if (browserLocale.includes('en-CA')) return 'CAD';
      if (browserLocale.includes('en-AU')) return 'AUD';
      if (browserLocale.includes('pt-BR')) return 'BRL';
      if (browserLocale.includes('es-MX')) return 'MXN';
      if (browserLocale.includes('hi') || browserLocale.includes('en-IN')) return 'INR';
    } catch (e) {
      console.error("Error detecting locale:", e);
    }
    
    // Default fallback
    return 'USD';
  });

  // Save currency preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('preferred_currency', selectedCurrency);
  }, [selectedCurrency]);

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
        planType: null,
        error: null
      }));
    }
  }, [user, isAdmin]); // Added isAdmin dependency

  // Check for URL query params
  useEffect(() => {
    const handleSubscriptionCallback = () => {
      const queryParams = new URLSearchParams(window.location.search);
      const subscriptionStatus = queryParams.get('subscription');
      const planType = queryParams.get('plan');
      
      if (subscriptionStatus === 'success') {
        toast.success('Subscription process completed successfully!');
        checkSubscription();
        
        // Clear the URL parameter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      } else if (subscriptionStatus === 'canceled') {
        toast.info('Subscription process was canceled');
        
        // Clear the URL parameter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    };

    handleSubscriptionCallback();
  }, []);

  // Auto-refresh subscription status
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        checkSubscription();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [user]);

  // Check subscription from Stripe
  const checkSubscription = async () => {
    if (!user) return;

    try {
      setSubscription(prev => ({ ...prev, isLoading: true, error: null }));

      // If user is admin, set them as premium without checking Stripe
      if (isAdmin) {
        setSubscription({
          isLoading: false,
          isSubscribed: true,
          subscriptionTier: 'premium',
          subscriptionStatus: 'active',
          planType: 'admin',
          trialEnd: null,
          subscriptionEnd: null,
          canceledAt: null,
          lastChecked: new Date(),
          error: null
        });
        
        console.log('Admin user detected, setting premium subscription');
        return;
      }

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
        planType: data?.plan_type,
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
        planType: data?.plan_type,
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
  const createCheckoutSession = async (planId: string): Promise<string | null> => {
    try {
      setSubscription(prev => ({ ...prev, error: null }));
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planId: planId,
          currency: selectedCurrency
        },
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
    subscription: isAdmin 
      ? {
          ...subscription,
          isSubscribed: true,
          subscriptionTier: 'premium',
          subscriptionStatus: 'active',
          planType: 'admin'
        } 
      : subscription,
    selectedCurrency,
    setSelectedCurrency,
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
