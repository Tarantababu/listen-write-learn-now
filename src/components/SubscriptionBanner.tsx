
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Crown, X } from 'lucide-react';
import { useLocalStorage } from 'react-use';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { formatPrice } from '@/lib/stripe';

const SubscriptionBanner: React.FC = () => {
  const [dismissed, setDismissed] = useLocalStorage('subscription-banner-dismissed', false);
  const { selectedCurrency } = useSubscription();

  if (dismissed) {
    return null;
  }

  return (
    <Card className="mb-6 p-4 border-primary/20 bg-primary/5 relative overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center">
        <Crown className="h-8 w-8 text-primary mr-4" />
        <div>
          <h3 className="font-medium">Upgrade to Premium</h3>
          <p className="text-sm text-muted-foreground">
            Get unlimited exercises and advanced features. Plans from {formatPrice(4.99, selectedCurrency)}/month with a 7-day free trial.
          </p>
        </div>
        <Button 
          className="ml-auto bg-gradient-to-r from-primary to-accent hover:opacity-90"
          size="sm"
          asChild
        >
          <Link to="/dashboard/subscription">Try Free for 7 Days</Link>
        </Button>
      </div>
    </Card>
  );
};

export default SubscriptionBanner;
