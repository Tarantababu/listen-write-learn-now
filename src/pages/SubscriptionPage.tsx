
import React, { useEffect, useState } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check, X, CreditCard, Shield, CalendarClock, Award } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

const SubscriptionPage: React.FC = () => {
  const { subscription, checkSubscription, createCheckoutSession, openCustomerPortal } = useSubscription();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Check for URL query params
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const subscriptionStatus = queryParams.get('subscription');
    
    if (subscriptionStatus === 'success') {
      toast.success('Subscription activated successfully!');
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

  const handleSubscribe = async () => {
    setIsProcessing(true);
    try {
      const checkoutUrl = await createCheckoutSession();
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsProcessing(true);
    try {
      const portalUrl = await openCustomerPortal();
      if (portalUrl) {
        window.location.href = portalUrl;
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (subscription.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading subscription information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <CreditCard className="mr-2 h-6 w-6 text-primary" />
          Subscription Management
        </h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>

      <div className="space-y-8">
        {/* Current plan info */}
        <Card className="border-2 shadow-lg overflow-hidden relative">
          {subscription.isSubscribed && (
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 rounded-bl-md">
              <span className="flex items-center text-xs font-semibold">
                <Shield className="mr-1 h-3 w-3" /> ACTIVE
              </span>
            </div>
          )}
          
          <CardHeader>
            <CardTitle>
              {subscription.isSubscribed 
                ? 'Premium Plan' 
                : 'Free Plan'}
            </CardTitle>
            <CardDescription>
              {subscription.isSubscribed 
                ? subscription.subscriptionStatus === 'trialing' 
                  ? 'You are currently on a free trial' 
                  : 'You have access to all premium features'
                : 'Limited access to features'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {subscription.isSubscribed ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">$4.99 / month</h3>
                  <p className="text-sm text-muted-foreground">
                    {subscription.subscriptionStatus === 'trialing'
                      ? 'Your card will be charged after the trial ends'
                      : 'Monthly subscription'}
                  </p>
                </div>
                
                {subscription.subscriptionStatus === 'trialing' && subscription.trialEnd && (
                  <div className="flex items-start space-x-2 p-3 bg-muted/50 rounded-md">
                    <CalendarClock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Free Trial Period</p>
                      <p className="text-sm">
                        Your free trial ends {formatDistanceToNow(subscription.trialEnd, { addSuffix: true })}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {format(subscription.trialEnd, 'PPP')}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
                
                {subscription.subscriptionEnd && (
                  <div className="flex items-start space-x-2 p-3 bg-muted/50 rounded-md">
                    <CalendarClock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Next billing date</p>
                      <p className="text-sm">
                        {format(subscription.subscriptionEnd, 'PPP')}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2 pt-2">
                  <h4 className="font-medium flex items-center">
                    <Award className="mr-2 h-4 w-4 text-primary" />
                    Premium Features
                  </h4>
                  <ul className="space-y-1">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Unlimited exercises</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Text-to-speech for all exercises</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Advanced analytics</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>AI-powered vocabulary suggestions</span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Free</h3>
                  <p className="text-sm text-muted-foreground">
                    Limited access to features
                  </p>
                </div>
                
                <div className="space-y-2 pt-2">
                  <h4 className="font-medium">Features</h4>
                  <ul className="space-y-1">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>5 exercises</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Basic progress tracking</span>
                    </li>
                    <li className="flex items-center">
                      <X className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-muted-foreground">Text-to-speech</span>
                    </li>
                    <li className="flex items-center">
                      <X className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-muted-foreground">Advanced analytics</span>
                    </li>
                    <li className="flex items-center">
                      <X className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-muted-foreground">AI-powered vocabulary</span>
                    </li>
                  </ul>
                </div>
                
                <div className="flex items-start space-x-2 p-3 bg-primary/10 rounded-md">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Premium Plan - $4.99/mo</p>
                    <p className="text-sm">
                      Unlock all features with a 7-day free trial
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            {subscription.isSubscribed ? (
              <Button 
                onClick={handleManageSubscription} 
                variant="outline" 
                className="w-full"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Manage Subscription</>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleSubscribe}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Subscribe - 7-day free trial</>
                )}
              </Button>
            )}
            <Button
              onClick={checkSubscription}
              variant="ghost"
              className="w-full"
              disabled={subscription.isLoading}
            >
              {subscription.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>Refresh Status</>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Subscription info */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
            <CardDescription>
              Information about your current subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">
                    {subscription.isSubscribed ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-yellow-600">Free</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-medium capitalize">{subscription.subscriptionTier}</p>
                </div>
                {subscription.subscriptionStatus && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Subscription Status</p>
                    <p className="font-medium capitalize">{subscription.subscriptionStatus}</p>
                  </div>
                )}
                {subscription.lastChecked && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="text-sm">
                      {formatDistanceToNow(subscription.lastChecked, { addSuffix: true })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">What happens after my free trial?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                After your 7-day free trial ends, your subscription will automatically continue and you'll be charged $4.99 per month until you cancel.
              </p>
            </div>
            <div>
              <h4 className="font-medium">How do I cancel my subscription?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                You can cancel your subscription at any time by clicking the "Manage Subscription" button and using the Stripe customer portal. Your access will continue until the end of your current billing period.
              </p>
            </div>
            <div>
              <h4 className="font-medium">Will I lose my data if I cancel?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                No, your data will be preserved. However, some premium features will become unavailable.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionPage;
