
import React, { useState, useEffect } from 'react';
import { useRoadmap } from '@/features/roadmap/context/RoadmapContext';
import RoadmapVisualization from '@/features/roadmap/components/RoadmapVisualization';
import RoadmapSelection from '@/features/roadmap/components/RoadmapSelection';
import RoadmapExerciseModal from '@/features/roadmap/components/RoadmapExerciseModal';
import RoadmapItemCard from '@/features/roadmap/components/RoadmapItemCard';
import { RoadmapNode } from '@/features/roadmap/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { ArrowRightIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

const RoadmapPage: React.FC = () => {
  const { 
    currentRoadmap, 
    isLoading, 
    roadmaps, 
    userRoadmaps, 
    selectRoadmap,
    completedNodes,
    nodes,
    currentNodeId
  } = useRoadmap();
  
  const { settings } = useUserSettingsContext();
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("active");
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
    toast.info('You can find more exercises here', { 
      description: 'Browse and practice additional exercises outside the roadmap'
    });
  };

  const handleRoadmapSelect = (roadmapId: string) => {
    selectRoadmap(roadmapId);
  };

  const handleContinueLearning = (roadmapId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // First select the roadmap
    selectRoadmap(roadmapId);
    
    // Find the current node in this roadmap
    const selectedRoadmap = userRoadmaps.find(r => r.id === roadmapId);
    if (selectedRoadmap && selectedRoadmap.currentNodeId) {
      const currentNode = nodes.find(node => node.id === selectedRoadmap.currentNodeId);
      if (currentNode) {
        setSelectedNode(currentNode);
        setExerciseModalOpen(true);
      }
    }
  };

  // Get the selected language with proper capitalization
  const getCapitalizedLanguage = (lang: string) => {
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Loading roadmaps...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
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
        </div>

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
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">{getCapitalizedLanguage(settings.selectedLanguage)}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userRoadmaps.map(roadmap => (
                    <RoadmapItemCard
                      key={roadmap.id}
                      roadmap={roadmap}
                      isActive={currentRoadmap?.id === roadmap.id}
                      onCardClick={handleRoadmapSelect}
                      onContinueClick={handleContinueLearning}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="new">
            <div className="max-w-md mx-auto w-full">
              <RoadmapSelection />
            </div>
          </TabsContent>
        </Tabs>

        {currentRoadmap && activeTab === 'active' && (
          <>
            <Card className="border rounded-lg">
              <CardHeader>
                <CardTitle className="text-lg">
                  {roadmaps.find(r => r.id === currentRoadmap.roadmapId)?.name || "Learning Path"} - {getCapitalizedLanguage(currentRoadmap.language)}
                </CardTitle>
                <CardDescription>
                  Follow this path to improve your {currentRoadmap.language} skills step by step
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-8 pt-2">
                <RoadmapVisualization onNodeSelect={handleNodeSelect} />
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
          </>
        )}
      </div>
    </div>
  );
};

export default RoadmapPage;
