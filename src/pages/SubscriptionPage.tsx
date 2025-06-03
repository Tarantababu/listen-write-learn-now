
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Loader2, Star, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';
import { SUBSCRIPTION_PLANS, formatPrice, convertPrice } from '@/lib/stripe';
import { PromoCodeInput } from '@/components/PromoCodeInput';

const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { 
    subscribed, 
    subscriptionTier, 
    checkSubscription, 
    selectedCurrency,
    setCurrency 
  } = useSubscription();
  
  const [loading, setLoading] = useState<string | null>(null);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number | null>(null);
  const [discountType, setDiscountType] = useState<'amount' | 'percent' | null>(null);

  useEffect(() => {
    const subscription = searchParams.get('subscription');
    const plan = searchParams.get('plan');
    
    if (subscription === 'success') {
      toast.success(`Successfully subscribed to ${plan || 'premium'}!`);
      setTimeout(() => {
        checkSubscription();
      }, 2000);
    } else if (subscription === 'canceled') {
      toast.error('Subscription canceled');
    }
  }, [searchParams, checkSubscription]);

  const handlePromoCodeApplied = (code: string, amount: number, type: 'amount' | 'percent' = 'amount') => {
    setAppliedPromoCode(code);
    setDiscountAmount(amount);
    setDiscountType(type);
    toast.success(`Promo code "${code}" applied successfully!`);
  };

  const handlePromoCodeRemoved = () => {
    setAppliedPromoCode(null);
    setDiscountAmount(null);
    setDiscountType(null);
  };

  const calculateDiscountedPrice = (originalPrice: number) => {
    if (!discountAmount || !discountType) return originalPrice;
    
    if (discountType === 'amount') {
      return Math.max(0, originalPrice - (discountAmount / 100));
    } else {
      return originalPrice * (1 - discountAmount / 100);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(planId);
    
    try {
      const requestBody: any = {
        planId,
        currency: selectedCurrency,
      };

      // Add promo code if applied
      if (appliedPromoCode) {
        requestBody.promoCode = appliedPromoCode;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: requestBody
      });

      if (error) throw error;

      // Track promo code usage if applied
      if (appliedPromoCode && user.email) {
        await supabase.from('promo_code_usage').insert({
          user_id: user.id,
          email: user.email,
          promo_code: appliedPromoCode,
          discount_amount: discountAmount,
        });
      }

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to start subscription process');
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading('manage');
    
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open subscription management');
    } finally {
      setLoading(null);
    }
  };

  const isCurrentPlan = (planId: string) => {
    if (!subscribed) return false;
    
    const tierMap = {
      'monthly': 'Premium',
      'quarterly': 'Premium', 
      'annual': 'Premium',
      'lifetime': 'Lifetime'
    };
    
    return subscriptionTier === tierMap[planId as keyof typeof tierMap];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Choose Your Plan</h1>
          <p className="text-muted-foreground">
            Unlock unlimited learning with our premium features
          </p>
        </div>
      </div>

      {/* Promo Code Input */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Have a promo code?</CardTitle>
          <CardDescription>
            Enter your promo code below to get a discount on your subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PromoCodeInput
            onCodeApplied={(code, amount) => handlePromoCodeApplied(code, amount, 'percent')}
            onCodeRemoved={handlePromoCodeRemoved}
            appliedCode={appliedPromoCode || undefined}
            discountAmount={discountAmount || undefined}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => {
          const convertedPrice = convertPrice(plan.price, selectedCurrency);
          const discountedPrice = calculateDiscountedPrice(convertedPrice);
          const isCurrentUserPlan = isCurrentPlan(planId);
          const isLifetime = planId === 'lifetime';
          
          return (
            <Card 
              key={planId} 
              className={`relative ${isCurrentUserPlan ? 'ring-2 ring-primary' : ''}`}
            >
              {isCurrentUserPlan && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Your Plan
                  </Badge>
                </div>
              )}
              
              {plan.savePercent > 0 && (
                <div className="absolute -top-2 -right-2">
                  <Badge variant="destructive" className="rounded-full">
                    Save {plan.savePercent}%
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <div className="text-2xl mb-2">{plan.emoji}</div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">
                  {plan.tagline}
                </CardDescription>
                
                <div className="py-4">
                  <div className="flex items-baseline justify-center">
                    {appliedPromoCode && discountedPrice !== convertedPrice ? (
                      <>
                        <span className="text-2xl font-bold text-muted-foreground line-through">
                          {formatPrice(convertedPrice, selectedCurrency)}
                        </span>
                        <span className="text-3xl font-bold ml-2">
                          {formatPrice(discountedPrice, selectedCurrency)}
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold">
                        {formatPrice(convertedPrice, selectedCurrency)}
                      </span>
                    )}
                  </div>
                  {!isLifetime && (
                    <p className="text-sm text-muted-foreground">
                      per {plan.billing}
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentUserPlan ? (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={handleManageSubscription}
                    disabled={loading === 'manage'}
                  >
                    {loading === 'manage' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Manage Subscription'
                    )}
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handleSubscribe(planId)}
                    disabled={loading === planId}
                  >
                    {loading === planId ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Crown className="mr-2 h-4 w-4" />
                        {isLifetime ? 'Buy Now' : `Start ${plan.trialDays}-Day Trial`}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>All plans include a 30-day money-back guarantee</p>
        <p>Cancel anytime • Secure payments by Stripe</p>
      </div>
    </div>
  );
};

export default SubscriptionPage;
