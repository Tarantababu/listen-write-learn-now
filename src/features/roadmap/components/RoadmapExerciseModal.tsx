
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Lock } from 'lucide-react';
import { RoadmapNode } from '../types';
import { useRoadmap } from '@/hooks/use-roadmap';
import ExerciseContent from '@/components/ExerciseContent';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { nodeAccessService } from '../services/NodeAccessService';

interface RoadmapExerciseModalProps {
  node: RoadmapNode | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const RoadmapExerciseModal: React.FC<RoadmapExerciseModalProps> = ({ 
  node, 
  isOpen, 
  onOpenChange 
}) => {
  const [loading, setLoading] = useState(true);
  const [accessChecking, setAccessChecking] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [exerciseContent, setExerciseContent] = useState<any | null>(null);
  const { getNodeExercise, markNodeAsCompleted } = useRoadmap();

  // Check if node is accessible and load exercise content
  useEffect(() => {
    const loadExercise = async () => {
      if (!node || !isOpen) return;
      
      setLoading(true);
      setAccessChecking(true);
      
      try {
        // Verify node access first (server-side validation)
        const { data: canAccess, error: accessError } = await nodeAccessService.canAccessNode(node.id);
        
        if (accessError) {
          console.error("Error checking node access:", accessError);
          toast({
            variant: "destructive",
            title: "Access error",
            description: "Unable to verify access to this content"
          });
          setHasAccess(false);
          setAccessChecking(false);
          setLoading(false);
          return;
        }
        
        if (!canAccess) {
          console.log("Node access denied:", node.id);
          toast({
            variant: "destructive",
            title: "Access denied",
            description: "You need to complete previous lessons first"
          });
          setHasAccess(false);
          setAccessChecking(false);
          setLoading(false);
          return;
        }
        
        // User has access, load the exercise
        setHasAccess(true);
        setAccessChecking(false);
        
        // Load exercise content
        const exercise = await getNodeExercise(node.id);
        setExerciseContent(exercise);
      } catch (error) {
        console.error("Error loading exercise:", error);
        toast({
          variant: "destructive",
          title: "Loading error",
          description: "Failed to load exercise content"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadExercise();
  }, [node, isOpen, getNodeExercise]);

  const handleCompleteLater = () => {
    onOpenChange(false);
  };

  const handleMarkComplete = async () => {
    if (!node) return;
    
    try {
      await markNodeAsCompleted(node.id);
      toast({
        title: "Lesson completed",
        description: "You've completed this lesson and unlocked the next one"
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error marking node as complete:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark lesson as complete"
      });
    }
  };

  if (!node) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {node.title}
          </DialogTitle>
        </DialogHeader>
        
        {accessChecking ? (
          <div className="flex flex-col items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Checking access...</p>
          </div>
        ) : !hasAccess ? (
          <Card className="p-6 flex flex-col items-center text-center">
            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Lesson Locked</h3>
            <p className="text-muted-foreground mb-4">
              You need to complete previous lessons before accessing this one.
              Follow the learning path in order to unlock this content.
            </p>
            <Button onClick={() => onOpenChange(false)}>
              Return to Roadmap
            </Button>
          </Card>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading exercise content...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {node.description && (
              <p className="text-muted-foreground">{node.description}</p>
            )}
            
            {exerciseContent ? (
              <ExerciseContent 
                exercise={exerciseContent}
                showActions={false}
              />
            ) : (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">No exercise content available for this lesson.</p>
              </Card>
            )}
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleCompleteLater}>
                Complete Later
              </Button>
              <Button onClick={handleMarkComplete}>
                Mark as Complete
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RoadmapExerciseModal;
