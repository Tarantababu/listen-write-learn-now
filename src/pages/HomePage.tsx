
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
  
  // Wrap the roadmap-related code in a try/catch to prevent errors from breaking the entire page
  let roadmapInfo = null;
  
  try {
    const {
      currentRoadmap,
      currentNodeId,
      nodes,
      isLoading,
      completedNodes,
      roadmaps
    } = useRoadmap();
    
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
    
    roadmapInfo = {
      currentRoadmap,
      roadmapName,
      roadmapLevel,
      progressPercentage,
      currentNode,
      isLoading
    };
  } catch (error) {
    console.error("Error loading roadmap data:", error);
    // We'll handle this gracefully by showing a fallback UI
  }

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
          {roadmapInfo && roadmapInfo.currentRoadmap ? (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">
                      Your Learning Path
                    </CardTitle>
                    <div className="flex items-center mt-1">
                      {roadmapInfo.roadmapLevel && (
                        <LevelBadge level={roadmapInfo.roadmapLevel} className="mr-2" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {roadmapInfo.roadmapName || "Learning Roadmap"}
                      </span>
                    </div>
                  </div>
                  
                  <Button asChild variant="outline" size="sm">
                    <Link to="/dashboard/roadmap">
                      View All <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">
                        Progress: {roadmapInfo.progressPercentage}%
                      </p>
                    </div>
                    <Button asChild size="sm">
                      <Link to="/dashboard/roadmap">
                        Continue Learning
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">Learning Paths</CardTitle>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/dashboard/roadmap">
                      Explore <Map className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex justify-center py-6">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">
                      Start a learning path tailored to your language level
                    </p>
                    <Button asChild>
                      <Link to="/dashboard/roadmap">
                        Get Started
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>;
};

export default HomePage;
