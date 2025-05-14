
import React, { useEffect, useState } from 'react';
import { RoadmapNode, ExerciseContent } from '../types';
import { useRoadmap } from '@/hooks/use-roadmap';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

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
  const { getNodeExercise, completeNode } = useRoadmap();
  const [exercise, setExercise] = useState<ExerciseContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Load exercise content when a node is selected
  useEffect(() => {
    const loadExercise = async () => {
      if (node && isOpen) {
        setIsLoading(true);
        try {
          const exerciseContent = await getNodeExercise(node.id);
          setExercise(exerciseContent);
        } finally {
          setIsLoading(false);
        }
      } else {
        setExercise(null);
      }
    };

    loadExercise();
  }, [node, isOpen, getNodeExercise]);

  const handleCompleteNode = async () => {
    if (!node) return;
    
    setIsCompleting(true);
    try {
      await completeNode(node.id);
      // Close the modal after completion
      onOpenChange(false);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{node?.title || "Exercise"}</DialogTitle>
          <DialogDescription>
            {node?.description || "Complete this exercise to progress in your roadmap."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : exercise ? (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">{exercise.title}</h3>
              <div className="bg-muted p-4 rounded-md">
                <p className="whitespace-pre-line">{exercise.text}</p>
              </div>
              
              {exercise.audioUrl && (
                <div className="mt-4">
                  <audio controls className="w-full">
                    <source src={exercise.audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No exercise content available for this node.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCompleteNode} 
            disabled={isCompleting || isLoading || !exercise}
          >
            {isCompleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {node?.status === 'completed' ? "Mark as Reviewed" : "Mark as Completed"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoadmapExerciseModal;
