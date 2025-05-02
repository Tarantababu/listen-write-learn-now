
// Update the HomePage to include the subscription banner
import React from 'react';
import UserStatistics from '@/components/UserStatistics';
import { useSubscription } from '@/contexts/SubscriptionContext';
import SubscriptionBanner from '@/components/SubscriptionBanner';

const HomePage: React.FC = () => {
  const { subscription } = useSubscription();
  
  return (
    <div className="container mx-auto px-4 py-8">
      {!subscription.isSubscribed && <SubscriptionBanner />}
      <UserStatistics />
    </div>
  );
};

export default HomePage;
