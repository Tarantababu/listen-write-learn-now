
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

  useEffect(() => {
    if (node && isOpen) {
      loadExercise(node.id);
    } else {
      setExercise(null);
      setIsPracticing(false);
      setCompletionCount(0);
    }
  }, [node, isOpen]);

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
          // Close the modal after completing node
          setTimeout(() => {
            onOpenChange(false);
          }, 1500);
        });
      }
    } else {
      toast({
        title: "Keep practicing!",
        description: `You scored ${Math.round(accuracy)}%. Try to get above 95% for it to count toward completion.`,
      });
    }
  };

  const isNodeCompleted = node ? completedNodes.includes(node.id) : false;

  if (!node) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                audioUrl: exercise.audio_url, // Corrected property name
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
