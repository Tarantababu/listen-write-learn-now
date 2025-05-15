import React, { useState, useEffect } from 'react';
import { useCurriculumPath } from '@/hooks/use-curriculum-path';
import CurriculumPathVisualization from '@/components/roadmap/RoadmapVisualization';
import CurriculumPathSelection from '@/components/roadmap/RoadmapSelection';
import CurriculumExerciseModal from '@/components/roadmap/RoadmapExerciseModal';
import CurriculumPathItemCard from '@/features/roadmap/components/CurriculumPathItemCard';
import CurriculumPathProgressDashboard from '@/features/roadmap/components/CurriculumPathProgressDashboard';
import { CurriculumNode } from '@/types';
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

const CurriculumPathPage: React.FC = () => {
  const { 
    currentCurriculumPath, 
    isLoading, 
    curriculumPaths, 
    userCurriculumPaths = [],
    loadUserCurriculumPaths,
    selectCurriculumPath,
    completedNodes = [],
    nodes = [],
    currentNodeId
  } = useCurriculumPath();
  
  // Derive hasError from context data
  const hasError = !isLoading && userCurriculumPaths.length > 0 && !currentCurriculumPath;
  
  const { settings } = useUserSettingsContext();
  const { user } = useAuth();
  const [selectedNode, setSelectedNode] = useState<CurriculumNode | null>(null);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("active");
  const [viewMode, setViewMode] = useState<'map' | 'dashboard'>('map');
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const navigate = useNavigate();

  // Set active tab based on whether we have user curriculum paths or not
  useEffect(() => {
    if (!isLoading) {
      if (userCurriculumPaths.length === 0) {
        setActiveTab("new");
      } else {
        setActiveTab("active");
      }
    }
  }, [isLoading, userCurriculumPaths]);

  // When a user clicks on "Continue Learning," open the exercise modal with current node
  useEffect(() => {
    if (currentCurriculumPath && currentNodeId && nodes.length > 0) {
      const currentNode = nodes.find(node => node.id === currentNodeId);
      if (currentNode && selectedNode?.id === currentNode.id && !exerciseModalOpen) {
        setExerciseModalOpen(true);
      }
    }
  }, [currentCurriculumPath, currentNodeId, nodes, selectedNode, exerciseModalOpen]);

  const handleNodeSelect = (node: CurriculumNode) => {
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

  const handleCurriculumPathSelect = async (pathId: string) => {
    try {
      setSelectionError(null);
      setIsRetrying(false);
      await selectCurriculumPath(pathId);
      setViewMode('map'); // Switch to map view when selecting a path
    } catch (error) {
      console.error('Error selecting curriculum path:', error);
      setSelectionError('Failed to load the selected curriculum path. Please try again.');
      
      // After error, try to re-fetch user curriculum paths
      try {
        await loadUserCurriculumPaths(settings.selectedLanguage);
        
        if (userCurriculumPaths && userCurriculumPaths.length > 0) {
          // Try selecting the first available curriculum path instead
          try {
            await selectCurriculumPath(userCurriculumPaths[0].id);
            toast({
              title: "Selected fallback curriculum path",
              description: "We encountered an issue with the selected curriculum path and loaded another one instead."
            });
          } catch (secondError) {
            console.error('Error selecting fallback curriculum path:', secondError);
          }
        }
      } catch (loadError) {
        console.error('Error loading fallback curriculum paths:', loadError);
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
      
      // Reload curriculum paths first
      await loadUserCurriculumPaths(settings.selectedLanguage);
      console.log("Reloaded curriculum paths:", { userCurriculumPaths });
      
      // If we have a current curriculum path, try to reload it
      if (currentCurriculumPath) {
        await selectCurriculumPath(currentCurriculumPath.id);
        toast({
          title: "Curriculum path loaded",
          description: "Successfully reloaded your curriculum path."
        });
      } else if (userCurriculumPaths && userCurriculumPaths.length > 0) {
        // Otherwise, select the first available curriculum path
        await selectCurriculumPath(userCurriculumPaths[0].id);
        toast({
          title: "Curriculum path loaded",
          description: "Successfully loaded a curriculum path."
        });
      }
    } catch (error) {
      console.error('Error retrying curriculum path load:', error);
      setSelectionError('Still having trouble loading the curriculum path. Please try refreshing the page.');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleContinueLearning = async (pathId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      setSelectionError(null);
      
      // First select the curriculum path
      await selectCurriculumPath(pathId);
      
      // Find the current node in this curriculum path
      const selectedPath = userCurriculumPaths.find(r => r.id === pathId);
      if (selectedPath && selectedPath.currentNodeId) {
        const currentNode = nodes.find(node => node.id === selectedPath.currentNodeId);
        if (currentNode) {
          setSelectedNode(currentNode);
          setExerciseModalOpen(true);
        }
      }
    } catch (error) {
      console.error('Error continuing learning:', error);
      setSelectionError('Failed to load the selected curriculum path. Please try again.');
    }
  };

  // Get the selected language with proper capitalization
  const getCapitalizedLanguage = (lang: string) => {
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  // Check if there are any available curriculum paths in the system
  const hasAvailableCurriculumPaths = curriculumPaths?.some(path => 
    path.languages?.includes(settings.selectedLanguage)
  ) || false;

  // Detailed debug info
  useEffect(() => {
    console.log("CurriculumPathPage state:", {
      isLoading,
      hasError,
      userAuthenticated: !!user,
      curriculumPaths: curriculumPaths?.length || 0,
      userCurriculumPaths: userCurriculumPaths?.length || 0,
      hasCurrentCurriculumPath: !!currentCurriculumPath,
      nodes: nodes?.length || 0,
      activeTab,
      hasAvailableCurriculumPaths,
      language: settings.selectedLanguage
    });
  }, [
    isLoading, 
    hasError, 
    user, 
    curriculumPaths, 
    userCurriculumPaths, 
    currentCurriculumPath, 
    nodes, 
    activeTab,
    settings.selectedLanguage,
    hasAvailableCurriculumPaths
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
                {selectionError || "Failed to load your curriculum paths. Please try again."}
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

        {!hasAvailableCurriculumPaths && !isLoading && (
          <motion.div 
            className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-2 dark:bg-amber-900/20 dark:border-amber-800"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center">
              <p className="text-amber-800 dark:text-amber-400 font-medium">
                No curriculum paths available for {getCapitalizedLanguage(settings.selectedLanguage)}
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
            <TabsTrigger value="active" disabled={!userCurriculumPaths || userCurriculumPaths.length === 0}>
              My Curriculum Paths
            </TabsTrigger>
            <TabsTrigger value="new">
              New Curriculum Path
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-6">
            {!userCurriculumPaths || userCurriculumPaths.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  You don't have any curriculum paths for {getCapitalizedLanguage(settings.selectedLanguage)} yet. Start a new one to begin your learning journey.
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
                  {userCurriculumPaths.map(path => {
                    // Find the matching curriculum path details
                    const pathDetails = curriculumPaths?.find(r => r.id === path.curriculumPathId);
                    return (
                      <motion.div
                        key={path.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CurriculumPathItemCard
                          curriculumPath={{
                            ...path,
                            name: pathDetails?.name || "Learning Path",
                            level: pathDetails?.level || "A1"
                          }}
                          isActive={currentCurriculumPath?.id === path.id}
                          onCardClick={handleCurriculumPathSelect}
                          onContinueClick={handleContinueLearning}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </TabsContent>
          
          <TabsContent value="new">
            <div className="max-w-md mx-auto w-full">
              <CurriculumPathSelection />
            </div>
          </TabsContent>
        </Tabs>

        {currentCurriculumPath && activeTab === 'active' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="border rounded-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {curriculumPaths?.find(r => r.id === currentCurriculumPath.curriculumPathId)?.name || "Learning Path"} - {getCapitalizedLanguage(currentCurriculumPath.language)}
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
                  Follow this path to improve your {currentCurriculumPath.language} skills step by step
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-8 pt-2">
                {viewMode === 'map' ? (
                  <CurriculumPathVisualization onNodeSelect={handleNodeSelect} />
                ) : (
                  <CurriculumPathProgressDashboard />
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
            
            <CurriculumExerciseModal
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

export default CurriculumPathPage;
