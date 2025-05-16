
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRoadmap } from '@/hooks/use-roadmap';
import { RoadmapNode } from '../types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import DictationPractice from '@/components/DictationPractice';
import { Search, Headphones, Loader2, Lock } from 'lucide-react';
import { nodeAccessService } from '../services/NodeAccessService';

interface RoadmapExerciseModalProps {
  node: RoadmapNode | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Practice stage enum
enum PracticeStage {
  PROMPT,    // Ask user if they want Reading Analysis
  READING,   // Reading Analysis mode
  DICTATION, // Dictation Practice mode
}

const RoadmapExerciseModal: React.FC<RoadmapExerciseModalProps> = ({ node, isOpen, onOpenChange }) => {
  const { 
    getNodeExercise, 
    markNodeAsCompleted, 
    recordNodeCompletion,
    nodeProgress 
  } = useRoadmap();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [exercise, setExercise] = useState<any>(null);
  const [practiceStage, setPracticeStage] = useState<PracticeStage>(PracticeStage.PROMPT);
  const [accessChecking, setAccessChecking] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  
  // Load exercise when modal is opened with a node
  useEffect(() => {
    if (node && isOpen) {
      loadExercise();
      // Always start at prompt stage when modal opens
      setPracticeStage(PracticeStage.PROMPT);
    } else if (!isOpen) {
      // Reset states when modal is completely closed
      setExercise(null);
    }
  }, [node, isOpen]);

  const loadExercise = async () => {
    if (!node) return;
    
    setLoading(true);
    setAccessChecking(true);
    
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
      const exerciseData = await getNodeExercise(node.id);
      setExercise(exerciseData);
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

  const handleStartReadingAnalysis = () => {
    setPracticeStage(PracticeStage.READING);
  };

  const handleStartDictation = () => {
    setPracticeStage(PracticeStage.DICTATION);
  };

  const handlePracticeComplete = (accuracy: number) => {
    if (!node) return;

    // Save the practice result and increment completion count if accuracy is high enough
    recordNodeCompletion(node.id, accuracy)
      .then(() => {
        // Show feedback based on accuracy
        if (accuracy >= 95) {
          toast({
            title: "Great job!",
            description: `You scored ${Math.round(accuracy)}%. Your progress has been saved.`,
          });
        } else {
          toast({
            title: "Keep practicing!",
            description: `You scored ${Math.round(accuracy)}%. Try to get above 95% for it to count toward completion.`,
          });
        }
      })
      .catch(error => {
        console.error("Error recording node completion:", error);
        toast({
          variant: "destructive",
          title: "Error saving progress",
          description: "There was a problem saving your progress."
        });
      });
  };

  const handleTryAgain = () => {
    setPracticeStage(PracticeStage.PROMPT);
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

  // Get the completion count for this node (if it exists)
  const nodeCompletionInfo = node ? 
    nodeProgress.find(np => np.nodeId === node.id) : 
    null;
  
  const completionCount = nodeCompletionInfo?.completionCount || 0;
  const isNodeCompleted = nodeCompletionInfo?.isCompleted || false;

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
        ) : practiceStage === PracticeStage.PROMPT && (
          <div className="px-6 pt-0 pb-6 space-y-6">
            <div className="mb-6">
              <p className="text-lg font-medium mb-2">Boost Your Understanding Before You Start</p>
              <p className="text-muted-foreground">Dive into a Reading Analysis to see how words and grammar work — or skip straight to dictation.</p>
              
              {completionCount > 0 && (
                <div className="mt-3 flex items-center">
                  <Badge variant={isNodeCompleted ? "success" : "secondary"} className="mr-2">
                    {completionCount}/3 completions
                  </Badge>
                  {isNodeCompleted && (
                    <span className="text-xs text-green-600 font-medium">Completed!</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card className="border-muted overflow-hidden hover:bg-muted/5 transition-colors dark:hover:bg-muted/10">
                <CardContent className="p-0">
                  <Button onClick={handleStartReadingAnalysis} variant="ghost" className="h-auto py-8 px-6 w-full rounded-none border-0 flex flex-col items-center justify-center text-left bg-transparent">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="flex items-center justify-center bg-primary/10 w-12 h-12 rounded-full">
                        <Search className="h-6 w-6 text-primary" />
                      </div>
                      <div className="font-semibold text-lg">
                        🔍 Start with Reading Analysis
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Explore vocabulary and grammar with AI explanations
                      </p>
                    </div>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden border border-muted hover:bg-muted/5 transition-all dark:hover:bg-muted/10">
                <CardContent className="p-0">
                  <Button onClick={handleStartDictation} variant="ghost" className="h-auto py-8 px-6 w-full rounded-none border-0 flex flex-col items-center justify-center text-left bg-transparent">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="flex items-center justify-center bg-muted/40 w-12 h-12 rounded-full">
                        <Headphones className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="font-semibold text-lg">🎧 Start Dictation Now</div>
                      <p className="text-sm text-muted-foreground">
                        Practice listening and transcription skills with audio
                      </p>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {!loading && isNodeCompleted && (
              <div className="mt-6 text-center">
                <p className="text-green-600 mb-2">
                  You've already completed this lesson!
                </p>
                <Button onClick={() => onOpenChange(false)} variant="outline">
                  Return to Roadmap
                </Button>
              </div>
            )}
            
            {!exercise && !loading && !isNodeCompleted && (
              <div className="mt-6 flex justify-center">
                <Button onClick={handleMarkCompleted} variant="outline">
                  Mark as Completed
                </Button>
              </div>
            )}
          </div>
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
              audioUrl: exercise.audio_url,
              tags: [],
              directoryId: null,
              createdAt: new Date(),
              completionCount: completionCount,
              isCompleted: isNodeCompleted
            }}
            onTryAgain={handleTryAgain}
            onComplete={handlePracticeComplete}
          />
        )}
        
        {practiceStage === PracticeStage.DICTATION && !exercise && (
          <div className="text-center py-6">
            {loading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p>Loading exercise...</p>
              </div>
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
