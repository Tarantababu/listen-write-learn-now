
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useRoadmap } from '@/hooks/use-roadmap';
import { Loader2, PlusCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RoadmapSelection from '@/features/roadmap/components/RoadmapSelection';
import RoadmapVisualization from '@/features/roadmap/components/RoadmapVisualization';
import RoadmapExerciseModal from '@/features/roadmap/components/RoadmapExerciseModal';
import { RoadmapItem } from '@/features/roadmap/types';
import { RoadmapNode } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import LevelBadge from '@/components/LevelBadge';
import { toast } from '@/components/ui/use-toast';

const RoadmapPage = () => {
  const { settings } = useUserSettingsContext();
  const { 
    isLoading,
    hasError,
    roadmaps,
    userRoadmaps,
    loadUserRoadmaps,
    selectRoadmap,
    currentRoadmap,
    nodes,
    currentNodeId
  } = useRoadmap();
  
  const [activeTab, setActiveTab] = useState('current');
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Load user roadmaps when the component mounts or language changes
  useEffect(() => {
    if (loadUserRoadmaps) {
      loadUserRoadmaps(settings.selectedLanguage)
        .then(() => {
          // If there's at least one roadmap, select the first one
          if (userRoadmaps && userRoadmaps.length > 0 && selectRoadmap) {
            const firstRoadmap = userRoadmaps[0];
            setSelectedRoadmapId(firstRoadmap.id);
            selectRoadmap(firstRoadmap.id).catch(console.error);
          }
        })
        .catch(error => {
          console.error('Error loading roadmaps:', error);
          toast({
            variant: "destructive",
            title: "Error loading roadmaps",
            description: "There was a problem loading your roadmaps. Please try again.",
          });
        });
    }
  }, [settings.selectedLanguage, loadUserRoadmaps]);

  // Refresh user roadmaps
  const handleRefreshRoadmaps = async () => {
    if (!loadUserRoadmaps) return;
    
    setRefreshing(true);
    try {
      await loadUserRoadmaps(settings.selectedLanguage);
      toast({
        title: "Roadmaps refreshed",
        description: "Your roadmaps have been refreshed.",
      });
    } catch (error) {
      console.error('Error refreshing roadmaps:', error);
      toast({
        variant: "destructive",
        title: "Error refreshing roadmaps",
        description: "There was a problem refreshing your roadmaps. Please try again.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Change the selected roadmap
  const handleRoadmapChange = async (roadmapId: string) => {
    if (!selectRoadmap) return;
    
    setSelectedRoadmapId(roadmapId);
    try {
      await selectRoadmap(roadmapId);
    } catch (error) {
      console.error('Error selecting roadmap:', error);
      toast({
        variant: "destructive",
        title: "Error loading roadmap",
        description: "There was a problem loading the selected roadmap. Please try again.",
      });
    }
  };

  // Handle node selection (for opening the exercise modal)
  const handleNodeSelect = (node: RoadmapNode) => {
    setSelectedNode(node);
    setModalOpen(true);
  };

  // Get the current selected roadmap details
  const getSelectedRoadmapDetails = () => {
    if (!selectedRoadmapId || !userRoadmaps) return null;
    
    const userRoadmap = userRoadmaps.find(r => r.id === selectedRoadmapId);
    if (!userRoadmap) return null;
    
    const roadmapInfo = roadmaps?.find(r => r.id === userRoadmap.roadmapId);
    return {
      ...userRoadmap,
      name: roadmapInfo?.name || 'Unnamed Roadmap',
      level: roadmapInfo?.level || 'A1'
    };
  };

  const selectedRoadmapDetails = getSelectedRoadmapDetails();
  const hasUserRoadmaps = userRoadmaps && userRoadmaps.length > 0;

  // Render loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="container px-4 py-12 mx-auto max-w-7xl">
          <div className="flex justify-center">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Loading your roadmaps...</h2>
              <p className="text-muted-foreground mt-2">Please wait while we load your learning paths</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Render error state
  if (hasError) {
    return (
      <Layout>
        <div className="container px-4 py-12 mx-auto max-w-7xl">
          <div className="text-center max-w-lg mx-auto">
            <h2 className="text-xl font-semibold text-destructive">Error Loading Roadmaps</h2>
            <p className="mt-2 text-muted-foreground">
              There was a problem loading your learning paths. Please try refreshing the page.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={handleRefreshRoadmaps}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Learning Paths</h1>
            <p className="text-muted-foreground mt-1">
              Guided learning paths to help you improve your {settings.selectedLanguage} skills
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefreshRoadmaps}
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => setActiveTab('add')}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Path
            </Button>
          </div>
        </div>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-8"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="current">My Learning Paths</TabsTrigger>
            <TabsTrigger value="add">Add New Path</TabsTrigger>
          </TabsList>
          
          <TabsContent value="current" className="space-y-8">
            {!hasUserRoadmaps ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Learning Paths Yet</CardTitle>
                  <CardDescription>
                    You haven't started any learning paths for {settings.selectedLanguage} yet. 
                    Switch to the "Add New Path" tab to get started.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setActiveTab('add')}>Add Learning Path</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-3">
                  <div className="sticky top-8 space-y-6">
                    <h2 className="text-xl font-semibold">Your Paths</h2>
                    <div className="space-y-2">
                      {userRoadmaps.map(userRoadmap => {
                        const roadmapInfo = roadmaps?.find(r => r.id === userRoadmap.roadmapId);
                        return (
                          <Card 
                            key={userRoadmap.id}
                            className={`cursor-pointer hover:bg-accent transition-colors ${
                              selectedRoadmapId === userRoadmap.id ? 'border-primary' : ''
                            }`}
                            onClick={() => handleRoadmapChange(userRoadmap.id)}
                          >
                            <CardHeader className="p-4">
                              <CardTitle className="text-base flex items-center">
                                <LevelBadge level={roadmapInfo?.level || 'A1'} className="mr-2" />
                                {roadmapInfo?.name || 'Unnamed Roadmap'}
                              </CardTitle>
                            </CardHeader>
                          </Card>
                        );
                      })}
                    </div>
                    
                    <Separator />
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab('add')}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add New Path
                    </Button>
                  </div>
                </div>
                
                <div className="lg:col-span-9">
                  {!selectedRoadmapId || !nodes || nodes.length === 0 ? (
                    <div className="p-8 text-center border rounded-lg">
                      <h3 className="text-lg font-medium">Select a learning path</h3>
                      <p className="text-muted-foreground mt-2">
                        Choose a learning path from the sidebar to view its content
                      </p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden bg-background">
                      <RoadmapVisualization 
                        onNodeSelect={handleNodeSelect} 
                        className="p-6"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="add">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Learning Path</CardTitle>
                  <CardDescription>
                    Choose a level that matches your current proficiency in {settings.selectedLanguage}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RoadmapSelection />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <RoadmapExerciseModal
        node={selectedNode}
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
      />
    </Layout>
  );
};

export default RoadmapPage;
