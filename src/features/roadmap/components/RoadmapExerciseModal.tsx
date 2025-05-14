
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RoadmapNode } from '../types';
import { useRoadmap } from '@/hooks/use-roadmap';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import ExerciseContent from '@/components/ExerciseContent';
import DictationPractice from '@/components/DictationPractice';
import { ExerciseType } from '@/types';

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
  const { getNodeExercise, markNodeAsCompleted, incrementNodeCompletion, nodeLoading } = useRoadmap();
  const [exercise, setExercise] = useState<ExerciseType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [practicing, setPracticing] = useState(false);

  // Reset state when modal is opened with a new node
  useEffect(() => {
    if (isOpen && node) {
      setLoading(true);
      setError(null);
      setCompleted(false);
      setPracticing(false);
      
      loadExercise();
    }
  }, [isOpen, node]);

  const loadExercise = async () => {
    if (!node) return;
    
    try {
      setLoading(true);
      const exerciseData = await getNodeExercise(node.id);
      
      if (!exerciseData) {
        setError('No exercise found for this lesson.');
        return;
      }
      
      // Convert the exercise data to the expected format
      const formattedExercise: ExerciseType = {
        id: exerciseData.id,
        title: exerciseData.title,
        text: exerciseData.text,
        language: exerciseData.language,
        audioUrl: exerciseData.audio_url,
        tags: exerciseData.tags || [],
        directoryId: null, // Default exercises don't have directories
        createdAt: new Date(exerciseData.created_at),
        completionCount: 0,
        isCompleted: false
      };
      
      setExercise(formattedExercise);
    } catch (err) {
      console.error('Error loading exercise:', err);
      setError('Failed to load the exercise. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartDictation = () => {
    setPracticing(true);
  };

  const handleComplete = async (accuracy: number) => {
    if (!node || !exercise) return;
    
    try {
      // Mark as completed with high accuracy
      if (accuracy >= 90) {
        await incrementNodeCompletion(node.id, accuracy);
        setCompleted(true);
        
        toast({
          title: "Exercise completed!",
          description: `Great job! You completed this exercise with ${accuracy.toFixed(0)}% accuracy.`,
        });
      } else {
        toast({
          title: "Exercise attempted",
          description: `You completed this exercise with ${accuracy.toFixed(0)}% accuracy. Try again to improve!`,
        });
      }
    } catch (err) {
      console.error('Error completing exercise:', err);
      toast({
        variant: "destructive",
        title: "Error saving progress",
        description: "There was a problem saving your progress.",
      });
    }
  };

  const handleTryAgain = () => {
    setPracticing(true);
    setCompleted(false);
  };

  const handleMarkComplete = async () => {
    if (!node) return;
    
    try {
      await markNodeAsCompleted(node.id);
      onOpenChange(false);
      
      toast({
        title: "Lesson completed!",
        description: "You've marked this lesson as complete.",
      });
    } catch (err) {
      console.error('Error marking lesson as complete:', err);
      toast({
        variant: "destructive",
        title: "Error completing lesson",
        description: "There was a problem marking the lesson as complete.",
      });
    }
  };

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Loading exercise...</p>
    </div>
  );

  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertCircle className="h-8 w-8 text-destructive mb-4" />
      <p className="text-destructive font-medium">{error}</p>
      <Button onClick={loadExercise} variant="outline" className="mt-4">
        Retry
      </Button>
    </div>
  );

  const renderExerciseDetails = () => (
    <div className="space-y-4">
      <ExerciseContent exercise={exercise} />
      
      <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
        <Button onClick={handleStartDictation} className="flex-1">
          Start Dictation Practice
        </Button>
        <Button onClick={handleMarkComplete} variant="outline" className="flex-1" disabled={nodeLoading}>
          {nodeLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Mark as Completed
        </Button>
      </div>
    </div>
  );

  const renderDictationPractice = () => (
    <>
      {exercise && (
        <DictationPractice
          exercise={exercise}
          onTryAgain={handleTryAgain}
          onComplete={handleComplete}
        />
      )}
    </>
  );

  const renderSuccessMessage = () => (
    <Card className="p-6 text-center">
      <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">Great Job!</h3>
      <p className="text-muted-foreground mb-6">
        You've successfully completed this exercise.
      </p>
      <div className="flex flex-col space-y-2">
        <Button onClick={handleTryAgain}>
          Practice Again
        </Button>
        <Button onClick={() => onOpenChange(false)} variant="outline">
          Return to Roadmap
        </Button>
      </div>
    </Card>
  );

  const renderContent = () => {
    if (loading) return renderLoading();
    if (error) return renderError();
    if (completed) return renderSuccessMessage();
    if (practicing) return renderDictationPractice();
    return renderExerciseDetails();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {node?.title || 'Lesson'}
            {node?.isBonus && (
              <Badge variant="outline" className="ml-2 bg-amber-500/10 text-amber-700 border-amber-500">
                Bonus
              </Badge>
            )}
          </DialogTitle>
          {node?.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {node.description}
            </p>
          )}
        </DialogHeader>
        
        <Separator />
        
        <div className="py-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoadmapExerciseModal;
