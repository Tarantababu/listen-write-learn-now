
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { formatPrice } from '@/lib/stripe';

interface UpgradePromptProps {
  title?: string;
  message?: string;
  showButton?: boolean;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  title = "Upgrade to Premium",
  message,
  showButton = true
}) => {
  const navigate = useNavigate();
  const { selectedCurrency } = useSubscription();
  
  const defaultMessage = `Unlock unlimited exercises, vocabulary lists, and more features starting at ${formatPrice(4.99, selectedCurrency)}/month with a 7-day free trial.`;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>{message || defaultMessage}</p>
      </CardContent>
      {showButton && (
        <CardFooter>
          <Button 
            onClick={() => navigate('/dashboard/subscription')}
            className="w-full bg-primary"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            View Plans
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default UpgradePrompt;
