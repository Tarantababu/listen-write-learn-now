
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
import ReadingAnalysis from '@/components/ReadingAnalysis';
import { Loader2, Star, CheckCircle, Search, Headphones } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

enum PracticeStage {
  PROMPT,    // Ask user if they want Reading Analysis
  READING,   // Reading Analysis mode
  DICTATION, // Dictation Practice mode
}

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
  const { user } = useAuth();
  const { subscription } = useSubscription();
  
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(false);
  const [practicing, setPracticing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  
  // Track how many times the user has completed the exercise with >= 95% accuracy
  const [completionCount, setCompletionCount] = useState(0);
  const [progressValue, setProgressValue] = useState(0);
  
  // Reading analysis state
  const [practiceStage, setPracticeStage] = useState<PracticeStage>(PracticeStage.PROMPT);
  const [hasExistingAnalysis, setHasExistingAnalysis] = useState<boolean>(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysisAllowed, setAnalysisAllowed] = useState<boolean>(true);
  const [loadingAnalysisCheck, setLoadingAnalysisCheck] = useState<boolean>(false);
  const [showResults, setShowResults] = useState(false);
  
  const hasInitializedRef = React.useRef<boolean>(false);

  useEffect(() => {
    const loadExercise = async () => {
      if (node && isOpen) {
        setLoading(true);
        try {
          // Load exercise data
          const exerciseData = await getNodeExercise(node.id);
          
          // Check for existing completion count from the database
          if (user && exerciseData) {
            const { data: completions, error } = await supabase
              .from('completions')
              .select('*')
              .eq('exercise_id', exerciseData.id)
              .eq('user_id', user.id)
              .eq('completed', true)
              .order('created_at', { ascending: false });
            
            if (!error && completions) {
              // Count successful completions (≥ 95% accuracy)
              const successfulCompletions = completions.filter(c => c.accuracy >= 95);
              const count = Math.min(successfulCompletions.length, 3);
              setCompletionCount(count);
              setProgressValue((count / 3) * 100);
            }
          }
          
          setExercise(exerciseData);
          setCompleted(false);
          setAccuracy(0);
        } finally {
          setLoading(false);
        }
      }
    };

    loadExercise();
  }, [node, isOpen, getNodeExercise, user]);
  
  // Check if the user has an existing reading analysis for this exercise
  useEffect(() => {
    const checkExistingAnalysis = async () => {
      if (!exercise || !user || !isOpen) return;
      
      try {
        setLoadingAnalysisCheck(true);
        
        // Check for existing analysis
        const { data: analysisData, error } = await supabase
          .from('reading_analyses')
          .select('id')
          .eq('exercise_id', exercise.id)
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (!error && analysisData) {
          setHasExistingAnalysis(true);
          setAnalysisId(analysisData.id);
          // If user has done reading analysis before, skip to dictation directly
          setPracticeStage(PracticeStage.DICTATION);
        } else {
          setHasExistingAnalysis(false);
          setAnalysisId(null);

          // For free users, check if they've reached their limit
          if (!subscription.isSubscribed) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('reading_analyses_count')
              .eq('id', user.id)
              .maybeSingle();
            
            if (!profileError && profileData) {
              // Free users are limited to 5 analyses
              if (profileData.reading_analyses_count >= 5) {
                setAnalysisAllowed(false);
                toast({
                  title: "Free user limit reached",
                  description: "Free users are limited to 5 reading analyses. Upgrade to premium for unlimited analyses.",
                  variant: "destructive"
                });
              }
            }
          }
          
          setPracticeStage(PracticeStage.PROMPT);
        }
      } catch (error) {
        console.error('Error in analysis check:', error);
      } finally {
        setLoadingAnalysisCheck(false);
      }
    };
    
    // Only check when modal opens AND we haven't initialized yet
    if (isOpen && !hasInitializedRef.current && exercise) {
      checkExistingAnalysis();
      hasInitializedRef.current = true;
    }
    
    // Reset the initialization ref when modal closes
    if (!isOpen) {
      hasInitializedRef.current = false;
    }
  }, [exercise, user, isOpen, subscription.isSubscribed]);

  const handleStartPractice = () => {
    setPracticing(true);
  };
  
  const handleStartDictation = () => {
    setPracticeStage(PracticeStage.DICTATION);
  };
  
  const handleStartReadingAnalysis = () => {
    setPracticeStage(PracticeStage.READING);
  };
  
  const handleViewReadingAnalysis = () => {
    // If we're already in dictation mode, we need to switch to reading analysis
    if (practiceStage === PracticeStage.DICTATION) {
      setPracticeStage(PracticeStage.READING);
    }
  };

  const handlePracticeComplete = async (accuracyValue: number) => {
    setAccuracy(accuracyValue);
    setPracticing(false);
    setShowResults(true);
    
    if (accuracyValue >= 95) {
      const newCompletionCount = Math.min(3, completionCount + 1);
      setCompletionCount(newCompletionCount);
      setProgressValue((newCompletionCount / 3) * 100);
      
      if (newCompletionCount >= 3) {
        setCompleted(true);
      }
    }
    
    // Record completion in database
    if (user && exercise) {
      try {
        await supabase
          .from('completions')
          .insert({
            user_id: user.id,
            exercise_id: exercise.id,
            accuracy: accuracyValue,
            completed: accuracyValue >= 95
          });
      } catch (error) {
        console.error('Error saving completion record:', error);
      }
    }
  };

  const handleTryAgain = () => {
    setShowResults(false);
  };

  const handleCompleteNode = async () => {
    if (!node) return;

    try {
      await markNodeAsCompleted(node.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error completing node:', error);
      toast({
        title: "Error",
        description: "Failed to mark node as completed",
        variant: "destructive"
      });
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
              {practiceStage === PracticeStage.PROMPT && !practicing && !completed ? (
                <div className="space-y-6">
                  {/* Progress display */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">
                      Progress: {completionCount}/3 completions
                    </span>
                    <div className="w-32">
                      <Progress value={progressValue} className="h-2" />
                    </div>
                  </div>

                  {exercise && (
                    <div className="p-4 border rounded-md bg-background">
                      <h3 className="font-medium mb-2">Exercise Preview</h3>
                      <p className="text-sm text-muted-foreground">{exercise.title}</p>
                      <div className="mt-2 p-2 bg-muted/30 rounded text-sm">
                        <p className="line-clamp-3">{exercise.text}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Card className="border-muted overflow-hidden hover:bg-muted/5 transition-colors dark:hover:bg-muted/10">
                      <CardContent className="p-0">
                        <Button 
                          onClick={handleStartReadingAnalysis} 
                          variant="ghost" 
                          disabled={!analysisAllowed || loadingAnalysisCheck} 
                          className="h-auto py-8 px-6 w-full rounded-none border-0 flex flex-col items-center justify-center text-left bg-transparent"
                        >
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
                        <Button 
                          onClick={handleStartDictation} 
                          variant="ghost" 
                          className="h-auto py-8 px-6 w-full rounded-none border-0 flex flex-col items-center justify-center text-left bg-transparent"
                        >
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
                  
                  {!analysisAllowed && !subscription.isSubscribed && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md flex items-start mt-6 dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-300">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Free user limit reached</p>
                        <p className="text-sm mt-1">
                          You've reached the limit of 5 reading analyses for free users. 
                          Upgrade to premium for unlimited analyses.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : practiceStage === PracticeStage.READING ? (
                <ReadingAnalysis 
                  exercise={exercise} 
                  onComplete={handleStartDictation} 
                  existingAnalysisId={analysisId || undefined} 
                />
              ) : practiceStage === PracticeStage.DICTATION ? (
                exercise && (
                  <DictationPractice 
                    exercise={exercise} 
                    onComplete={handlePracticeComplete} 
                    showResults={showResults}
                    onTryAgain={handleTryAgain}
                    hasReadingAnalysis={hasExistingAnalysis}
                    onViewReadingAnalysis={hasExistingAnalysis ? handleViewReadingAnalysis : undefined}
                  />
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
                      <span>Progress</span>
                      <span className="font-medium">{completionCount}/3 completions</span>
                    </div>
                    <Progress value={progressValue} className="h-2" />
                  </div>
                </div>
              ) : null}
            </div>

            {completed && completionCount >= 3 && (
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
