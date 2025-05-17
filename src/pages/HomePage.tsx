
import React from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import UserStatistics from '@/components/UserStatistics';
import { useSubscription } from '@/contexts/SubscriptionContext';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/use-admin';

const HomePage = () => {
  const location = useLocation();
  const {
    subscription
  } = useSubscription();
  const {
    isAdmin
  } = useAdmin();

  // React to redirect messages (e.g., access denied)
  React.useEffect(() => {
    const state = location.state as {
      accessDenied?: boolean;
      message?: string;
    };
    if (state?.accessDenied) {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: state.message || "You don't have the required permissions"
      });
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Don't show subscription banner for admins
  const shouldShowSubscriptionBanner = !subscription.isSubscribed && !isAdmin;
  
  return (
    <div className="container mx-auto px-4 py-8">
      {shouldShowSubscriptionBanner && <SubscriptionBanner />}
      
      <div className="flex flex-col gap-6">
        {/* User Statistics */}
        <div className="w-full">
          <UserStatistics />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
