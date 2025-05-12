
import React, { useState } from 'react';
import { useRoadmap } from '@/contexts/RoadmapContext';
import RoadmapVisualization from '@/components/roadmap/RoadmapVisualization';
import RoadmapSelection from '@/components/roadmap/RoadmapSelection';
import RoadmapExerciseModal from '@/components/roadmap/RoadmapExerciseModal';
import { RoadmapNode } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { ArrowRightIcon, ArrowLeftIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const RoadmapPage: React.FC = () => {
  const { currentRoadmap, loading, roadmaps } = useRoadmap();
  const { settings } = useUserSettingsContext();
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const navigate = useNavigate();

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

  // Get the selected language with proper capitalization
  const selectedLanguageCapitalized = settings.selectedLanguage.charAt(0).toUpperCase() + settings.selectedLanguage.slice(1);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            Your {selectedLanguageCapitalized} Learning Path
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

        {!loading && !currentRoadmap ? (
          <div className="max-w-md mx-auto w-full">
            <RoadmapSelection />
          </div>
        ) : (
          <>
            <Card className="border rounded-lg">
              <CardHeader>
                <CardTitle className="text-lg">Learning Roadmap</CardTitle>
                <CardDescription>
                  Follow this path to improve your {settings.selectedLanguage} skills step by step
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
