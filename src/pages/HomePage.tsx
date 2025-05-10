import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import UserStatistics from '@/components/UserStatistics';
import { useSubscription } from '@/contexts/SubscriptionContext';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import { ExerciseProvider } from '@/contexts/ExerciseContext';
import { useAuth } from '@/contexts/AuthContext';

const HomePage = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Show access denied message if redirected from admin page
    const state = location.state as { accessDenied?: boolean; message?: string };
    if (state?.accessDenied) {
      toast.error(state.message || "Access denied", {
        description: "You don't have the required permissions"
      });
      
      // Clear the state so the message doesn't show again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const { subscription } = useSubscription();
  const { user } = useAuth();
  
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
