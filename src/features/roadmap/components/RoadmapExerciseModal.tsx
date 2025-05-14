import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Lock } from 'lucide-react';
import { RoadmapNode } from '../types';
import { useRoadmap } from '@/hooks/use-roadmap';
import ExerciseContent from '@/components/ExerciseContent';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { nodeAccessService } from '../services/NodeAccessService';
import DictationPractice from '@/components/DictationPractice';

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
  const [loading, setLoading] = useState(true);
  const [accessChecking, setAccessChecking] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [exerciseContent, setExerciseContent] = useState<any | null>(null);
  const [exerciseMode, setExerciseMode] = useState<'dictation' | 'reading' | null>(null);
  const { getNodeExercise, markNodeAsCompleted, recordNodeCompletion } = useRoadmap();

  // Check if node is accessible and load exercise content
  useEffect(() => {
    const loadExercise = async () => {
      if (!node || !isOpen) return;
      
      setLoading(true);
      setAccessChecking(true);
      setExerciseMode(null);
      
      try {
        // Verify node access first (server-side validation)
        const { data: canAccess, error: accessError } = await nodeAccessService.canAccessNode(node.id);
        
        if (accessError) {
          console.error("Error checking node access:", accessError);
          toast({
            variant: "destructive",
            title: "Access error",
            description: "Unable to verify access to this content"
          });
          setHasAccess(false);
          setAccessChecking(false);
          setLoading(false);
          return;
        }
        
        if (!canAccess) {
          console.log("Node access denied:", node.id);
          toast({
            variant: "destructive",
            title: "Access denied",
            description: "You need to complete previous lessons first"
          });
          setHasAccess(false);
          setAccessChecking(false);
          setLoading(false);
          return;
        }
        
        // User has access, load the exercise
        setHasAccess(true);
        setAccessChecking(false);
        
        // Load exercise content
        const exercise = await getNodeExercise(node.id);
        console.log("Exercise loaded:", exercise);
        setExerciseContent(exercise);
      } catch (error) {
        console.error("Error loading exercise:", error);
        toast({
          variant: "destructive",
          title: "Loading error",
          description: "Failed to load exercise content"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadExercise();
  }, [node, isOpen, getNodeExercise]);

  const handleCompleteLater = () => {
    onOpenChange(false);
  };

  const handleMarkComplete = async () => {
    if (!node) return;
    
    try {
      await markNodeAsCompleted(node.id);
      toast({
        title: "Lesson completed",
        description: "You've completed this lesson and unlocked the next one"
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error marking node as complete:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark lesson as complete"
      });
    }
  };

  const handleStartDictation = () => {
    setExerciseMode('dictation');
  };

  const handleStartReading = () => {
    setExerciseMode('reading');
  };

  const handleBackToOptions = () => {
    setExerciseMode(null);
  };

  const handlePracticeComplete = async (accuracy: number) => {
    if (!node) return;
    
    try {
      // Record completion through the roadmap system
      const result = await recordNodeCompletion(node.id, accuracy);
      
      if (result.isCompleted) {
        toast({
          title: "Great job!",
          description: `You scored ${Math.round(accuracy)}%. Lesson completed!`
        });
        // Close modal after successful completion
        setTimeout(() => onOpenChange(false), 2000);
      } else {
        toast({
          title: "Good progress!",
          description: `You scored ${Math.round(accuracy)}%. Keep practicing to complete the lesson!`
        });
      }
    } catch (error) {
      console.error("Error recording completion:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your progress"
      });
    }
  };

  if (!node) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {node.title}
          </DialogTitle>
        </DialogHeader>
        
        {accessChecking ? (
          <div className="flex flex-col items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Checking access...</p>
          </div>
        ) : !hasAccess ? (
          <Card className="p-6 flex flex-col items-center text-center">
            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Lesson Locked</h3>
            <p className="text-muted-foreground mb-4">
              You need to complete previous lessons before accessing this one.
              Follow the learning path in order to unlock this content.
            </p>
            <Button onClick={() => onOpenChange(false)}>
              Return to Roadmap
            </Button>
          </Card>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading exercise content...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {node.description && (
              <p className="text-muted-foreground">{node.description}</p>
            )}
            
            {!exerciseContent ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">No exercise content available for this lesson.</p>
                <div className="mt-4">
                  <Button onClick={handleMarkComplete}>
                    Mark as Complete
                  </Button>
                </div>
              </Card>
            ) : exerciseMode === null ? (
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Choose Your Learning Method</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button 
                    onClick={handleStartReading} 
                    variant="outline" 
                    className="h-auto py-4 justify-start"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-base font-medium">Reading Analysis</span>
                      <span className="text-sm text-muted-foreground">Study the text with explanations</span>
                    </div>
                  </Button>
                  <Button 
                    onClick={handleStartDictation} 
                    variant="default" 
                    className="h-auto py-4 justify-start"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-base font-medium">Dictation Practice</span>
                      <span className="text-sm">Practice listening and writing</span>
                    </div>
                  </Button>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <Button variant="outline" onClick={handleCompleteLater}>
                    Complete Later
                  </Button>
                  <Button onClick={handleMarkComplete}>
                    Mark as Complete
                  </Button>
                </div>
              </Card>
            ) : exerciseMode === 'reading' ? (
              <div className="space-y-4">
                <ExerciseContent 
                  exercise={exerciseContent}
                  showActions={false}
                />
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={handleBackToOptions}>
                    Back to Options
                  </Button>
                  <Button onClick={handleMarkComplete}>
                    Mark as Complete
                  </Button>
                </div>
              </div>
            ) : exerciseMode === 'dictation' ? (
              <DictationPractice
                exercise={{
                  id: `roadmap-${node.id}`,
                  title: exerciseContent.title || node.title,
                  text: exerciseContent.text || "",
                  language: exerciseContent.language || 'english',
                  audioUrl: exerciseContent.audioUrl,
                  tags: exerciseContent.tags || [],
                  directoryId: null,
                  createdAt: new Date(),
                  completionCount: 0,
                  isCompleted: false
                }}
                onTryAgain={handleBackToOptions}
                onComplete={handlePracticeComplete}
              />
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RoadmapExerciseModal;
