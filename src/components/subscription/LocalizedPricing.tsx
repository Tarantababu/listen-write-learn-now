
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { CURRENCIES, SupportedCurrency, DEFAULT_CURRENCY, getCurrencyFromLocale, formatAmount, convertPrice } from '@/lib/currency';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PricingTierProps {
  name: string;
  price: number;
  currency: SupportedCurrency;
  interval: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  onSelectPlan: () => void;
  isLoading?: boolean;
  isCurrentPlan?: boolean;
}

const PricingTier: React.FC<PricingTierProps> = ({
  name,
  price,
  currency,
  interval,
  description,
  features,
  isPopular = false,
  onSelectPlan,
  isLoading = false,
  isCurrentPlan = false
}) => {
  return (
    <Card className={`border-2 shadow-lg ${isPopular ? 'border-primary' : 'border-muted'} ${isCurrentPlan ? 'bg-primary/5' : ''}`}>
      {isPopular && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 rounded-bl-md">
          <span className="text-xs font-semibold">POPULAR</span>
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{name}</span>
          {isCurrentPlan && (
            <span className="text-xs font-semibold bg-primary/20 text-primary px-2 py-1 rounded-full">
              CURRENT PLAN
            </span>
          )}
        </CardTitle>
        <div className="flex items-end gap-1">
          <span className="text-3xl font-bold">{formatAmount(price, currency)}</span>
          <span className="text-muted-foreground">/{interval}</span>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-primary mr-2 shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          onClick={onSelectPlan}
          className={`w-full ${isPopular ? 'bg-primary hover:bg-primary/90' : ''}`}
          disabled={isLoading || isCurrentPlan}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : (
            'Choose Plan'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export const LocalizedPricing: React.FC = () => {
  const { subscription, createCheckoutSession } = useSubscription();
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(DEFAULT_CURRENCY);
  const [isProcessing, setIsProcessing] = useState(false);

  // Detect user's currency based on locale
  useEffect(() => {
    const detectedCurrency = getCurrencyFromLocale();
    setSelectedCurrency(detectedCurrency);
  }, []);

  const handleSelectPlan = async () => {
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

  // Base prices in USD
  const monthlyPriceUSD = 4.99;
  const monthlyPrice = convertPrice(monthlyPriceUSD, selectedCurrency);

  const isCurrentPlan = subscription.isSubscribed && !subscription.canceledAt;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="inline-flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Currency:</span>
          <Select
            value={selectedCurrency}
            onValueChange={(value) => setSelectedCurrency(value as SupportedCurrency)}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CURRENCIES).map(([code, details]) => (
                <SelectItem key={code} value={code}>
                  {details.symbol} {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
        <PricingTier
          name="Premium"
          price={monthlyPrice}
          currency={selectedCurrency}
          interval="month"
          description="Full access to all features with a 7-day free trial"
          features={[
            "Unlimited exercises",
            "Unlimited vocabulary lists",
            "Edit exercises anytime",
            "Text-to-speech for all exercises",
            "Advanced analytics",
            "AI-powered vocabulary suggestions"
          ]}
          isPopular={true}
          onSelectPlan={handleSelectPlan}
          isLoading={isProcessing}
          isCurrentPlan={isCurrentPlan}
        />
      </div>
    </div>
  );
};
