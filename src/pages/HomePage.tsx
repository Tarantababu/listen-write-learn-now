
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
  
  return (
    <div className="container mx-auto px-4 py-8">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">
                Your Learning Path
              </CardTitle>
              <Link to="/dashboard/roadmap">
                <Button variant="ghost" size="sm" className="gap-1">
                  <span>View All</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : currentRoadmap ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center">
                        {roadmapName || "Roadmap"}
                        {roadmapLevel && <LevelBadge level={roadmapLevel} className="ml-2" />}
                      </h3>
                      <p className="text-sm text-muted-foreground">{progressPercentage}% complete</p>
                    </div>
                    
                    <Link to={`/dashboard/roadmap`}>
                      <Button>Continue Learning</Button>
                    </Link>
                  </div>
                  
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-2 bg-primary rounded-full transition-all duration-500" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  
                  {currentNode && (
                    <div className="bg-primary/5 p-3 rounded-md border border-primary/10">
                      <h4 className="font-medium text-sm">Current Lesson:</h4>
                      <p className="font-medium">{currentNode.title}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Map className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Start Your Learning Journey</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                      Follow a structured roadmap to master your language skills step by step
                    </p>
                  </div>
                  <Link to="/dashboard/roadmap">
                    <Button>
                      Explore Roadmaps
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
