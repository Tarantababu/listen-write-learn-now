
import React, { useState, useEffect } from 'react';
import { useRoadmap } from '@/contexts/RoadmapContext';
import RoadmapVisualization from '@/components/roadmap/RoadmapVisualization';
import RoadmapSelection from '@/components/roadmap/RoadmapSelection';
import RoadmapExerciseModal from '@/components/roadmap/RoadmapExerciseModal';
import { RoadmapNode, UserRoadmap, LanguageLevel } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { ArrowRightIcon, ArrowLeftIcon, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LevelBadge from '@/components/LevelBadge';
import { Loader2 } from 'lucide-react';

const RoadmapPage: React.FC = () => {
  const { 
    currentRoadmap, 
    loading, 
    roadmaps, 
    userRoadmaps, 
    selectRoadmap,
    completedNodes,
    nodes 
  } = useRoadmap();
  
  const { settings } = useUserSettingsContext();
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("active");
  const navigate = useNavigate();

  // Set active tab based on whether we have user roadmaps or not
  useEffect(() => {
    if (!loading) {
      if (userRoadmaps.length === 0) {
        setActiveTab("new");
      } else {
        setActiveTab("active");
      }
    }
  }, [loading, userRoadmaps]);

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

  const handleRoadmapSelect = async (roadmapId: string) => {
    await selectRoadmap(roadmapId);
  };

  // Group user roadmaps by language
  const roadmapsByLanguage = userRoadmaps.reduce<Record<string, UserRoadmap[]>>((acc, roadmap) => {
    if (!acc[roadmap.language]) {
      acc[roadmap.language] = [];
    }
    acc[roadmap.language].push(roadmap);
    return acc;
  }, {});

  // Get the selected language with proper capitalization
  const getCapitalizedLanguage = (lang: string) => {
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  // Calculate progress percentage for a roadmap
  const calculateProgress = (roadmapId: string): number => {
    const roadmapNodes = nodes.filter(node => node.roadmapId === roadmapId);
    if (roadmapNodes.length === 0) return 0;
    
    const completedRoadmapNodes = roadmapNodes.filter(
      node => completedNodes.includes(node.id)
    );
    
    return Math.round((completedRoadmapNodes.length / roadmapNodes.length) * 100);
  };

  // Get roadmap name from its ID
  const getRoadmapName = (roadmapId: string): string => {
    const roadmap = roadmaps.find(r => r.id === roadmapId);
    return roadmap ? roadmap.name : 'Learning Path';
  };
  
  // Get roadmap level from its ID
  const getRoadmapLevel = (roadmapId: string): string | undefined => {
    const roadmap = roadmaps.find(r => r.id === roadmapId);
    return roadmap?.level;
  };

  if (loading) {
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
                  You don't have any roadmaps yet. Start a new one to begin your learning journey.
                </p>
              </div>
            ) : (
              <>
                {/* Display roadmaps grouped by language */}
                {Object.entries(roadmapsByLanguage).map(([language, roadmaps]) => (
                  <div key={language} className="space-y-4">
                    <h2 className="text-xl font-semibold">{getCapitalizedLanguage(language)}</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {roadmaps.map(roadmap => {
                        const isActive = currentRoadmap?.id === roadmap.id;
                        const progress = calculateProgress(roadmap.roadmapId);
                        const roadmapName = getRoadmapName(roadmap.roadmapId);
                        const roadmapLevel = getRoadmapLevel(roadmap.roadmapId);
                        
                        return (
                          <Card 
                            key={roadmap.id} 
                            className={`cursor-pointer transition-all ${isActive ? 'border-primary shadow-md' : 'hover:border-primary/50'}`}
                            onClick={() => handleRoadmapSelect(roadmap.id)}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{roadmapName}</CardTitle>
                                {isActive && (
                                  <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                                    Current
                                  </span>
                                )}
                              </div>
                              <CardDescription className="flex items-center gap-2">
                                {roadmapLevel && <LevelBadge level={roadmapLevel as LanguageLevel} />}
                                <span>Started on {roadmap.createdAt.toLocaleDateString()}</span>
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center space-x-2">
                                <div className="bg-muted h-2 flex-1 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-primary h-full" 
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{progress}%</span>
                              </div>
                              
                              <div className="mt-3 flex justify-end">
                                <Button
                                  variant={isActive ? "default" : "outline"} 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRoadmapSelect(roadmap.id);
                                  }}
                                >
                                  {isActive ? 'Continue Learning' : 'View Roadmap'}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
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
                  {getRoadmapName(currentRoadmap.roadmapId)} - {getCapitalizedLanguage(currentRoadmap.language)}
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
