import React, { useState, useEffect } from 'react';
import { useRoadmap } from '../hooks/use-hook-imports';
import type { Language } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRoadmap } from '../hooks/use-hook-imports';
import { RoadmapNode, ExerciseContent } from '../types';
import DictationPractice from '@/components/DictationPractice';
import { toast } from '@/components/ui/use-toast';
import LearningOptionsMenu from './LearningOptionsMenu';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, Loader2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import ReadingAnalysis from '@/components/ReadingAnalysis';

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
  RESULTS,         // Show results after completion
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
    nodeProgress,
    completedNodes,
  } = useRoadmap();

  const [exercise, setExercise] = useState<ExerciseContent | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [practiceStage, setPracticeStage] = useState<PracticeStage>(PracticeStage.LEARNING_OPTIONS);
  const [exerciseResult, setExerciseResult] = useState<{ 
    accuracy: number; 
    isCompleted: boolean;
    nextNodeId?: string;
  } | null>(null);
  const [existingAnalysisId, setExistingAnalysisId] = useState<string | null>(null);

  // Load exercise when modal is opened with a node
  useEffect(() => {
    if (node && isOpen) {
      loadExercise(node.id);
      setPracticeStage(PracticeStage.LEARNING_OPTIONS);
      setExerciseResult(null);
    } else if (!isOpen) {
      // Reset states when modal is closed
      setExercise(null);
      setExerciseResult(null);
    }
  }, [node, isOpen]);

  const loadExercise = async (nodeId: string) => {
    try {
      setLoading(true);
      const exerciseData = await getNodeExercise(nodeId);
      setExercise(exerciseData);
      
      // Check if there's an existing reading analysis for this exercise
      if (exerciseData && exerciseData.readingAnalysisId) {
        setExistingAnalysisId(exerciseData.readingAnalysisId);
      } else {
        setExistingAnalysisId(null);
      }
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

  // Get the node progress info for the current node
  const getNodeProgressInfo = () => {
    if (!node) return null;
    return nodeProgress.find(np => np.nodeId === node.id);
  };

  const nodeProgressInfo = getNodeProgressInfo();
  const completionCount = nodeProgressInfo?.completionCount || 0;
  const isNodeCompleted = node ? completedNodes.includes(node.id) || nodeProgressInfo?.isCompleted : false;

  const handleStartReadingAnalysis = () => {
    setPracticeStage(PracticeStage.READING);
  };

  const handleStartDictation = () => {
    setPracticeStage(PracticeStage.DICTATION);
  };

  const handleReadingAnalysisComplete = () => {
    // Transition to dictation practice after reading analysis is completed
    setPracticeStage(PracticeStage.DICTATION);
  };

  const handlePracticeComplete = async (accuracy: number) => {
    if (!node) return;

    try {
      const result = await incrementNodeCompletion(node.id, accuracy);
      
      setExerciseResult({
        accuracy,
        isCompleted: result.isCompleted,
        nextNodeId: result.nextNodeId,
      });
      
      setPracticeStage(PracticeStage.RESULTS);
      
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
    } catch (error) {
      console.error("Error updating progress:", error);
      toast({
        title: "Error saving progress",
        description: "There was a problem updating your progress",
        variant: "destructive"
      });
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

  const handleContinue = () => {
    onOpenChange(false);
  };

  const renderResultsScreen = () => {
    if (!exerciseResult) return null;
    
    const accuracy = exerciseResult.accuracy;
    const isPassing = accuracy >= 95;
    const progressValue = Math.min(100, Math.round(accuracy));
    
    return (
      <div className="p-6 space-y-6">
        <div className="text-center space-y-2 mb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex justify-center mb-2"
          >
            {isPassing ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <AlertTriangle className="h-16 w-16 text-amber-500" />
            )}
          </motion.div>
          
          <h3 className="text-xl font-bold">
            {isPassing ? 'Exercise completed!' : 'Keep practicing'}
          </h3>
          
          <p className="text-muted-foreground">
            {isPassing 
              ? `Great job! ${completionCount + 1 >= 3 
                   ? "You've completed this exercise!" 
                   : `${3 - completionCount - 1} more successful ${3 - completionCount - 1 > 1 ? 'attempts' : 'attempt'} until completion.`}`
              : 'You need 95% or higher accuracy for the exercise to count toward completion.'}
          </p>
        </div>
        
        <div className="space-y-2 py-2">
          <div className="flex justify-between text-sm mb-1">
            <span>Your accuracy</span>
            <span className={isPassing ? "text-green-500 font-semibold" : "text-amber-500 font-semibold"}>
              {Math.round(accuracy)}%
            </span>
          </div>
          <Progress value={progressValue} className={isPassing ? "bg-green-100" : "bg-amber-100"} />
          
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0%</span>
            <div className="flex items-center">
              <span>Target: 95%</span>
              <div className="h-3 w-px bg-muted-foreground mx-2" />
              <span>100%</span>
            </div>
          </div>
        </div>
        
        {/* Progress tracking card */}
        <div className="bg-muted/20 p-4 rounded-md border border-muted dark:border-muted/30 text-center">
          <h4 className="font-medium mb-2">Exercise Progress</h4>
          <div className="flex justify-center items-center gap-1 mb-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full ${
                  i < (isPassing ? completionCount + 1 : completionCount)
                    ? "bg-green-500" 
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {isPassing
              ? `${completionCount + 1}/3 successful completions${completionCount + 1 >= 3 ? " - Mastered!" : ""}`
              : `${completionCount}/3 successful completions`}
          </p>
        </div>
        
        {exerciseResult.isCompleted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md border border-green-200 dark:border-green-800 text-center"
          >
            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 mb-2">
              Node Completed!
            </Badge>
            <p className="text-sm text-muted-foreground">
              You've completed this lesson. The next lesson has been unlocked.
            </p>
          </motion.div>
        )}
        
        <div className="flex justify-center space-x-4 mt-6">
          <Button variant="outline" onClick={handleTryAgain}>
            Practice Again
          </Button>
          <Button onClick={handleContinue}>
            {exerciseResult.isCompleted ? 'Continue to Next Lesson' : 'Close'}
          </Button>
        </div>
      </div>
    );
  };

  if (!node) {
    return null;
  }

  const hasReadingAnalysis = !!existingAnalysisId;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-w-[95vw] p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`stage-${practiceStage}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <DialogHeader className="p-6">
              <DialogTitle className="text-xl">
                {node.title}
                {node.isBonus && (
                  <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                    Bonus
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                {node.description}
              </DialogDescription>
              
              {/* Progress indicator for node */}
              {completionCount > 0 && (
                <div className="flex items-center gap-3 mt-4">
                  <span className="text-sm text-muted-foreground">Progress:</span>
                  <div className="flex gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-2 h-2 rounded-full ${
                          i < completionCount 
                            ? "bg-green-500" 
                            : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {completionCount}/3 completions
                  </span>
                </div>
              )}
            </DialogHeader>
            
            {practiceStage === PracticeStage.LEARNING_OPTIONS && (
              <LearningOptionsMenu 
                onStartReadingAnalysis={handleStartReadingAnalysis}
                onStartDictation={handleStartDictation}
                exerciseTitle={exercise?.title}
                hasReadingAnalysis={hasReadingAnalysis}
              />
            )}
            
            {practiceStage === PracticeStage.READING && (
              <ReadingAnalysis 
                exercise={{
                  id: `roadmap-${node.id}`,
                  title: exercise?.title || node.title,
                  text: exercise?.text || "",
                  language: (exercise?.language as Language) || "english",
                  audioUrl: exercise?.audioUrl,
                  tags: [],
                  directoryId: null,
                  createdAt: new Date(),
                  completionCount: 0,
                  isCompleted: false
                }}
                onComplete={handleReadingAnalysisComplete}
                existingAnalysisId={existingAnalysisId || undefined}
              />
            )}
            
            {practiceStage === PracticeStage.DICTATION && exercise && (
              <DictationPractice
                exercise={{
                  id: `roadmap-${node.id}`,
                  title: exercise.title || node.title,
                  text: exercise.text || "",
                  language: (exercise.language as Language) || "english",
                  audioUrl: exercise.audioUrl,
                  tags: [],
                  directoryId: null,
                  createdAt: new Date(),
                  completionCount: completionCount, // Pass the current completion count
                  isCompleted: isNodeCompleted
                }}
                onTryAgain={handleTryAgain}
                onComplete={handlePracticeComplete}
                hasReadingAnalysis={hasReadingAnalysis}
                onViewReadingAnalysis={handleStartReadingAnalysis}
              />
            )}
            
            {practiceStage === PracticeStage.DICTATION && !exercise && (
              <div className="text-center py-6 px-6">
                {loading ? (
                  <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p>Loading exercise content...</p>
                  </div>
                ) : (
                  <div className="bg-muted/40 rounded-lg p-6">
                    <p className="mb-4">No exercise content available.</p>
                    <Button onClick={handleTryAgain} className="mt-2">
                      Go Back
                    </Button>
                    <div className="mt-4 pt-4 border-t">
                      <Button variant="outline" size="sm" onClick={handleMarkCompleted}>
                        Mark as completed anyway
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {practiceStage === PracticeStage.RESULTS && renderResultsScreen()}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default RoadmapExerciseModal;
