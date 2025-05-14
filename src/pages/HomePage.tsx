
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useRoadmap } from '@/hooks/use-roadmap';
import { Button } from '@/components/ui/button';
import { RoadmapItem } from '@/features/roadmap/types';
import { Loader2, MapIcon } from 'lucide-react';
import ExerciseGrid from '@/components/exercises/ExerciseGrid';
import RoadmapSelection from '@/components/roadmap/RoadmapSelection';
import RoadmapVisualization from '@/components/roadmap/RoadmapVisualization';
import RoadmapExerciseModal from '@/components/roadmap/RoadmapExerciseModal';
import { useState } from 'react';
import { RoadmapNode } from '@/types';

const HomePage: React.FC = () => {
  const { currentNodeId, nodes, isLoading, roadmaps } = useRoadmap();
  const userSettings = useUserSettingsContext();
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Get current roadmap from the context
  const { currentRoadmap, userRoadmaps, loadUserRoadmaps } = useRoadmap();

  // Load user roadmaps on component mount
  useEffect(() => {
    if (loadUserRoadmaps) {
      loadUserRoadmaps(userSettings.settings.selectedLanguage).catch(error => {
        console.error('Error loading user roadmaps:', error);
      });
    }
  }, [userSettings.settings.selectedLanguage, loadUserRoadmaps]);

  // Handle node selection
  const handleNodeSelect = (node: RoadmapNode) => {
    setSelectedNode(node);
    setModalOpen(true);
  };

  // Check if user has any roadmaps
  const hasRoadmaps = userRoadmaps && userRoadmaps.length > 0;
  
  // For type safety, ensure currentRoadmap is an RoadmapItem and not an array
  const isSingleRoadmap = currentRoadmap && !Array.isArray(currentRoadmap);
  const roadmapId = isSingleRoadmap ? (currentRoadmap as RoadmapItem).roadmapId : undefined;
  
  // Use a strong type assertion for roadmap
  const roadmap = isSingleRoadmap ? currentRoadmap as RoadmapItem : null;
  
  // Get matching roadmap details
  const roadmapDetails = roadmapId ? roadmaps?.find(r => r.id === roadmapId) : null;
  
  // Check for active roadmap
  const hasActiveRoadmap = roadmap && roadmapDetails;

  return (
    <Layout>
      <div className="container px-4 py-6 mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Track your learning progress and continue where you left off
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-8">
          <div className="md:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Your Learning Path</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/roadmap')}
              >
                <MapIcon className="h-4 w-4 mr-2" />
                All Roadmaps
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : hasActiveRoadmap ? (
              <div className="bg-background rounded-lg border shadow-sm">
                <RoadmapVisualization onNodeSelect={handleNodeSelect} />
              </div>
            ) : (
              <div className="bg-background rounded-lg border shadow-sm overflow-hidden">
                <div className="p-8">
                  <h3 className="text-lg font-semibold mb-2">Start Your Learning Journey</h3>
                  <p className="text-muted-foreground mb-6">
                    Choose a learning path tailored to your language level to start practicing with guided exercises.
                  </p>
                  <RoadmapSelection />
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-4">
            <div className="sticky top-8">
              <h2 className="text-2xl font-bold mb-6">Quick Practice</h2>
              <div className="space-y-8">
                <ExerciseGrid limit={3} showHeader={false} />
                <div className="text-center">
                  <Link to="/exercises">
                    <Button variant="outline">
                      View All Exercises
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <RoadmapExerciseModal 
        node={selectedNode}
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
      />
    </Layout>
  );
};

export default HomePage;
