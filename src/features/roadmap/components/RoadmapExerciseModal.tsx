
import React, { useEffect, useState } from 'react';
import { RoadmapNode, ExerciseContent } from '../types';
import { roadmapService } from '../api/roadmapService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, PlayCircle, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import confetti from 'canvas-confetti';

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
  const [exercise, setExercise] = useState<ExerciseContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Load exercise content when a node is selected
  useEffect(() => {
    const loadExercise = async () => {
      if (node && isOpen) {
        setIsLoading(true);
        try {
          const exerciseContent = await roadmapService.getNodeExercise(node.id);
          setExercise(exerciseContent);
        } catch (error) {
          console.error("Error loading exercise:", error);
          toast({
            variant: "destructive",
            title: "Error loading exercise",
            description: "Failed to load exercise content. Please try again."
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setExercise(null);
      }
    };

    loadExercise();
  }, [node, isOpen]);

  const handleCompleteNode = async () => {
    if (!node) return;
    
    setIsCompleting(true);
    try {
      await roadmapService.completeNode(node.id, node.roadmapId);
      
      // Trigger confetti animation
      if (typeof window !== 'undefined') {
        confetti({
          particleCount: 200,
          spread: 90,
          origin: { y: 0.6 }
        });
      }
      
      toast({
        title: "Exercise completed!",
        description: "Great job! You've completed this exercise."
      });
      
      // Close the modal
      onOpenChange(false);
      
      // Let the animation finish before fully closing
      setTimeout(() => {
        setExercise(null);
      }, 500);
      
    } catch (error) {
      console.error("Error completing node:", error);
      toast({
        variant: "destructive",
        title: "Error completing exercise",
        description: "Failed to mark exercise as completed. Please try again."
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>
              {node?.title || "Exercise"}
              {node?.isBonus && (
                <Badge variant="outline" className="ml-2 bg-amber-500/20 text-amber-700 border-amber-200">
                  <Star className="h-3 w-3 mr-1 text-amber-500" />
                  Bonus
                </Badge>
              )}
            </DialogTitle>
          </div>
          <DialogDescription>
            {node?.description || "Complete this exercise to progress on your learning path."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : exercise ? (
            <div className="space-y-6">
              <div className="bg-muted rounded-md p-5 relative">
                <h3 className="font-medium text-lg mb-3">{exercise.title}</h3>
                
                {exercise.tags && exercise.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {exercise.tags.map((tag) => (
                      <Badge variant="outline" key={tag} className="text-xs py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="whitespace-pre-line">
                  {exercise.text}
                </div>
              </div>
              
              {exercise.audioUrl && (
                <div className="rounded-md border p-4 bg-background">
                  <div className="mb-2 text-sm font-medium">Audio Exercise</div>
                  <AspectRatio ratio={16/3} className="bg-muted rounded-md">
                    <div className="flex items-center justify-center h-full">
                      <audio 
                        controls 
                        className="w-full max-w-md"
                        controlsList="nodownload"
                      >
                        <source src={exercise.audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </AspectRatio>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No exercise content available for this node.
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button 
            onClick={handleCompleteNode} 
            disabled={isCompleting || isLoading || !exercise}
            className="gap-2"
          >
            {isCompleting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            {node?.status === 'completed' ? "Mark as Reviewed" : "Mark as Completed"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoadmapExerciseModal;
