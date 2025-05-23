
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import UserStatistics from '@/components/UserStatistics';
import { useSubscription } from '@/contexts/SubscriptionContext';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import { ExerciseProvider } from '@/contexts/ExerciseContext';
import { useRoadmap } from '@/hooks/use-roadmap';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/use-admin';
import { hasTutorialBeenViewed, markTutorialAsViewed } from '@/utils/visitorTracking';

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    subscription
  } = useSubscription();
  const {
    isAdmin
  } = useAdmin();

  // React to redirect messages (e.g., access denied)
  useEffect(() => {
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

  // Check if user should see the tutorial
  useEffect(() => {
    // Only proceed if we have a user and not an admin
    if (user && !isAdmin) {
      const tutorialViewed = hasTutorialBeenViewed();
      
      // If tutorial hasn't been viewed yet, redirect to tutorial page
      if (!tutorialViewed) {
        markTutorialAsViewed(); // Mark as viewed immediately to prevent loops
        navigate('/dashboard/tutorial', { replace: true });
      }
    }
  }, [user, isAdmin, navigate]);

  // Don't show subscription banner for admins
  const shouldShowSubscriptionBanner = !subscription.isSubscribed && !isAdmin;
  
  return (
    <div className="container mx-auto px-4 py-8">
      {shouldShowSubscriptionBanner && <SubscriptionBanner />}
      
      <div className="flex flex-col gap-6">
        {/* User Statistics - now contains the Curriculum Progress card */}
        <div className="w-full">
          <ExerciseProvider>
            <UserStatistics />
          </ExerciseProvider>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
