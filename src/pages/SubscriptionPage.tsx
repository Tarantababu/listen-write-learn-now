import React, { useEffect, useState } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check, X, CreditCard, Shield, CalendarClock, Award, AlertTriangle, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { trackButtonClick } from '@/utils/visitorTracking';

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

  // Show error state if there's an error checking subscription
  if (subscription.error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <CreditCard className="mr-2 h-6 w-6 text-primary" />
            Subscription Management
          </h1>
        </div>
        
        <Card className="border-2 shadow-lg overflow-hidden relative border-yellow-300/50 bg-yellow-50/20">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-700">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Subscription Status Unavailable
            </CardTitle>
            <CardDescription className="text-yellow-600">
              {subscription.error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We're currently experiencing issues with our subscription service. 
              This might be due to maintenance or temporary service disruption.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={checkSubscription} 
              variant="outline" 
              className="w-full"
              disabled={subscription.isLoading}
            >
              {subscription.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Trying again...
                </>
              ) : (
                <>Try Again</>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <div className="mt-6 text-sm text-muted-foreground">
          <p>If this problem persists, please contact support.</p>
        </div>
      </div>
    );
  }

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

  const isSubscriptionCanceled = subscription.canceledAt !== null || subscription.subscriptionStatus === 'canceled';
  const isSubscriptionActive = subscription.isSubscribed && !isSubscriptionCanceled;
  const hasRemainingAccess = isSubscriptionCanceled && subscription.subscriptionEnd && new Date(subscription.subscriptionEnd) > new Date();

  console.log('Subscription status display info:', {
    subscriptionStatus: subscription.subscriptionStatus,
    isSubscribed: subscription.isSubscribed,
    canceledAt: subscription.canceledAt,
    isSubscriptionCanceled,
    isSubscriptionActive,
    hasRemainingAccess
  });

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
          {subscription.isSubscribed && !isSubscriptionCanceled && (
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 rounded-bl-md">
              <span className="flex items-center text-xs font-semibold">
                <Shield className="mr-1 h-3 w-3" /> ACTIVE
              </span>
            </div>
          )}
          
          {isSubscriptionCanceled && hasRemainingAccess && (
            <div className="absolute top-0 right-0 bg-amber-500 text-white px-4 py-1 rounded-bl-md">
              <span className="flex items-center text-xs font-semibold">
                <Ban className="mr-1 h-3 w-3" /> CANCELED
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
              {isSubscriptionActive 
                ? subscription.subscriptionStatus === 'trialing' 
                  ? 'You are currently on a free trial' 
                  : 'You have access to all premium features'
                : isSubscriptionCanceled && hasRemainingAccess
                  ? 'Your subscription was canceled but access remains until the end of the billing period'
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
                      : isSubscriptionCanceled
                        ? 'Your subscription has been canceled'
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
                
                {isSubscriptionCanceled && subscription.canceledAt && (
                  <div className="flex items-start space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
                    <Ban className="h-5 w-5 text-amber-500 dark:text-amber-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-700 dark:text-amber-400">Subscription Canceled</p>
                      <p className="text-sm dark:text-amber-300/80">
                        Canceled on {format(subscription.canceledAt, 'PPP')}
                      </p>
                    </div>
                  </div>
                )}
                
                {subscription.subscriptionEnd && (
                  <div className="flex items-start space-x-2 p-3 bg-muted/50 rounded-md">
                    <CalendarClock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">
                        {isSubscriptionCanceled 
                          ? 'Access ends on' 
                          : 'Next billing date'}
                      </p>
                      <p className="text-sm">
                        {format(subscription.subscriptionEnd, 'PPP')}
                        {isSubscriptionCanceled && (
                          <span className="block text-xs text-muted-foreground mt-1">
                            You will have premium access until this date
                          </span>
                        )}
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
                      <span>Unlimited Exercises</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Progress Tracking</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>AI created Text-to-Speech</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>AI powered vocabulary</span>
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
                      <span>3 exercises</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>5 vocabulary</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Progress Tracking</span>
                    </li>
                    <li className="flex items-center">
                      <X className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-muted-foreground">AI created Text-to-Speech</span>
                    </li>
                    <li className="flex items-center">
                      <X className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-muted-foreground">AI powered vocabulary</span>
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
                  <>{isSubscriptionCanceled ? 'Reactivate Subscription' : 'Manage Subscription'}</>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  trackButtonClick('subscribe');
                  handleSubscribe();
                }}
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
                    {isSubscriptionActive ? (
                      <span className="text-green-600">Active</span>
                    ) : isSubscriptionCanceled && hasRemainingAccess ? (
                      <span className="text-amber-600">Canceled - Access Until {format(subscription.subscriptionEnd!, 'MMM d')}</span>
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
                    <p className="font-medium capitalize">
                      {subscription.subscriptionStatus}
                      {isSubscriptionCanceled && hasRemainingAccess && (
                        <span className="text-sm text-muted-foreground ml-2">
                          (Premium access until {format(subscription.subscriptionEnd!, 'MMM d')})
                        </span>
                      )}
                    </p>
                  </div>
                )}
                {subscription.canceledAt && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Canceled On</p>
                    <p className="font-medium">{format(subscription.canceledAt, 'PPP')}</p>
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
