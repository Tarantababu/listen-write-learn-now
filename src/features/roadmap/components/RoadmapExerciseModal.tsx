
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRoadmap } from '@/hooks/use-roadmap';
import { RoadmapNode } from '../types';
import { ExerciseContent } from '../types';
import DictationPractice from '@/components/DictationPractice';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, CheckCircle2, Volume2, FileText } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Exercise } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

interface RoadmapExerciseModalProps {
  node: RoadmapNode | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const RoadmapExerciseModal: React.FC<RoadmapExerciseModalProps> = ({ node, isOpen, onOpenChange }) => {
  const { 
    getNodeExercise, 
    recordNodeCompletion, 
    markNodeAsCompleted, 
    nodeLoading 
  } = useRoadmap();
  
  const [exerciseContent, setExerciseContent] = useState<ExerciseContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [exerciseState, setExerciseState] = useState<'info' | 'practice' | 'completed'>('info');
  const [practiceSuccess, setPracticeSuccess] = useState(false);
  const [accuracy, setAccuracy] = useState(0);

  const loadExercise = async () => {
    if (!node) return;

    setLoading(true);
    try {
      const content = await getNodeExercise(node.id);
      
      if (!content) {
        toast({
          variant: "destructive",
          title: "Failed to load exercise",
          description: "There was an error loading this exercise."
        });
        return;
      }
      
      setExerciseContent(content);
      setExerciseState('info');
    } catch (error) {
      console.error("Error loading exercise content:", error);
      toast({
        variant: "destructive",
        title: "Error loading exercise",
        description: "Failed to load the exercise content."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && node) {
      loadExercise();
    } else {
      setExerciseState('info');
      setPracticeSuccess(false);
      setAccuracy(0);
    }
  }, [node, isOpen]);

  // Format exercise content for the DictationPractice component
  const formatExerciseForDictation = (): Exercise | null => {
    if (!exerciseContent) return null;

    return {
      id: 'roadmap-exercise',
      title: exerciseContent.title,
      text: exerciseContent.text,
      language: exerciseContent.language,
      audioUrl: exerciseContent.audioUrl, // Fixed property name
      tags: exerciseContent.tags || [],
      directoryId: null,
      createdAt: new Date(),
      completionCount: 0,
      isCompleted: false
    };
  };

  const handleStartPractice = () => {
    setExerciseState('practice');
  };

  const handleMarkCompleted = async () => {
    if (!node) return;

    try {
      await markNodeAsCompleted(node.id);
      setPracticeSuccess(true);
      setExerciseState('completed');
      toast({
        title: "Marked as Completed",
        description: "You've successfully completed this lesson."
      });
    } catch (error) {
      console.error("Error marking node as completed:", error);
      toast({
        variant: "destructive",
        title: "Failed to complete",
        description: "Failed to mark the lesson as completed."
      });
    }
  };

  const handleTryAgain = () => {
    setExerciseState('practice');
  };

  const handleDictationComplete = async (dictationAccuracy: number) => {
    if (!node) return;
    
    setAccuracy(dictationAccuracy);
    
    try {
      const result = await recordNodeCompletion(node.id, dictationAccuracy);
      
      if (result.isCompleted) {
        setPracticeSuccess(true);
        setExerciseState('completed');
        toast({
          title: "Lesson Completed",
          description: `Great job! You've completed this lesson with ${dictationAccuracy}% accuracy.`
        });
      } else if (dictationAccuracy >= 70) {
        toast({
          title: "Good Progress",
          description: `Progress saved with ${dictationAccuracy}% accuracy. Keep practicing!`
        });
        setExerciseState('info');
      } else {
        toast({
          title: "Try Again",
          description: `You got ${dictationAccuracy}% accuracy. Try to achieve at least 70%.`
        });
        setExerciseState('info');
      }
    } catch (error) {
      console.error("Error recording completion:", error);
      toast({
        variant: "destructive",
        title: "Failed to save progress",
        description: "There was an error saving your progress."
      });
      setExerciseState('info');
    }
  };

  const formattedExercise = formatExerciseForDictation();

  const renderModalContent = () => {
    if (loading || !exerciseContent) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading exercise content...</p>
        </div>
      );
    }

    if (exerciseState === 'practice' && formattedExercise) {
      return (
        <DictationPractice
          exercise={formattedExercise}
          onTryAgain={handleTryAgain}
          onComplete={handleDictationComplete}
        />
      );
    }

    if (exerciseState === 'completed') {
      return (
        <AnimatePresence>
          <motion.div
            className="py-6 flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Lesson Completed!</h3>
            <p className="text-muted-foreground mb-4">
              {accuracy > 0 
                ? `You completed this lesson with ${accuracy}% accuracy.` 
                : "You've successfully completed this lesson."}
            </p>
            <Button onClick={() => onOpenChange(false)}>
              Continue Learning
            </Button>
          </motion.div>
        </AnimatePresence>
      );
    }

    // Default - Info view
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium">{exerciseContent.title}</h3>
          </div>
          
          {exerciseContent.tags && exerciseContent.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {exerciseContent.tags.map((tag, index) => (
                <Badge key={index} variant="outline">{tag}</Badge>
              ))}
            </div>
          )}
          
          <Separator className="my-4" />
          
          <div className="bg-muted/50 p-4 rounded-md mb-4">
            <p className="text-sm italic">{exerciseContent.text}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <Volume2 className="h-4 w-4 mr-1" /> Audio Exercise
              </h4>
              <AspectRatio ratio={16/9} className="bg-muted rounded-md overflow-hidden">
                <div className="flex items-center justify-center h-full">
                  <audio 
                    controls 
                    className="w-full max-w-xs"
                    src={exerciseContent.audioUrl} 
                  />
                </div>
              </AspectRatio>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-1" /> Instructions
              </h4>
              <div className="bg-muted/50 p-4 h-[calc(100%-32px)] rounded-md">
                <p className="text-sm">
                  Listen to the audio and practice by typing what you hear. 
                  Try to achieve at least 70% accuracy to make progress.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleMarkCompleted} disabled={nodeLoading}>
              {nodeLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Mark as Completed
            </Button>
            <Button onClick={handleStartPractice}>
              Start Practice
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogTitle>
          {node?.title || "Roadmap Exercise"}
        </DialogTitle>
        {renderModalContent()}
      </DialogContent>
    </Dialog>
  );
};

export default RoadmapExerciseModal;
