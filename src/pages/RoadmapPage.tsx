
import React, { useState } from 'react';
import { useRoadmapContext } from '@/contexts/RoadmapContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RoadmapView from '@/components/roadmaps/RoadmapView';
import RoadmapSelector from '@/components/roadmaps/RoadmapSelector';
import RoadmapExerciseModal from '@/components/roadmaps/RoadmapExerciseModal';
import { RoadmapNode } from '@/services/roadmapService';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Loader2, Map } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

const RoadmapPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { settings } = useUserSettingsContext();
  const { 
    currentLanguageRoadmap, 
    loadingUserRoadmaps, 
    markNodeComplete, 
    refreshUserRoadmaps 
  } = useRoadmapContext();
  
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);

  const handleNodeClick = (node: RoadmapNode) => {
    setSelectedNode(node);
    setIsExerciseModalOpen(true);
  };

  const handleExerciseComplete = async (nodeId: string, success: boolean) => {
    if (success) {
      await markNodeComplete(nodeId, true);
      await refreshUserRoadmaps();
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Map className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign in to access Roadmaps</h2>
          <p className="mb-6 text-muted-foreground">
            You need to be signed in to use language learning roadmaps
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button variant="outline" onClick={() => navigate('/signup')}>
              Create Account
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loadingUserRoadmaps) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-56 mb-4" />
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {Array.from({ length: 18 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {settings.selectedLanguage.charAt(0).toUpperCase() + settings.selectedLanguage.slice(1)} Roadmap
        </h1>
        <p className="text-muted-foreground">
          Follow a structured path to improve your language skills
        </p>
      </div>
      
      {!currentLanguageRoadmap ? (
        <RoadmapSelector onRoadmapSelected={refreshUserRoadmaps} />
      ) : (
        <>
          <RoadmapView 
            userRoadmap={currentLanguageRoadmap}
            onNodeClick={handleNodeClick}
          />
          
          <RoadmapExerciseModal
            isOpen={isExerciseModalOpen}
            onOpenChange={setIsExerciseModalOpen}
            node={selectedNode}
            onExerciseComplete={handleExerciseComplete}
          />
        </>
      )}
    </div>
  );
};

export default RoadmapPage;
