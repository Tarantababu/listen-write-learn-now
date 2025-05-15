
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, XCircle, Repeat } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { useCurriculum } from '@/hooks/use-curriculum';
import AudioPlayer from '@/components/AudioPlayer';

interface CurriculumExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string;
  curriculumId: string;
}

export const CurriculumExerciseModal: React.FC<CurriculumExerciseModalProps> = ({
  isOpen,
  onClose,
  nodeId,
  curriculumId,
}) => {
  const { getNodeExercise, incrementNodeCompletion, nodeProgress } = useCurriculum();
  
  const [exercise, setExercise] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<{ accuracy: number; correct: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get node progress for this node
  const nodeProgressRecord = nodeProgress.find(np => np.node_id === nodeId);
  const completedCount = nodeProgressRecord?.completed_exercise_count || 0;
  const requiredCount = exercise?.min_completion_count || 3;
  const minAccuracy = exercise?.min_accuracy_percentage || 95;

  // Load exercise data
  useEffect(() => {
    const loadExercise = async () => {
      if (isOpen && nodeId) {
        try {
          setIsLoading(true);
          const exerciseData = await getNodeExercise(nodeId);
          setExercise(exerciseData);
        } catch (error) {
          console.error('Error loading exercise:', error);
          toast({
            title: 'Error',
            description: 'Failed to load exercise',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadExercise();
  }, [isOpen, nodeId, getNodeExercise]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUserInput('');
      setResult(null);
    }
  }, [isOpen]);

  // Simple function to calculate accuracy
  const calculateAccuracy = (original: string, input: string): number => {
    if (!input) return 0;
    
    const originalWords = original.trim().toLowerCase().split(/\s+/);
    const inputWords = input.trim().toLowerCase().split(/\s+/);
    
    let correctWords = 0;
    
    for (let i = 0; i < Math.min(originalWords.length, inputWords.length); i++) {
      if (originalWords[i] === inputWords[i]) {
        correctWords++;
      }
    }
    
    return Math.round((correctWords / originalWords.length) * 100);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!exercise || !userInput.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      // Calculate accuracy
      const accuracy = calculateAccuracy(exercise.text, userInput);
      
      // Record result
      setResult({
        accuracy,
        correct: accuracy >= minAccuracy,
      });
      
      // Record completion if accuracy is sufficient
      if (accuracy >= minAccuracy) {
        await incrementNodeCompletion(nodeId, accuracy);
      }
    } catch (error) {
      console.error('Error submitting exercise:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit exercise',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Try again
  const handleTryAgain = () => {
    setUserInput('');
    setResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : exercise ? (
          <>
            <DialogHeader>
              <DialogTitle>{exercise.title}</DialogTitle>
              <DialogDescription>
                {completedCount > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">
                      Completed {completedCount} of {requiredCount} times
                    </p>
                    <Progress 
                      value={(completedCount / requiredCount) * 100} 
                      className="h-1.5 mt-1"
                    />
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              {exercise.audio_url && (
                <div className="mb-4">
                  <AudioPlayer audioUrl={exercise.audio_url} />
                </div>
              )}

              <div className="bg-muted p-4 rounded-md">
                <p className="whitespace-pre-wrap">{exercise.text}</p>
              </div>

              {!result ? (
                <>
                  <Textarea
                    placeholder="Write your answer here..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    rows={5}
                    className="resize-none"
                    disabled={isSubmitting}
                  />
                  
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || !userInput.trim()} 
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      'Submit Answer'
                    )}
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div 
                    className={`p-4 rounded-md ${
                      result.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      {result.correct ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <h4 className="font-medium">
                        {result.correct ? 'Correct!' : 'Try Again'}
                      </h4>
                    </div>
                    <p className="text-sm">
                      {result.correct ? (
                        `Great job! You achieved ${result.accuracy}% accuracy (minimum required: ${minAccuracy}%).`
                      ) : (
                        `Your answer was ${result.accuracy}% accurate. You need at least ${minAccuracy}% to complete this exercise.`
                      )}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleTryAgain} 
                      variant="outline" 
                      className="w-full"
                    >
                      <Repeat className="mr-2 h-4 w-4" />
                      Try Again
                    </Button>
                    
                    <Button 
                      onClick={onClose} 
                      variant={result.correct ? 'default' : 'ghost'} 
                      className="w-full"
                    >
                      {result.correct ? 'Continue' : 'Close'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No exercise found for this node.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CurriculumExerciseModal;
