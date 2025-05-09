
import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RoadmapNode } from '@/services/roadmapService';
import { supabase } from '@/integrations/supabase/client';
import { mapToExercise } from '@/services/defaultExerciseService';
import { Exercise } from '@/types';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { toast } from 'sonner';
import { Loader2, Copy, BookOpen } from 'lucide-react';
import PracticeModal from '@/components/exercises/PracticeModal';

interface RoadmapExerciseModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  node: RoadmapNode | null;
  onExerciseComplete: (nodeId: string, success: boolean) => Promise<void>;
}

const RoadmapExerciseModal: React.FC<RoadmapExerciseModalProps> = ({
  isOpen,
  onOpenChange,
  node,
  onExerciseComplete,
}) => {
  const { addExercise } = useExerciseContext();
  
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [defaultExercise, setDefaultExercise] = useState<any | null>(null);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  
  useEffect(() => {
    if (isOpen && node?.default_exercise_id) {
      loadDefaultExercise(node.default_exercise_id);
    } else {
      setExercise(null);
      setDefaultExercise(null);
    }
  }, [isOpen, node]);
  
  const loadDefaultExercise = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('default_exercises')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      setDefaultExercise(data);
      // Convert to Exercise format
      if (data) {
        const mappedExercise = mapToExercise(data);
        // Need to explicitly cast the mappedExercise to Exercise to fix the type error
        setExercise(mappedExercise as Exercise);
      }
    } catch (error) {
      console.error("Failed to load exercise", error);
      toast.error("Could not load exercise details");
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyToExercises = async () => {
    if (!defaultExercise) return;
    
    try {
      // Use the existing copyDefaultExerciseToUser logic in ExerciseContext
      await addExercise({
        title: defaultExercise.title,
        text: defaultExercise.text,
        language: defaultExercise.language,
        tags: defaultExercise.tags || [],
        audioUrl: defaultExercise.audio_url,
        directoryId: null,
        default_exercise_id: defaultExercise.id
      });
      
      toast.success("Exercise copied to your exercises");
      
      // Close the modal
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to copy exercise", error);
      toast.error("Could not copy exercise");
    }
  };
  
  const handleStartPractice = () => {
    if (exercise) {
      setIsPracticeModalOpen(true);
    }
  };
  
  const handlePracticeComplete = async (accuracy: number) => {
    if (!node) return;
    
    // Mark node as complete if accuracy is high enough
    const success = accuracy >= 95;
    await onExerciseComplete(node.id, success);
    
    // Close practice modal 
    setIsPracticeModalOpen(false);
    
    // Show appropriate message
    if (success) {
      toast.success("Great job! Exercise completed successfully");
    } else {
      toast.info("Keep practicing to improve your accuracy");
    }
    
    // Close the main modal after a short delay
    setTimeout(() => onOpenChange(false), 500);
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{node?.title || 'Exercise'}</DialogTitle>
            <DialogDescription>
              {node?.description ? node.description : 'Complete this exercise to progress in your roadmap'}
            </DialogDescription>
          </DialogHeader>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !defaultExercise ? (
            <div className="py-4 text-center">
              <p className="text-muted-foreground">
                No exercise linked to this roadmap node
              </p>
            </div>
          ) : (
            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Exercise</h4>
                  <p className="text-sm">{defaultExercise.title}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Language</h4>
                  <p className="text-sm capitalize">{defaultExercise.language}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Description</h4>
                  <p className="text-sm line-clamp-3">{defaultExercise.text}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="sm:w-auto w-full">
                Close
              </Button>
            </DialogClose>
            
            <Button
              className="sm:w-auto w-full flex items-center"
              variant="outline"
              onClick={handleCopyToExercises}
              disabled={loading || !defaultExercise}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy to My Exercises
            </Button>
            
            <Button 
              className="sm:w-auto w-full flex items-center"
              onClick={handleStartPractice}
              disabled={loading || !defaultExercise}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Practice Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {exercise && (
        <PracticeModal
          isOpen={isPracticeModalOpen}
          onOpenChange={setIsPracticeModalOpen}
          exercise={exercise}
          onComplete={handlePracticeComplete}
        />
      )}
    </>
  );
};

export default RoadmapExerciseModal;
