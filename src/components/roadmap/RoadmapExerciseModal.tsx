
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRoadmap } from '@/contexts/RoadmapContext';
import { RoadmapNode } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import DictationPractice from '@/components/DictationPractice';

interface RoadmapExerciseModalProps {
  node: RoadmapNode | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const RoadmapExerciseModal: React.FC<RoadmapExerciseModalProps> = ({ node, isOpen, onOpenChange }) => {
  const { 
    markNodeAsCompleted, 
    getNodeExercise, 
    nodeLoading, 
    completedNodes, 
    incrementNodeCompletion,
    nodeProgress 
  } = useRoadmap();
  
  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Sync our internal state with the parent's state
  useEffect(() => {
    setModalOpen(isOpen);
  }, [isOpen]);

  // Load exercise when modal is opened with a node
  useEffect(() => {
    if (node && modalOpen) {
      loadExercise(node.id);
    } else if (!modalOpen) {
      // Reset states when modal is completely closed
      setExercise(null);
      setIsPracticing(false);
    }
  }, [node, modalOpen]);

  const loadExercise = async (nodeId: string) => {
    try {
      setLoading(true);
      const exerciseData = await getNodeExercise(nodeId);
      setExercise(exerciseData);
    } catch (error) {
      console.error("Error loading exercise:", error);
      toast({
        title: "Failed to load exercise",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = () => {
    setIsPracticing(true);
  };

  const handleBackFromPractice = () => {
    setIsPracticing(false);
  };

  const handleMarkCompleted = async () => {
    if (!node) return;
    
    try {
      await markNodeAsCompleted(node.id);
      toast({
        title: "Progress saved!",
        description: "You've completed this exercise",
      });
      handleModalClose(false); // Close the modal after marking as completed
    } catch (error) {
      console.error("Error marking node as completed:", error);
      toast({
        title: "Failed to save progress",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handlePracticeComplete = (accuracy: number) => {
    if (!node) return;

    // Save the practice result and increment completion count if accuracy is high enough
    incrementNodeCompletion(node.id, accuracy);
    
    // Show feedback based on accuracy
    if (accuracy >= 95) {
      toast({
        title: "Great job!",
        description: `You scored ${Math.round(accuracy)}%. Your progress has been saved.`,
      });
    } else {
      toast({
        title: "Keep practicing!",
        description: `You scored ${Math.round(accuracy)}%. Try to get above 95% for it to count toward completion.`,
      });
    }
  };

  // Handle modal close
  const handleModalClose = (open: boolean) => {
    // Always update our internal state
    setModalOpen(open);
    
    // Notify parent component of state change
    // Use setTimeout to ensure state updates finish first
    setTimeout(() => {
      onOpenChange(open);
    }, 10);
  };

  // Get the completion count for this node (if it exists)
  const nodeCompletionInfo = node ? 
    nodeProgress.find(np => np.nodeId === node.id) : 
    null;
  
  const completionCount = nodeCompletionInfo?.completionCount || 0;
  const isNodeCompleted = node ? completedNodes.includes(node.id) || nodeCompletionInfo?.isCompleted : false;

  if (!node) {
    return null;
  }

  return (
    <Dialog open={modalOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{node.title}</DialogTitle>
          <DialogDescription>
            {node.description}
          </DialogDescription>
        </DialogHeader>
        
        {isPracticing ? (
          exercise ? (
            <DictationPractice
              exercise={{
                id: `roadmap-${node.id}`,
                title: exercise.title || node.title,
                text: exercise.text || "",
                language: node.language || 'english',
                audioUrl: exercise.audio_url,
                tags: [],
                directoryId: null,
                createdAt: new Date(),
                completionCount: 0,
                isCompleted: false
              }}
              onTryAgain={handleBackFromPractice}
              onComplete={handlePracticeComplete}
            />
          ) : (
            <div className="text-center py-6">
              <p>No exercise content available.</p>
              <Button onClick={() => setIsPracticing(false)} className="mt-4">
                Go Back
              </Button>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-x-2 flex items-center">
                <Badge variant={isNodeCompleted ? "secondary" : "outline"}>
                  {isNodeCompleted ? "Completed" : "Not Completed"}
                </Badge>
                {node.isBonus && (
                  <Badge variant="secondary">Bonus</Badge>
                )}
              </div>
              <div className="text-sm">
                {completionCount > 0 && (
                  <span className="text-muted-foreground">
                    Progress: {completionCount}/3
                  </span>
                )}
              </div>
            </div>
            
            {exercise ? (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-2">{exercise.title || "Exercise"}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{exercise.description || "Practice this exercise to improve your skills."}</p>
                  <div className="flex justify-end">
                    <Button onClick={handleStartPractice}>
                      Start Practice
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : loading ? (
              <div className="text-center py-6">
                <p>Loading exercise...</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <p>No exercise available for this lesson.</p>
                {!isNodeCompleted && (
                  <Button onClick={handleMarkCompleted} className="mt-4">
                    Mark as Completed
                  </Button>
                )}
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => handleModalClose(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RoadmapExerciseModal;
