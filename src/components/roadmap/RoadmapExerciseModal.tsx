
import React, { useState, useEffect } from 'react';
import { RoadmapNode, Exercise } from '@/types';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRoadmap } from '@/contexts/RoadmapContext';
import DictationPractice from '@/components/DictationPractice';
import { Loader2, Star, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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
  const { getNodeExercise, markNodeAsCompleted } = useRoadmap();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(false);
  const [practicing, setPracticing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [accuracy, setAccuracy] = useState(0);

  useEffect(() => {
    const loadExercise = async () => {
      if (node && isOpen) {
        setLoading(true);
        try {
          const exerciseData = await getNodeExercise(node.id);
          setExercise(exerciseData);
          setCompleted(false);
          setAccuracy(0);
        } finally {
          setLoading(false);
        }
      }
    };

    loadExercise();
  }, [node, isOpen, getNodeExercise]);

  const handleStartPractice = () => {
    setPracticing(true);
  };

  const handlePracticeComplete = (result: { accuracy: number }) => {
    setAccuracy(result.accuracy);
    setPracticing(false);
    
    if (result.accuracy >= 95) {
      setCompleted(true);
    }
  };

  const handleCompleteNode = async () => {
    if (!node) return;

    try {
      await markNodeAsCompleted(node.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error completing node:', error);
      toast.error('Failed to mark node as completed');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p>Loading exercise...</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl flex items-center gap-2">
                  {node?.title}
                  {node?.isBonus && <Star className="h-4 w-4 text-amber-500" />}
                </DialogTitle>
                {node?.isBonus && (
                  <Badge variant="outline" className="bg-amber-500/20 border-amber-500 text-amber-700">
                    Bonus Exercise
                  </Badge>
                )}
              </div>
              <DialogDescription>
                {node?.description || "Practice this exercise to progress on your learning path"}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              {!practicing && !completed ? (
                <div className="space-y-6">
                  {exercise && (
                    <div className="p-4 border rounded-md bg-background">
                      <h3 className="font-medium mb-2">Exercise Preview</h3>
                      <p className="text-sm text-muted-foreground">{exercise.title}</p>
                      <div className="mt-2 p-2 bg-muted/30 rounded text-sm">
                        <p className="line-clamp-3">{exercise.text}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-center">
                    <Button onClick={handleStartPractice} size="lg">
                      Start Exercise
                    </Button>
                  </div>
                </div>
              ) : practicing ? (
                exercise && (
                  <div className="py-4">
                    <DictationPractice
                      exercise={exercise}
                      onComplete={handlePracticeComplete}
                    />
                  </div>
                )
              ) : completed ? (
                <div className="flex flex-col items-center py-8 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-center">Exercise Completed!</h3>
                  <p className="text-center text-muted-foreground">
                    Great job! You've completed this exercise with {Math.round(accuracy)}% accuracy.
                  </p>
                  <div className="w-full max-w-xs">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Accuracy</span>
                      <span className="font-medium">{Math.round(accuracy)}%</span>
                    </div>
                    <Progress value={accuracy} className="h-2" />
                  </div>
                </div>
              ) : null}
            </div>

            {completed && (
              <DialogFooter>
                <Button onClick={handleCompleteNode} className="w-full sm:w-auto">
                  Continue to Next Exercise
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RoadmapExerciseModal;
