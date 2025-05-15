import React, { useState, useEffect } from 'react';
import { useRoadmap } from '@/hooks/use-roadmap';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ListChecks, Undo2, CheckCircle2, LockIcon, ChevronRight, AlertCircle } from 'lucide-react';
import { RoadmapNode, LanguageLevel } from '@/types';
import RoadmapExerciseModal from '@/components/roadmap/RoadmapExerciseModal';
import ErrorBoundary from '@/components/ErrorBoundary';
import { registerOpenPopup, unregisterPopup } from '@/utils/popupStateManager';

const RoadmapPage = () => {
  const { settings } = useUserSettingsContext();
  const { user } = useAuth();
  const [initialLoad, setInitialLoad] = useState(true);
  const [roadmapModal, setRoadmapModal] = useState(false);
  const [exerciseModal, setExerciseModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Get roadmap context
  const { 
    initializeUserRoadmap, 
    loadUserRoadmap, 
    currentRoadmap, 
    nodes, 
    completedNodes, 
    availableNodes,
    isLoading,
    loadUserRoadmaps, 
    userRoadmaps,
    resetProgress,
    errorState,
    tryAlternateLanguage,
    setRoadmapPageActive
  } = useRoadmap();

  // Track if we're on the roadmap page
  useEffect(() => {
    setRoadmapPageActive(true);
    
    return () => {
      setRoadmapPageActive(false);
    };
  }, [setRoadmapPageActive]);

  // Track dialog open state for preventing background refreshes
  useEffect(() => {
    const modalId = 'roadmap-selection-modal';
    if (roadmapModal) {
      registerOpenPopup(modalId);
    } else {
      unregisterPopup(modalId);
    }
    return () => unregisterPopup(modalId);
  }, [roadmapModal]);

  // Track exercise modal state
  useEffect(() => {
    const modalId = 'exercise-modal';
    if (exerciseModal) {
      registerOpenPopup(modalId);
    } else {
      unregisterPopup(modalId);
    }
    return () => unregisterPopup(modalId);
  }, [exerciseModal]);

  // Show roadmap selection modal on first load if no roadmap is selected
  useEffect(() => {
    if (initialLoad && !isLoading) {
      if (!currentRoadmap) {
        setRoadmapModal(true);
      }
      setInitialLoad(false);
    }
  }, [initialLoad, isLoading, currentRoadmap]);

  // Load user's roadmaps ONLY on mount and when language changes, not continuously
  useEffect(() => {
    if (user) {
      // Pass the selectedLanguage parameter to loadUserRoadmaps
      loadUserRoadmaps(settings.selectedLanguage);
    }
  }, [user, settings.selectedLanguage, loadUserRoadmaps]);

  const handleStartJourney = async (level: LanguageLevel) => {
    setLoadError(null);
    try {
      await initializeUserRoadmap(level, settings.selectedLanguage);
      setRoadmapModal(false);
    } catch (error: any) {
      console.error("Error starting journey:", error);
      
      // Special handling for language not available
      if (error?.code === 'ROADMAP_NOT_AVAILABLE_FOR_LANGUAGE' && error.suggestedLanguage) {
        setLoadError(`${error.message || `No roadmap is available for ${settings.selectedLanguage}.`} Try with ${error.suggestedLanguage} instead.`);
      } else {
        setLoadError(error?.message || "Failed to start learning path. Please try again.");
      }
    }
  };
  
  // Function to try alternate language
  const handleTryAlternateLanguage = async (level: LanguageLevel) => {
    try {
      await tryAlternateLanguage(level, settings.selectedLanguage);
      setRoadmapModal(false);
    } catch (error) {
      console.error("Error with alternate language:", error);
      setLoadError("Failed to start learning path with alternate language.");
    }
  };
  
  // Function to handle selecting a different roadmap
  const handleSelectRoadmap = async (roadmapId: string) => {
    try {
      await loadUserRoadmap(roadmapId);
      setRoadmapModal(false);
    } catch (error) {
      console.error("Error selecting roadmap:", error);
      setLoadError("Failed to load the selected roadmap.");
    }
  };

  // Function to handle click on a node
  const handleNodeClick = (node: RoadmapNode) => {
    // Check if node is available
    if (!availableNodes.includes(node.id)) {
      return; // Node is locked
    }
    
    setSelectedNode(node);
    setExerciseModal(true);
  };

  // Get node status
  const getNodeStatus = (node: RoadmapNode) => {
    if (completedNodes.includes(node.id)) {
      return 'completed';
    } else if (availableNodes.includes(node.id)) {
      return 'available';
    } else {
      return 'locked';
    }
  };

  const handleStartOver = async () => {
    if (!currentRoadmap) return;
    
    try {
      // Call reset with the roadmap ID
      await resetProgress(currentRoadmap.id);
      
      // Reload roadmap data
      loadUserRoadmap(currentRoadmap.id);
    } catch (error) {
      console.error("Error resetting progress:", error);
      setLoadError("Failed to reset progress.");
    }
  };

  // Render node based on its status
  const renderNode = (node: RoadmapNode, index: number) => {
    const status = getNodeStatus(node);
    const isCompleted = status === 'completed';
    const isAvailable = status === 'available';
    const isLocked = status === 'locked';
    
    return (
      <div key={node.id} className="mb-4">
        <Card 
          className={`
            border-l-4 
            ${isCompleted ? 'border-l-green-500' : isAvailable ? 'border-l-blue-500' : 'border-l-gray-300'}
            ${isAvailable ? 'hover:bg-muted/50 cursor-pointer' : ''}
            ${isLocked ? 'opacity-60' : ''}
          `}
          onClick={() => isAvailable && handleNodeClick(node)}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-3 flex-shrink-0">
                {isCompleted ? (
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                ) : isAvailable ? (
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium">{index + 1}</span>
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <LockIcon className="h-4 w-4 text-gray-500" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium">{node.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{node.description}</p>
              </div>
            </div>
            {isAvailable && (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="roadmap-content pt-20 md:pt-24 px-4 md:px-8 pb-24 max-w-[1200px] mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : currentRoadmap ? (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold mb-2 text-primary">
                  {currentRoadmap.name}
                </h1>
                <p className="text-muted-foreground mb-4">
                  {currentRoadmap.description || `Level ${currentRoadmap.level} ${currentRoadmap.language} learning path to help you master the language.`}
                </p>
              </div>
              <div className="flex space-x-2 mt-2 md:mt-0">
                <Button variant="outline" onClick={() => setRoadmapModal(true)}>
                  <ListChecks className="h-4 w-4 mr-2" />
                  Change Path
                </Button>
                <Button onClick={handleStartOver} variant="ghost">
                  <Undo2 className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {nodes.map((node, index) => renderNode(node, index))}
            </div>
            
            {nodes.length === 0 && (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No lessons available for this roadmap yet.</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold mb-4">Start Your Learning Journey</h2>
            <p className="text-muted-foreground mb-6">
              Choose your level to begin a structured learning path in {settings.selectedLanguage}.
            </p>
            
            {errorState.hasError && (
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mb-6 mx-auto max-w-md">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-yellow-700">{errorState.message}</p>
                    {errorState.suggestedLanguage && (
                      <Button
                        variant="link"
                        className="p-0 h-auto text-sm text-blue-600 mt-2"
                        onClick={() => handleTryAlternateLanguage('A1')}
                      >
                        Try with {errorState.suggestedLanguage} instead
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button onClick={() => handleStartJourney('A1')}>Beginner (A1)</Button>
              <Button onClick={() => handleStartJourney('A2')}>Elementary (A2)</Button>
              <Button onClick={() => handleStartJourney('B1')}>Intermediate (B1)</Button>
              <Button onClick={() => handleStartJourney('B2')}>Upper Intermediate (B2)</Button>
            </div>
          </div>
        )}
        
        {/* Roadmap Selection Modal */}
        <Dialog open={roadmapModal} onOpenChange={setRoadmapModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Choose a Learning Path</DialogTitle>
              <DialogDescription>
                Select a learning path that matches your current level in {settings.selectedLanguage}.
              </DialogDescription>
            </DialogHeader>
            
            {loadError && (
              <div className="bg-red-50 p-3 rounded-md border border-red-200 my-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{loadError}</p>
                </div>
              </div>
            )}
            
            <div className="py-4">
              <Tabs defaultValue="my-paths">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="my-paths">My Paths</TabsTrigger>
                  <TabsTrigger value="available">Available</TabsTrigger>
                </TabsList>
                
                <TabsContent value="my-paths" className="mt-4 space-y-4">
                  {userRoadmaps.length > 0 ? (
                    userRoadmaps.map(roadmap => (
                      <Card 
                        key={roadmap.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSelectRoadmap(roadmap.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">{roadmap.name || `${roadmap.level} Path`}</h3>
                              <p className="text-sm text-muted-foreground">
                                {roadmap.description || `Level ${roadmap.level} in ${roadmap.language}`}
                              </p>
                            </div>
                            <Badge>{roadmap.level}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      You haven't started any learning paths yet.
                    </p>
                  )}
                </TabsContent>
                
                <TabsContent value="available" className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <Card 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleStartJourney('A1')}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">Beginner Path</h3>
                            <p className="text-sm text-muted-foreground">
                              Start learning {settings.selectedLanguage} from scratch
                            </p>
                          </div>
                          <Badge>A1</Badge>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleStartJourney('A2')}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">Elementary Path</h3>
                            <p className="text-sm text-muted-foreground">
                              For those with basic knowledge of {settings.selectedLanguage}
                            </p>
                          </div>
                          <Badge>A2</Badge>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleStartJourney('B1')}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">Intermediate Path</h3>
                            <p className="text-sm text-muted-foreground">
                              For those who can communicate in everyday situations
                            </p>
                          </div>
                          <Badge>B1</Badge>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleStartJourney('B2')}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">Upper Intermediate Path</h3>
                            <p className="text-sm text-muted-foreground">
                              For those who can express themselves fluently
                            </p>
                          </div>
                          <Badge>B2</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoadmapModal(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Exercise Modal */}
        <RoadmapExerciseModal
          node={selectedNode}
          isOpen={exerciseModal}
          onOpenChange={setExerciseModal}
        />
      </div>
    </ErrorBoundary>
  );
};

export default RoadmapPage;
