
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
import { RoadmapNode } from '@/types';

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

  // Handler for navigating to a node
  const handleNodeSelect = (node: RoadmapNode) => {
    // Navigate to roadmap page with this node selected
    window.location.href = `/roadmap?nodeId=${node.id}`;
  };

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
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl font-semibold flex items-center">
                  <Map className="h-5 w-5 mr-2 text-primary" />
                  Learning Roadmap
                </CardTitle>
              </div>
              <Link to="/roadmap">
                <Button variant="ghost" size="sm" className="gap-1">
                  <span>View All</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : currentRoadmap ? (
                <div className="space-y-4">
                  {/* Roadmap header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        {roadmapLevel && <LevelBadge level={roadmapLevel} />}
                        <h3 className="font-medium text-lg">{roadmapName || "Your Learning Path"}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {progressPercentage}% Complete • {completedNodes.length} of {nodes.length} lessons completed
                      </p>
                    </div>
                    <Link to={`/roadmap`}>
                      <Button size="sm">Continue Learning</Button>
                    </Link>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>

                  {/* Current node */}
                  {currentNode && (
                    <div className="pt-2">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Current Lesson</h4>
                      <Card 
                        className="cursor-pointer hover:border-primary/50 transition-all"
                        onClick={() => handleNodeSelect(currentNode)}
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-base">{currentNode.title}</h3>
                            {currentNode.description && (
                              <p className="text-sm text-muted-foreground mt-1">{currentNode.description}</p>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <h3 className="font-medium text-lg mb-2">Start Your Language Journey</h3>
                  <p className="text-muted-foreground mb-4">
                    Choose a language level to begin your structured learning path
                  </p>
                  <Link to="/roadmap">
                    <Button>Select Roadmap</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
export default HomePage;
