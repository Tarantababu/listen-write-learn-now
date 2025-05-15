
import React, { useState, useEffect } from 'react';
import { useCurriculum } from '@/contexts/CurriculumContext';
import CurriculumVisualization from '@/components/curriculum/CurriculumVisualization';
import CurriculumSelection from '@/components/curriculum/CurriculumSelection';
import CurriculumExerciseModal from '@/components/curriculum/CurriculumExerciseModal';
import CurriculumPathCard from '@/components/curriculum/CurriculumPathCard';
import CurriculumProgressDashboard from '@/components/curriculum/CurriculumProgressDashboard';
import { CurriculumNode } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRightIcon, BookOpen, RefreshCw, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const CurriculumPage: React.FC = () => {
  const { 
    curriculumPaths, 
    userCurriculumPaths,
    loadUserCurriculumPaths,
    selectCurriculumPath,
    isLoading
  } = useCurriculum();
  
  // Derive hasError from context data
  const hasError = !isLoading && userCurriculumPaths.length > 0 && !curriculumPaths.length;
  
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

  const handleCurriculumSelect = async (curriculumPathId: string) => {
    try {
      setSelectionError(null);
      setIsRetrying(false);
      await selectCurriculumPath(curriculumPathId);
      setViewMode('map'); // Switch to map view when selecting a curriculum
    } catch (error) {
      console.error('Error selecting curriculum:', error);
      setSelectionError('Failed to load the selected curriculum. Please try again.');
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
      
      // Reload curriculum first
      await loadUserCurriculumPaths(settings.selectedLanguage);
      console.log("Reloaded curriculum paths:", { userCurriculumPaths });
      
      toast({
        title: "Data refreshed",
        description: "Successfully reloaded your curriculum data."
      });
    } catch (error) {
      console.error('Error retrying curriculum load:', error);
      setSelectionError('Still having trouble loading the curriculum. Please try refreshing the page.');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleContinueLearning = async (curriculumPathId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      setSelectionError(null);
      await selectCurriculumPath(curriculumPathId);
      setViewMode('map');
    } catch (error) {
      console.error('Error continuing learning:', error);
      setSelectionError('Failed to load the selected curriculum. Please try again.');
    }
  };

  // Get the selected language with proper capitalization
  const getCapitalizedLanguage = (lang: string) => {
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  // Check if there are any available curriculum paths in the system
  const hasAvailableCurriculumPaths = curriculumPaths.some(path => 
    path.language === settings.selectedLanguage
  );

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64 flex-col space-y-4">
          <p className="text-muted-foreground">Please log in to access your learning curriculum</p>
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
            <p className="text-muted-foreground">Loading your curriculum...</p>
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
            Your Curriculum
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
                {selectionError || "Failed to load your curriculum. Please try again."}
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
                No curriculum available for {getCapitalizedLanguage(settings.selectedLanguage)}
              </p>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
              There are no learning curricula available for {getCapitalizedLanguage(settings.selectedLanguage)} yet. 
              Please check back later or select a different language in your settings.
            </p>
          </motion.div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="active" disabled={userCurriculumPaths.length === 0}>
              My Curricula
            </TabsTrigger>
            <TabsTrigger value="new">
              New Curriculum
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-6">
            {userCurriculumPaths.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  You don't have any curricula for {getCapitalizedLanguage(settings.selectedLanguage)} yet. Start a new one to begin your learning journey.
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
                  {userCurriculumPaths.map(userPath => {
                    // Find the corresponding curriculum path
                    const curriculumPath = curriculumPaths.find(p => p.id === userPath.curriculumPathId);
                    
                    if (!curriculumPath) return null;
                    
                    return (
                      <motion.div
                        key={userPath.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CurriculumPathCard
                          userCurriculumPath={userPath}
                          curriculumPath={curriculumPath}
                          isActive={userCurriculumPaths[0]?.id === userPath.id}
                          onCardClick={handleCurriculumSelect}
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
              <CurriculumSelection />
            </div>
          </TabsContent>
        </Tabs>

        {userCurriculumPaths.length > 0 && activeTab === 'active' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="border rounded-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {curriculumPaths.find(p => p.id === userCurriculumPaths[0]?.curriculumPathId)?.level || "Learning Path"} - {getCapitalizedLanguage(settings.selectedLanguage)}
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
                  Follow this curriculum to improve your {settings.selectedLanguage} skills step by step
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-8 pt-2">
                {viewMode === 'map' ? (
                  <CurriculumVisualization onNodeSelect={handleNodeSelect} />
                ) : (
                  <CurriculumProgressDashboard />
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

export default CurriculumPage;
