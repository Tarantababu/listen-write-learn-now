
import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import UserStatistics from '@/components/UserStatistics';
import { useSubscription } from '@/contexts/SubscriptionContext';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import { ExerciseProvider } from '@/contexts/ExerciseContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRoadmap } from '@/contexts/RoadmapContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, ChevronRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import LevelBadge from '@/components/LevelBadge';
import { useAdmin } from '@/hooks/use-admin';

const HomePage = () => {
  const location = useLocation();
  const { subscription } = useSubscription();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { currentRoadmap, currentNodeId, nodes, loading, completedNodes, roadmaps } = useRoadmap();
  
  useEffect(() => {
    // Show access denied message if redirected from admin page
    const state = location.state as { accessDenied?: boolean; message?: string };
    if (state?.accessDenied) {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: state.message || "You don't have the required permissions"
      });
      
      // Clear the state so the message doesn't show again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Calculate roadmap progress percentage
  const progressPercentage = nodes.length > 0 
    ? Math.round((completedNodes.length / nodes.length) * 100)
    : 0;

  // Get current node information
  const currentNode = currentNodeId 
    ? nodes.find(node => node.id === currentNodeId)
    : null;

  // Get next few nodes
  const currentIndex = currentNode 
    ? nodes.findIndex(node => node.id === currentNode.id)
    : -1;
  
  const nextNodes = currentIndex !== -1
    ? nodes.slice(currentIndex + 1, currentIndex + 3)
    : [];

  // Find the roadmap details using the roadmapId from currentRoadmap
  const roadmapDetails = currentRoadmap ? roadmaps.find(r => r.id === currentRoadmap.roadmapId) : null;
  const roadmapLevel = roadmapDetails?.level;
  const roadmapName = roadmapDetails?.name;

  // If user is admin, don't show subscription banner
  const shouldShowSubscriptionBanner = !subscription.isSubscribed && !isAdmin;

  return (
    <div className="container mx-auto px-4 py-8">
      {shouldShowSubscriptionBanner && <SubscriptionBanner />}
      
      <div className="flex flex-col gap-6">
        {/* Language Level Section - Now in a full-width row */}
        <div className="w-full">
          <ExerciseProvider>
            <UserStatistics />
          </ExerciseProvider>
        </div>
        
        {/* Content Grid - Modified to full width for Learning Roadmap */}
        <div className="w-full">
          {/* Learning Roadmap section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center">
                  <Map className="h-4 w-4 mr-2" />
                  Learning Roadmap
                </div>
                {roadmapLevel && (
                  <LevelBadge level={roadmapLevel} />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p>Loading roadmap...</p>
                </div>
              ) : currentRoadmap ? (
                <>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-1">{roadmapName || "Learning Path"}</h3>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs font-medium">{progressPercentage}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {currentNode && (
                    <div className="mb-4 p-3 bg-secondary/20 rounded-md border border-secondary/30">
                      <h4 className="text-sm font-medium">Current Exercise:</h4>
                      <p className="text-sm mt-1">{currentNode.title}</p>
                    </div>
                  )}

                  {nextNodes.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs uppercase text-muted-foreground mb-2">Coming up next:</h4>
                      <ul className="space-y-2">
                        {nextNodes.map((node) => (
                          <li 
                            key={node.id} 
                            className="text-xs flex items-center justify-between p-2 bg-muted/50 rounded-md"
                          >
                            <span>{node.title}</span>
                            {node.isBonus && (
                              <Badge variant="outline" className="text-[10px] bg-amber-500/10 border-amber-500/40 text-amber-700">Bonus</Badge>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button asChild className="w-full mt-2">
                    <Link to="/dashboard/roadmap">
                      Continue Learning <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <p className="text-sm mb-3">You haven't started a learning roadmap yet.</p>
                  <Button asChild>
                    <Link to="/dashboard/roadmap">
                      Start Learning Path
                    </Link>
                  </Button>
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
