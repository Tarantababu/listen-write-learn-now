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
        {/* Main Content Grid - Mobile-first responsive design */}
        <div className="w-full">
          <ExerciseProvider>
            {/* 
              Two-column layout for Learning Plan Progress and Language Journey
              - Single column on mobile (< md breakpoint)
              - Two columns on tablet and desktop (>= md breakpoint)
              - Equal width columns with gap
            */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Learning Plan Progress Column */}
              <div className="w-full">
                <LearningPlanProgress />
              </div>
              
              {/* Your Language Journey Column */}
              <div className="w-full">
                <LanguageJourney />
              </div>
            </div>
            
            {/* Rest of UserStatistics content */}
            <UserStatistics />
          </ExerciseProvider>
        </div>
      </div>
    </div>
  );
};

// Placeholder components - replace with your actual components
const LearningPlanProgress = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-full">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Learning Plan Progress
      </h2>
      {/* Your Learning Plan Progress content goes here */}
      <div className="space-y-4">
        {/* Add your progress bars, charts, or other content */}
      </div>
    </div>
  );
};

const LanguageJourney = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-full">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Your Language Journey
      </h2>
      {/* Your Language Journey content goes here */}
      <div className="space-y-4">
        {/* Add your journey timeline, milestones, or other content */}
      </div>
    </div>
  );
};

export default HomePage;