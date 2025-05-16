import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import UserStatistics from '@/components/UserStatistics';
import { useSubscription } from '@/contexts/SubscriptionContext';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import { ExerciseProvider } from '@/contexts/ExerciseContext';
import { useRoadmap } from '@/hooks/use-roadmap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, ChevronRight, Loader2 } from 'lucide-react';
import LevelBadge from '@/components/LevelBadge';
import { useAdmin } from '@/hooks/use-admin';
const HomePage = () => {
  const location = useLocation();
  const {
    subscription
  } = useSubscription();
  const {
    isAdmin
  } = useAdmin();
  const {
    currentRoadmap,
    currentNodeId,
    nodes,
    isLoading,
    completedNodes,
    roadmaps
  } = useRoadmap();

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

  // Calculate roadmap progress percentage
  const progressPercentage = nodes.length > 0 ? Math.round(completedNodes.length / nodes.length * 100) : 0;

  // Get current node information
  const currentNode = currentNodeId ? nodes.find(node => node.id === currentNodeId) : null;

  // Get next few nodes
  const currentIndex = currentNode ? nodes.findIndex(node => node.id === currentNode.id) : -1;
  const nextNodes = currentIndex !== -1 ? nodes.slice(currentIndex + 1, currentIndex + 3) : [];

  // Find the roadmap details
  const roadmapDetails = currentRoadmap ? roadmaps.find(r => r.id === currentRoadmap.roadmapId) : null;
  const roadmapLevel = roadmapDetails?.level;
  const roadmapName = roadmapDetails?.name;

  // Don't show subscription banner for admins
  const shouldShowSubscriptionBanner = !subscription.isSubscribed && !isAdmin;
  return <div className="container mx-auto px-4 py-8">
      {shouldShowSubscriptionBanner && <SubscriptionBanner />}
      
      <div className="flex flex-col gap-6">
        {/* User Statistics */}
        <div className="w-full">
          <ExerciseProvider>
            <UserStatistics />
          </ExerciseProvider>
        </div>
        
        {/* Learning Roadmap Card */}
        <div className="w-full">
          
        </div>
      </div>
    </div>;
};
export default HomePage;