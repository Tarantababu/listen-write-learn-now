
import React, { useState, useEffect } from 'react';
import { useCurriculum } from '@/contexts/CurriculumContext';
import { CurriculumNode } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface CurriculumExerciseModalProps {
  node: CurriculumNode | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExerciseState {
  exercise: any | null;
  loading: boolean;
  error: string | null;
  completed: boolean;
  accuracy: number | null;
}

const CurriculumExerciseModal: React.FC<CurriculumExerciseModalProps> = ({ 
  node,
  isOpen,
  onOpenChange
}) => {
  const { user } = useAuth();
  const { getNodeExercise, incrementNodeCompletion, nodeLoading } = useCurriculum();
  const [exerciseState, setExerciseState] = useState<ExerciseState>({
    exercise: null,
    loading: false,
    error: null,
    completed: false,
    accuracy: null
  });
  
  // Load the exercise when the modal is opened
  useEffect(() => {
    if (isOpen && node && user) {
      setExerciseState(prev => ({ ...prev, loading: true, error: null, completed: false }));
      
      getNodeExercise(node.id)
        .then(exercise => {
          setExerciseState(prev => ({
            ...prev,
            exercise,
            loading: false
          }));
        })
        .catch(error => {
          console.error('Error loading exercise:', error);
          setExerciseState(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to load exercise. Please try again.'
          }));
        });
    } else {
      // Reset state when modal is closed
      setExerciseState({
        exercise: null,
        loading: false,
        error: null,
        completed: false,
        accuracy: null
      });
    }
  }, [isOpen, node, user]);
  
  const handleCompleteExercise = async (accuracy: number) => {
    if (!node) return;
    
    try {
      await incrementNodeCompletion(node.id, accuracy);
      setExerciseState(prev => ({
        ...prev,
        completed: true,
        accuracy
      }));
      
      // Show appropriate toast based on accuracy
      if (accuracy >= 0.9) {
        toast({
          title: "Excellent!",
          description: "You've mastered this exercise!",
        });
      } else if (accuracy >= 0.7) {
        toast({
          title: "Good job!",
          description: "You're making great progress.",
        });
      } else {
        toast({
          title: "Keep practicing!",
          description: "You'll improve with more practice.",
        });
      }
    } catch (error) {
      console.error('Error completing exercise:', error);
      toast({
        title: "Error",
        description: "Failed to record your progress.",
        variant: "destructive"
      });
    }
  };
  
  // Simple exercise completion for demo purposes
  const simulateExerciseCompletion = () => {
    const randomAccuracy = Math.random() * 0.4 + 0.6; // Random between 0.6 and 1.0
    handleCompleteExercise(randomAccuracy);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{node?.title || 'Exercise'}</DialogTitle>
          <DialogDescription>
            {node?.description || 'Complete this exercise to improve your skills'}
          </DialogDescription>
        </DialogHeader>
        
        {exerciseState.loading || !exerciseState.exercise ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading exercise...</p>
            </div>
          </div>
        ) : exerciseState.error ? (
          <div className="text-center py-12">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground">{exerciseState.error}</p>
            <Button onClick={() => onOpenChange(false)} className="mt-4">Close</Button>
          </div>
        ) : exerciseState.completed ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Exercise Completed!</h3>
            <p className="text-muted-foreground mb-4">
              You completed this exercise with {Math.round((exerciseState.accuracy || 0) * 100)}% accuracy.
            </p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{exerciseState.exercise.language}</Badge>
                <div className="flex gap-1">
                  {exerciseState.exercise.tags?.map((tag: string) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="p-4 border rounded-md bg-muted/30">
                <h3 className="font-medium mb-2">Instructions</h3>
                <p className="text-sm">Read the text below and practice pronouncing it. When you're ready, click "Complete Exercise" to record your progress.</p>
              </div>
              
              <div className="p-4 border rounded-md">
                <h3 className="font-medium mb-2">{exerciseState.exercise.title}</h3>
                <p className="whitespace-pre-line">{exerciseState.exercise.text}</p>
              </div>
              
              {exerciseState.exercise.audio_url && (
                <div className="flex justify-center">
                  <audio controls src={exerciseState.exercise.audio_url} className="w-full">
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
            
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={simulateExerciseCompletion} disabled={nodeLoading}>
                {nodeLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>Complete Exercise</>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CurriculumExerciseModal;
