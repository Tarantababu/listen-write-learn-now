import React, { useState, useEffect } from 'react';
import { useRoadmap } from '@/hooks/use-roadmap';
import RoadmapVisualization from '@/components/roadmap/RoadmapVisualization';
import RoadmapSelection from '@/features/roadmap/components/RoadmapSelection';
import RoadmapExerciseModal from '@/features/roadmap/components/RoadmapExerciseModal';
import RoadmapItemCard from '@/features/roadmap/components/RoadmapItemCard';
import RoadmapProgressDashboard from '@/features/roadmap/components/RoadmapProgressDashboard';
import { RoadmapNode } from '@/features/roadmap/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { ArrowRightIcon, LayoutDashboard, BookOpen, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const RoadmapPage: React.FC = () => {
  const { 
    currentRoadmap, 
    isLoading, 
    roadmaps, 
    userRoadmaps,
    loadUserRoadmaps,
    selectRoadmap,
    completedNodes,
    nodes,
    currentNodeId
  } = useRoadmap();
  
  // Derive hasError from context data
  const hasError = !isLoading && userRoadmaps.length > 0 && !currentRoadmap;
  
  const { settings } = useUserSettingsContext();
  const { user } = useAuth();
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("active");
  const [viewMode, setViewMode] = useState<'map' | 'dashboard'>('map');
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const navigate = useNavigate();

  // Set active tab based on whether we have user roadmaps or not
  useEffect(() => {
    if (!isLoading) {
      if (userRoadmaps.length === 0) {
        setActiveTab("new");
      } else {
        setActiveTab("active");
      }
    }
  }, [isLoading, userRoadmaps]);

  // When a user clicks on "Continue Learning," open the exercise modal with current node
  useEffect(() => {
    if (currentRoadmap && currentNodeId && nodes.length > 0) {
      const currentNode = nodes.find(node => node.id === currentNodeId);
      if (currentNode && selectedNode?.id === currentNode.id && !exerciseModalOpen) {
        setExerciseModalOpen(true);
      }
    }
  }, [currentRoadmap, currentNodeId, nodes, selectedNode, exerciseModalOpen]);

  const handleNodeSelect = (node: RoadmapNode) => {
    setSelectedNode(node);
    setExerciseModalOpen(true);
  };

  const handleExploreExercises = () => {
    navigate('/dashboard/exercises');
    toast({
      title: "Exercises",
      description: "You can find more exercises to practice here",
    });
  };

  const handleRoadmapSelect = async (roadmapId: string) => {
    try {
      setSelectionError(null);
      setIsRetrying(false);
      await selectRoadmap(roadmapId);
      setViewMode('map'); // Switch to map view when selecting a roadmap
    } catch (error) {
      console.error('Error selecting roadmap:', error);
      setSelectionError('Failed to load the selected roadmap. Please try again.');
      
      // After error, try to re-fetch user roadmaps
      try {
        const loadedRoadmaps = await loadUserRoadmaps();
        
        if (loadedRoadmaps && loadedRoadmaps.length > 0) {
          // Try selecting the first available roadmap instead
          try {
            await selectRoadmap(loadedRoadmaps[0].id);
            toast({
              title: "Selected fallback roadmap",
              description: "We encountered an issue with the selected roadmap and loaded another one instead."
            });
          } catch (secondError) {
            console.error('Error selecting fallback roadmap:', secondError);
          }
        }
      } catch (loadError) {
        console.error('Error loading fallback roadmaps:', loadError);
      }
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      setSelectionError(null);
      
      // Check if user is authenticated
      if (!user) {
        navigate('/login');
        return;
      }
      
      // Reload roadmaps first
      await loadUserRoadmaps();
      console.log("Reloaded roadmaps:", { userRoadmaps });
      
      // If we have a current roadmap, try to reload it
      if (currentRoadmap) {
        await selectRoadmap(currentRoadmap.id);
        toast({
          title: "Roadmap loaded",
          description: "Successfully reloaded your roadmap."
        });
      } else if (userRoadmaps.length > 0) {
        // Otherwise, select the first available roadmap
        await selectRoadmap(userRoadmaps[0].id);
        toast({
          title: "Roadmap loaded",
          description: "Successfully loaded a roadmap."
        });
      }
    } catch (error) {
      console.error('Error retrying roadmap load:', error);
      setSelectionError('Still having trouble loading the roadmap. Please try refreshing the page.');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleContinueLearning = async (roadmapId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      setSelectionError(null);
      
      // First select the roadmap
      await selectRoadmap(roadmapId);
      
      // Find the current node in this roadmap
      const selectedRoadmap = userRoadmaps.find(r => r.id === roadmapId);
      if (selectedRoadmap && selectedRoadmap.currentNodeId) {
        const currentNode = nodes.find(node => node.id === selectedRoadmap.currentNodeId);
        if (currentNode) {
          setSelectedNode(currentNode);
          setExerciseModalOpen(true);
        }
      }
    } catch (error) {
      console.error('Error continuing learning:', error);
      setSelectionError('Failed to load the selected roadmap. Please try again.');
    }
  };

  // Get the selected language with proper capitalization
  const getCapitalizedLanguage = (lang: string) => {
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  // Check if there are any available roadmaps in the system
  const hasAvailableRoadmaps = roadmaps.some(roadmap => 
    roadmap.languages?.includes(settings.selectedLanguage)
  );

  // Detailed debug info
  useEffect(() => {
    console.log("RoadmapPage state:", {
      isLoading,
      hasError,
      userAuthenticated: !!user,
      roadmaps: roadmaps.length,
      userRoadmaps: userRoadmaps.length,
      hasCurrentRoadmap: !!currentRoadmap,
      nodes: nodes.length,
      activeTab,
      hasAvailableRoadmaps,
      language: settings.selectedLanguage
    });
  }, [
    isLoading, 
    hasError, 
    user, 
    roadmaps.length, 
    userRoadmaps.length, 
    currentRoadmap, 
    nodes.length, 
    activeTab,
    settings.selectedLanguage
  ]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64 flex-col space-y-4">
          <p className="text-muted-foreground">Please log in to access your learning paths</p>
          <Button onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Loading your learning paths...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        <motion.div 
          className="flex justify-between items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold">
            Your Learning Paths
            <span className="ml-2 text-base font-normal text-muted-foreground">
              ({getCapitalizedLanguage(settings.selectedLanguage)})
            </span>
          </h1>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExploreExercises}
              className="hidden sm:flex"
            >
              <ArrowRightIcon className="h-4 w-4 mr-1" /> Explore More Exercises
            </Button>
          </div>
        </motion.div>

        {(selectionError || hasError) && (
          <motion.div 
            className="bg-destructive/15 border border-destructive rounded-md p-4 mb-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-center">
              <p className="text-destructive font-medium">
                {selectionError || "Failed to load your roadmaps. Please try again."}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
                disabled={isRetrying}
                className="ml-2 min-w-[100px]"
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1" /> Retry
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {!hasAvailableRoadmaps && !isLoading && (
          <motion.div 
            className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-2 dark:bg-amber-900/20 dark:border-amber-800"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center">
              <p className="text-amber-800 dark:text-amber-400 font-medium">
                No roadmaps available for {getCapitalizedLanguage(settings.selectedLanguage)}
              </p>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
              There are no learning paths available for {getCapitalizedLanguage(settings.selectedLanguage)} yet. 
              Please check back later or select a different language in your settings.
            </p>
          </motion.div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="active" disabled={userRoadmaps.length === 0}>
              My Roadmaps
            </TabsTrigger>
            <TabsTrigger value="new">
              New Roadmap
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-6">
            {userRoadmaps.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  You don't have any roadmaps for {getCapitalizedLanguage(settings.selectedLanguage)} yet. Start a new one to begin your learning journey.
                </p>
              </div>
            ) : (
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold">{getCapitalizedLanguage(settings.selectedLanguage)}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userRoadmaps.map(roadmap => (
                    <motion.div
                      key={roadmap.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <RoadmapItemCard
                        roadmap={roadmap}
                        isActive={currentRoadmap?.id === roadmap.id}
                        onCardClick={handleRoadmapSelect}
                        onContinueClick={handleContinueLearning}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </TabsContent>
          
          <TabsContent value="new">
            <div className="max-w-md mx-auto w-full">
              <RoadmapSelection />
            </div>
          </TabsContent>
        </Tabs>

        {currentRoadmap && activeTab === 'active' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="border rounded-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {roadmaps.find(r => r.id === currentRoadmap.roadmapId)?.name || "Learning Path"} - {getCapitalizedLanguage(currentRoadmap.language)}
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('map')}
                      className={viewMode === 'map' ? 'bg-muted' : ''}
                    >
                      <BookOpen className="h-4 w-4 mr-2" /> 
                      Map View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('dashboard')}
                      className={viewMode === 'dashboard' ? 'bg-muted' : ''}
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" /> 
                      Dashboard
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Follow this path to improve your {currentRoadmap.language} skills step by step
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-8 pt-2">
                {viewMode === 'map' ? (
                  <RoadmapVisualization onNodeSelect={handleNodeSelect} />
                ) : (
                  <RoadmapProgressDashboard />
                )}
              </CardContent>
            </Card>
            
            <div className="flex justify-center mt-4 sm:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExploreExercises}
                className="w-full"
              >
                <ArrowRightIcon className="h-4 w-4 mr-1" /> Explore More Exercises
              </Button>
            </div>
            
            <RoadmapExerciseModal
              node={selectedNode}
              isOpen={exerciseModalOpen}
              onOpenChange={setExerciseModalOpen}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default RoadmapPage;
