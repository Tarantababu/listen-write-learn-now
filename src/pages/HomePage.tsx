
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
import { Map, ChevronRight, Loader2, GraduationCap } from 'lucide-react';
import LevelBadge from '@/components/LevelBadge';
import { useAdmin } from '@/hooks/use-admin';
import { Progress } from '@/components/ui/progress';
import { useCurriculumExercises } from '@/hooks/use-curriculum-exercises';
import SkeletonUserStats from '@/components/SkeletonUserStats';
import { useDelayedLoading } from '@/hooks/use-delayed-loading';
import { Skeleton } from '@/components/ui/skeleton';

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

  // Curriculum data for Learning Curriculum Card
  const {
    stats,
    loading: curriculumLoading,
    refreshData: refreshCurriculumData
  } = useCurriculumExercises();

  // Use debounced loading state to prevent UI flashing
  const showCurriculumLoading = useDelayedLoading(curriculumLoading, 400);

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

  // Refresh curriculum data on component mount
  React.useEffect(() => {
    console.log("HomePage: Refreshing curriculum data");
    refreshCurriculumData();
  }, [refreshCurriculumData]);

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
        
        {/* Learning Roadmap Card and Curriculum Progress Card in a grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Moved Curriculum Progress Card here to be in the same grid row as potential other cards */}
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xl font-semibold">Curriculum Progress</CardTitle>
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {showCurriculumLoading ? (
                <div>
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-36" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    
                    <Skeleton className="h-2 w-full" />
                    
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="p-2 rounded">
                          <Skeleton className="h-5 w-full mb-1" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-5">
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
              ) : stats.total > 0 ? (
                <>
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Foundational Exercises</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {stats.completed}/{stats.total} complete
                      </span>
                    </div>
                    
                    <Progress value={stats.total > 0 ? Math.round(stats.completed / stats.total * 100) : 0} className="h-2" />
                    
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded">
                        <p className="font-semibold text-green-600 dark:text-green-400">{stats.completed}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                        <p className="font-semibold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
                        <p className="text-xs text-muted-foreground">In Progress</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900/20 p-2 rounded">
                        <p className="font-semibold">{stats.total - stats.completed - stats.inProgress}</p>
                        <p className="text-xs text-muted-foreground">Not Started</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-5">
                    <Button asChild variant="default" size="sm" className="w-full">
                      <Link to="/dashboard/curriculum" className="flex items-center justify-center">
                        View Curriculum <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-4">
                  <p className="text-center text-muted-foreground mb-4">
                    Explore our comprehensive curriculum of language learning exercises.
                  </p>
                  <Button asChild variant="default" size="sm" className="w-full">
                    <Link to="/dashboard/curriculum">
                      Browse Curriculum <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          {/* This is where another card would go (like Vocabulary Items) */}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
