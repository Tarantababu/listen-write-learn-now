
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRoadmap } from '@/contexts/RoadmapContext';
import { RoadmapNode } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import DictationPractice from '@/components/DictationPractice';

interface RoadmapExerciseModalProps {
  node: RoadmapNode | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const RoadmapExerciseModal: React.FC<RoadmapExerciseModalProps> = ({ node, isOpen, onOpenChange }) => {
  const { markNodeAsCompleted, getNodeExercise, nodeLoading, completedNodes } = useRoadmap();
  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [completionCount, setCompletionCount] = useState<number>(0);
  const [forceClose, setForceClose] = useState<boolean>(false);

  useEffect(() => {
    if (node && isOpen && !forceClose) {
      loadExercise(node.id);
    } else if (!isOpen) {
      // Reset states when modal is completely closed
      setExercise(null);
      setIsPracticing(false);
      setCompletionCount(0);
      setForceClose(false);
    }
  }, [node, isOpen, forceClose]);

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
    saveProgress();
    setIsPracticing(false);
  };

  // Function to save progress to database
  const saveProgress = () => {
    if (!node || completionCount === 0) return;
    
    console.log("Saving progress for node:", node.id, "with completion count:", completionCount);
    
    // Save the current progress
    markNodeAsCompleted(node.id)
      .then(() => {
        console.log("Progress saved successfully");
      })
      .catch(error => {
        console.error("Error saving progress:", error);
      });
  };

  const handleMarkCompleted = async () => {
    if (!node) return;
    
    try {
      await markNodeAsCompleted(node.id);
      toast({
        title: "Progress saved!",
        description: "You've completed this exercise",
      });
      onOpenChange(false); // Close the modal after marking as completed
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

    // Increment completion count if accuracy is high enough
    if (accuracy >= 95) {
      const newCount = completionCount + 1;
      setCompletionCount(newCount);
      
      toast({
        title: "Great job!",
        description: `You scored ${Math.round(accuracy)}%. ${newCount >= 3 ? "Exercise completed!" : `${3 - newCount} more successful attempts needed to complete.`}`,
      });
      
      // Mark as completed after 3 successful attempts
      if (newCount >= 3) {
        markNodeAsCompleted(node.id).then(() => {
          // Don't automatically close the modal
          // Let the user close it when ready
        });
      }
    } else {
      toast({
        title: "Keep practicing!",
        description: `You scored ${Math.round(accuracy)}%. Try to get above 95% for it to count toward completion.`,
      });
    }
  };

  // Handle modal close
  const handleModalClose = (open: boolean) => {
    // If modal is being closed while practicing, save progress first
    if (!open) {
      if (isPracticing) {
        saveProgress();
      }
      setForceClose(true); // Force close to prevent reopening
      // Use a small timeout to ensure the modal closing animation completes
      setTimeout(() => {
        onOpenChange(open);
      }, 0);
    } else {
      onOpenChange(open);
    }
  };

  const isNodeCompleted = node ? completedNodes.includes(node.id) : false;

  if (!node) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
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
              <Button variant="outline" onClick={() => onOpenChange(false)}>
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
