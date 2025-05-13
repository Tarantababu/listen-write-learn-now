
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRoadmap } from '../context/RoadmapContext';
import { RoadmapNode, ExerciseContent } from '../types';
import DictationPractice from '@/components/DictationPractice';
import { toast } from '@/components/ui/use-toast';
import LearningOptionsMenu from './LearningOptionsMenu';

interface RoadmapExerciseModalProps {
  node: RoadmapNode | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Practice stage enum
enum PracticeStage {
  LEARNING_OPTIONS, // Show reading analysis / dictation options
  READING,         // Reading Analysis mode
  DICTATION,       // Dictation Practice mode
}

const RoadmapExerciseModal: React.FC<RoadmapExerciseModalProps> = ({ 
  node, 
  isOpen, 
  onOpenChange 
}) => {
  const { 
    getNodeExercise,
    markNodeAsCompleted,
    incrementNodeCompletion,
    nodeLoading,
  } = useRoadmap();

  const [exercise, setExercise] = useState<ExerciseContent | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [practiceStage, setPracticeStage] = useState<PracticeStage>(PracticeStage.LEARNING_OPTIONS);

  // Load exercise when modal is opened with a node
  useEffect(() => {
    if (node && isOpen) {
      loadExercise(node.id);
      setPracticeStage(PracticeStage.LEARNING_OPTIONS);
    } else if (!isOpen) {
      // Reset states when modal is closed
      setExercise(null);
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

  const handleStartReadingAnalysis = () => {
    setPracticeStage(PracticeStage.READING);
  };

  const handleStartDictation = () => {
    setPracticeStage(PracticeStage.DICTATION);
  };

  const handlePracticeComplete = async (accuracy: number) => {
    if (!node) return;

    try {
      const result = await incrementNodeCompletion(node.id, accuracy);
      
      // Show feedback based on accuracy
      if (accuracy >= 95) {
        toast({
          title: "Great job!",
          description: `You scored ${Math.round(accuracy)}%. Your progress has been saved.`,
        });
        
        // Check if the node is now completed
        if (result.isCompleted) {
          toast({
            title: "Exercise completed!",
            description: "You've completed this exercise. Moving to the next one.",
          });
          onOpenChange(false);
        }
      } else {
        toast({
          title: "Keep practicing!",
          description: `You scored ${Math.round(accuracy)}%. Try to get above 95% for it to count toward completion.`,
        });
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const handleTryAgain = () => {
    setPracticeStage(PracticeStage.LEARNING_OPTIONS);
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

  if (!node) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-w-[95vw] p-0 overflow-hidden">
        <DialogHeader className="p-6">
          <DialogTitle className="text-xl">{node.title}</DialogTitle>
          <DialogDescription className="text-base mt-2">
            {node.description}
          </DialogDescription>
        </DialogHeader>
        
        {practiceStage === PracticeStage.LEARNING_OPTIONS && (
          <LearningOptionsMenu 
            onStartReadingAnalysis={handleStartReadingAnalysis}
            onStartDictation={handleStartDictation}
            exerciseTitle={exercise?.title}
          />
        )}
        
        {practiceStage === PracticeStage.READING && (
          <div className="text-center py-6">
            <p>Reading Analysis functionality is not implemented yet.</p>
            <Button onClick={handleStartDictation} className="mt-4">
              Proceed to Dictation
            </Button>
          </div>
        )}
        
        {practiceStage === PracticeStage.DICTATION && exercise && (
          <DictationPractice
            exercise={{
              id: `roadmap-${node.id}`,
              title: exercise.title || node.title,
              text: exercise.text || "",
              language: node.language || 'english',
              audioUrl: exercise.audioUrl,
              tags: [],
              directoryId: null,
              createdAt: new Date(),
              completionCount: 0,
              isCompleted: false
            }}
            onTryAgain={handleTryAgain}
            onComplete={handlePracticeComplete}
          />
        )}
        
        {practiceStage === PracticeStage.DICTATION && !exercise && (
          <div className="text-center py-6">
            {loading ? (
              <p>Loading exercise...</p>
            ) : (
              <>
                <p>No exercise content available.</p>
                <Button onClick={handleTryAgain} className="mt-4">
                  Go Back
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RoadmapExerciseModal;
