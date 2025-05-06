
import React from 'react';
import UserStatistics from '@/components/UserStatistics';
import { useSubscription } from '@/contexts/SubscriptionContext';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import { ExerciseProvider } from '@/contexts/ExerciseContext';
import { UserMessages } from '@/components/UserMessages';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';

const HomePage: React.FC = () => {
  const { subscription } = useSubscription();
  const { user } = useAuth();
  
  return (
    <div className="container mx-auto px-4 py-8">
      {!subscription.isSubscribed && <SubscriptionBanner />}
      
      {user && (
        <div className="mb-6 flex justify-end">
          <UserMessages />
        </div>
      )}
      
      <ExerciseProvider>
        <UserStatistics />
      </ExerciseProvider>
    </div>
  );
};

export default HomePage;
