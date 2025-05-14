
import React, { useState } from 'react';
import { roadmapService } from '@/features/roadmap/api/roadmapService';
import RoadmapVisualization from '@/features/roadmap/components/RoadmapVisualization';
import RoadmapSelection from '@/features/roadmap/components/RoadmapSelection';
import RoadmapExerciseModal from '@/features/roadmap/components/RoadmapExerciseModal';
import { RoadmapNode } from '@/features/roadmap/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const RoadmapPage: React.FC = () => {
  const [userRoadmaps, setUserRoadmaps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("active");

  // Load user roadmaps when component mounts
  React.useEffect(() => {
    const loadUserRoadmaps = async () => {
      try {
        setIsLoading(true);
        const { data: profile } = await supabase.auth.getUser();
        
        if (!profile?.user) {
          setUserRoadmaps([]);
          setActiveTab("new");
          return;
        }
        
        const { data: userSettingsData } = await supabase
          .from('profiles')
          .select('selected_language')
          .eq('id', profile.user.id)
          .single();
          
        if (!userSettingsData) {
          setUserRoadmaps([]);
          setActiveTab("new");
          return;
        }
        
        const roadmaps = await roadmapService.getUserRoadmaps(userSettingsData.selected_language);
        setUserRoadmaps(roadmaps);
        
        // If user has no roadmaps, switch to new tab
        if (roadmaps.length === 0) {
          setActiveTab("new");
        }
        
      } catch (error) {
        console.error("Error loading user roadmaps:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserRoadmaps();
  }, []);

  const handleNodeSelect = (node: RoadmapNode) => {
    setSelectedNode(node);
    setExerciseModalOpen(true);
  };

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
              {userRoadmaps.map(roadmap => (
                <Card key={roadmap.id}>
                  <CardHeader>
                    <CardTitle>{roadmap.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RoadmapVisualization 
                      roadmapId={roadmap.id} 
                      onNodeSelect={handleNodeSelect} 
                    />
                  </CardContent>
                </Card>
              ))}
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
