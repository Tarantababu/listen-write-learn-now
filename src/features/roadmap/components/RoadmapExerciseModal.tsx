
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRoadmap } from '@/hooks/use-roadmap';
import { RoadmapNode } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import DictationPractice from '@/components/DictationPractice';
import ReadingAnalysis from '@/components/ReadingAnalysis';
import { Search, Headphones, CheckCircle, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
  RESULTS,   // Results display mode
}

const RoadmapExerciseModal: React.FC<RoadmapExerciseModalProps> = ({ node, isOpen, onOpenChange }) => {
  const { 
    markNodeAsCompleted, 
    getNodeExercise, 
    nodeLoading,
    completedNodes, 
    incrementNodeCompletion,
    nodeProgress 
  } = useRoadmap();
  
  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [practiceStage, setPracticeStage] = useState<PracticeStage>(PracticeStage.PROMPT);
  const [exerciseResults, setExerciseResults] = useState<{accuracy: number} | null>(null);
  
  // Load exercise when modal is opened with a node
  useEffect(() => {
    if (node && isOpen) {
      loadExercise(node.id);
      // Always start at prompt stage when modal opens
      setPracticeStage(PracticeStage.PROMPT);
      // Reset exercise results
      setExerciseResults(null);
    } else if (!isOpen) {
      // Reset states when modal is completely closed
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

  const handlePracticeComplete = (accuracy: number) => {
    if (!node) return;

    // Store the exercise results
    setExerciseResults({ accuracy });
    
    // Only increment completion count if accuracy is at least 95%
    if (accuracy >= 95) {
      // Save the practice result and increment completion count
      incrementNodeCompletion(node.id, accuracy)
        .then(result => {
          console.log("Node completion result:", result);
          
          // Show feedback based on accuracy
          toast({
            title: "Great job!",
            description: `You scored ${Math.round(accuracy)}%. Your progress has been saved.`,
            variant: "default", 
          });
          
          // If node is now fully completed (3 times with 95%)
          if (result && result.isCompleted) {
            toast({
              title: "Node completed!",
              description: `You've mastered this exercise. The next lesson is now available.`,
              variant: "default",
            });
          }
        })
        .catch(error => {
          console.error("Error updating node completion:", error);
          toast({
            title: "Error saving progress",
            description: "Please try again later",
            variant: "destructive",
          });
        });
    } else {
      // Show feedback for lower accuracy
      toast({
        title: "Keep practicing!",
        description: `You scored ${Math.round(accuracy)}%. Try to get above 95% for it to count toward full completion.`,
        variant: "default",
      });
    }
  };

  const handleTryAgain = () => {
    setExerciseResults(null);
    setPracticeStage(PracticeStage.PROMPT);
  };

  const handleMarkCompleted = async () => {
    if (!node) return;
    
    try {
      await markNodeAsCompleted(node.id);
      toast({
        title: "Progress saved!",
        description: "You've completed this exercise",
        variant: "default",
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

  // Get the completion info for this node (if it exists)
  const nodeCompletionInfo = node ? 
    nodeProgress.find(np => np.nodeId === node.id) : 
    null;
  
  const completionCount = nodeCompletionInfo?.completionCount || 0;
  const isNodeCompleted = node ? 
    completedNodes.includes(node.id) || 
    (nodeCompletionInfo?.isCompleted === true) : 
    false;
    
  // Calculate progress percentage (out of 3 completions)
  const progressPercentage = Math.min(completionCount / 3 * 100, 100);

  if (!node) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-w-[95vw] p-0 overflow-hidden">
        <DialogHeader className="p-6 flex flex-row justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">{node.title}</DialogTitle>
              {isNodeCompleted && (
                <Badge className="bg-green-500 text-white flex gap-1 items-center">
                  <CheckCircle className="w-3 h-3" /> Completed
                </Badge>
              )}
            </div>
            <DialogDescription className="text-base mt-2 space-y-2">
              <p>{node.description}</p>
              
              {completionCount > 0 && (
                <div className="pt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Completion progress: {completionCount}/3</span>
                    <span>{isNodeCompleted ? '100%' : `${Math.round(progressPercentage)}%`}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {isNodeCompleted 
                      ? "Mastered! You've completed this exercise." 
                      : "Complete this exercise 3 times with at least 95% accuracy to master it."}
                  </p>
                </div>
              )}
            </DialogDescription>
          </div>
          <DialogClose className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors" aria-label="Close">
            <X className="h-4 w-4" />
          </DialogClose>
        </DialogHeader>
        
        {practiceStage === PracticeStage.PROMPT && (
          <div className="px-6 pt-0 pb-6 space-y-6">
            <div className="mb-6">
              <p className="text-lg font-medium mb-2">Boost Your Understanding Before You Start</p>
              <p className="text-muted-foreground">Dive into a Reading Analysis to see how words and grammar work — or skip straight to dictation.</p>
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
            
            {!exercise && !loading && (
              <div className="mt-6 flex justify-center">
                <Button onClick={handleMarkCompleted} variant="outline">
                  Mark as Completed
                </Button>
              </div>
            )}
          </div>
        )}
        
        {practiceStage === PracticeStage.READING && exercise && (
          <ReadingAnalysis
            text={exercise.text || ""}
            language={node.language || 'english'}
            onClose={() => setPracticeStage(PracticeStage.PROMPT)}
            onProceedToDictation={handleStartDictation}
          />
        )}

        {practiceStage === PracticeStage.READING && !exercise && (
          <div className="text-center py-6">
            {loading || nodeLoading ? (
              <p>Loading exercise...</p>
            ) : (
              <>
                <p>No exercise content available for reading analysis.</p>
                <Button onClick={handleTryAgain} className="mt-4">
                  Go Back
                </Button>
              </>
            )}
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
            keepResultsVisible={true} // Keep results visible by default
            autoPlay={true} // Enable autoplay for audio
            hasReadingAnalysis={true} // Show reading analysis button
            onViewReadingAnalysis={handleStartReadingAnalysis} // Add handler for reading analysis button
          />
        )}
        
        {practiceStage === PracticeStage.DICTATION && !exercise && (
          <div className="text-center py-6">
            {loading || nodeLoading ? (
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
