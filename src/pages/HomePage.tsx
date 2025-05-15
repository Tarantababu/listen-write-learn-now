import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import UserStatistics from '@/components/UserStatistics';
import { useSubscription } from '@/contexts/SubscriptionContext';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import { ExerciseProvider } from '@/contexts/ExerciseContext';
import { useRoadmap } from '@/hooks/use-roadmap'; // Use the hook from hooks folder
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, ChevronRight, Loader2 } from 'lucide-react';
import LevelBadge from '@/components/LevelBadge';
import { useAdmin } from '@/hooks/use-admin';
import { RefreshButton } from '@/components/RefreshButton';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';

const HomePage = () => {
  const location = useLocation();
  const { subscription } = useSubscription();
  const { isAdmin } = useAdmin();
  const { settings } = useUserSettingsContext();
  const { 
    currentRoadmap, 
    currentNodeId, 
    nodes, 
    isLoading, 
    completedNodes, 
    roadmaps,
    refreshData 
  } = useRoadmap();
  
  // React to redirect messages (e.g., access denied)
  React.useEffect(() => {
    const state = location.state as { accessDenied?: boolean; message?: string };
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

  // Find the roadmap details
  const roadmapDetails = currentRoadmap 
    ? roadmaps.find(r => r.id === currentRoadmap.roadmapId) 
    : null;

  return (
    <ExerciseProvider>
      <div className="container pb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-center">Dashboard</h1>
          <RefreshButton onRefresh={() => refreshData(settings.selectedLanguage)} isLoading={isLoading} />
        </div>
        
        {/* ... keep existing code for subscription banner & other UI */}
        {subscription && !subscription.isSubscribed && !isAdmin && (
          <SubscriptionBanner />
        )}
        
        {currentRoadmap && (
          <div className="mb-8">
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      Your Learning Path
                      {roadmapDetails && roadmapDetails.level && (
                        <LevelBadge level={roadmapDetails.level} />
                      )}
                    </CardTitle>
                  </div>
                  <RefreshButton 
                    onRefresh={() => refreshData(settings.selectedLanguage)} 
                    isLoading={isLoading} 
                  />
                </div>
              </CardHeader>
              
              {/* ... keep existing code for displaying the current roadmap */}
              <CardContent>
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p>Loading roadmap...</p>
                  </div>
                ) : currentRoadmap ? (
                  <>
                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-1">{roadmapDetails?.name || "Learning Path"}</h3>
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
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border-amber-500/40 text-amber-700">
                                  Bonus
                                </span>
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
            
            {/* ... keep existing code for the rest of the UI */}
          </div>
        )}
        
        {/* ... keep existing code for user statistics and other UI */}
        <div className="w-full">
          <ExerciseProvider>
            <UserStatistics />
          </ExerciseProvider>
        </div>
      </div>
    </ExerciseProvider>
  );
};

export default HomePage;
