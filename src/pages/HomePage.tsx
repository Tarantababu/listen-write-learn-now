
import React from 'react';
import UserStatistics from '@/components/UserStatistics';
import { useSubscription } from '@/contexts/SubscriptionContext';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import { ExerciseProvider } from '@/contexts/ExerciseContext';

const HomePage: React.FC = () => {
  const { subscription } = useSubscription();
  
  return (
    <div className="container mx-auto px-4 py-8">
      {!subscription.isSubscribed && <SubscriptionBanner />}
      <ExerciseProvider>
        <UserStatistics />
      </ExerciseProvider>
    </div>
  );
};

export default HomePage;
