
import React, { useState } from 'react';
import { useRoadmap } from '@/hooks/use-roadmap';
import RoadmapVisualization from '@/features/roadmap/components/RoadmapVisualization';
import RoadmapSelection from '@/components/roadmap/RoadmapSelection';
import RoadmapExerciseModal from '@/features/roadmap/components/RoadmapExerciseModal';
import { RoadmapNode } from '@/features/roadmap/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const RoadmapPage: React.FC = () => {
  const { userRoadmaps, currentRoadmap, isLoading } = useRoadmap();
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("active");

  const handleNodeSelect = (node: RoadmapNode) => {
    setSelectedNode(node);
    setExerciseModalOpen(true);
  };

  // Set active tab based on whether we have user roadmaps or not
  React.useEffect(() => {
    if (!isLoading) {
      if (userRoadmaps.length === 0) {
        setActiveTab("new");
      } else {
        setActiveTab("active");
      }
    }
  }, [isLoading, userRoadmaps.length]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Learning Paths</h1>

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
            <div className="space-y-4">
              {currentRoadmap && (
                <Card>
                  <CardHeader>
                    <CardTitle>{currentRoadmap.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RoadmapVisualization onNodeSelect={handleNodeSelect} />
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="new">
          <RoadmapSelection />
        </TabsContent>
      </Tabs>

      <RoadmapExerciseModal
        node={selectedNode}
        isOpen={exerciseModalOpen}
        onOpenChange={setExerciseModalOpen}
      />
    </div>
  );
};

export default RoadmapPage;
