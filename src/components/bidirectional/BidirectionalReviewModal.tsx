
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, ArrowRight, CheckCircle, XCircle, Brain } from 'lucide-react';
import type { BidirectionalExercise } from '@/types/bidirectional';
import { BidirectionalService } from '@/services/bidirectionalService';
import { useToast } from '@/hooks/use-toast';

interface BidirectionalReviewModalProps {
  exercise: BidirectionalExercise | null;
  reviewType: 'forward' | 'backward';
  isOpen: boolean;
  onClose: () => void;
  onReviewComplete: () => void;
}

export const BidirectionalReviewModal: React.FC<BidirectionalReviewModalProps> = ({
  exercise,
  reviewType,
  isOpen,
  onClose,
  onReviewComplete
}) => {
  const [step, setStep] = useState<'recall' | 'check' | 'result'>('recall');
  const [userAttempt, setUserAttempt] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen) {
      setStep('recall');
      setUserAttempt('');
      setIsCorrect(null);
      setFeedback('');
    }
  }, [isOpen]);

  const getPromptText = () => {
    if (!exercise) return '';
    
    if (reviewType === 'forward') {
      return exercise.original_sentence;
    } else {
      return exercise.user_forward_translation || exercise.normal_translation || '';
    }
  };

  const getTargetText = () => {
    if (!exercise) return '';
    
    if (reviewType === 'forward') {
      return exercise.user_forward_translation || exercise.normal_translation || '';
    } else {
      return exercise.original_sentence;
    }
  };

  const handleShowAnswer = () => {
    setStep('check');
  };

  const handleMarkCorrect = (correct: boolean) => {
    setIsCorrect(correct);
    setStep('result');
  };

  const handleFinish = async () => {
    if (!exercise || isCorrect === null) return;

    setIsLoading(true);
    try {
      await BidirectionalService.recordReview({
        exercise_id: exercise.id,
        review_type: reviewType,
        user_recall_attempt: userAttempt,
        is_correct: isCorrect,
        feedback: feedback || undefined
      });

      toast({
        title: isCorrect ? "Correct!" : "Keep practicing",
        description: isCorrect 
          ? "Great job! Review scheduled for later." 
          : "No worries, you'll see this again soon."
      });

      onReviewComplete();
      onClose();
    } catch (error) {
      console.error('Error recording review:', error);
      toast({
        title: "Error",
        description: "Failed to record review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (audioUrl?: string) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  if (!exercise) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Review: {reviewType === 'forward' ? 'Forward' : 'Backward'} Translation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'recall' && (
            <Card>
              <CardHeader>
                <CardTitle>Try to recall the translation</CardTitle>
                <CardDescription>
                  {reviewType === 'forward' 
                    ? `Translate from ${exercise.target_language} to ${exercise.support_language}`
                    : `Translate from ${exercise.support_language} to ${exercise.target_language}`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium text-lg">{getPromptText()}</p>
                    {reviewType === 'forward' && exercise.original_audio_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => playAudio(exercise.original_audio_url)}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your translation attempt:
                  </label>
                  <Textarea
                    value={userAttempt}
                    onChange={(e) => setUserAttempt(e.target.value)}
                    placeholder="Type your translation here..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleShowAnswer}
                  className="w-full"
                >
                  Show Answer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 'check' && (
            <Card>
              <CardHeader>
                <CardTitle>Compare your answer</CardTitle>
                <CardDescription>
                  How did you do?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Original:</p>
                    <p>{getPromptText()}</p>
                  </div>
                  
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm font-medium mb-1">Your Attempt:</p>
                    <p>{userAttempt || 'No attempt entered'}</p>
                  </div>
                  
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm font-medium mb-1">Correct Answer:</p>
                    <p>{getTargetText()}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleMarkCorrect(false)}
                    variant="outline"
                    className="flex-1 text-red-600 hover:text-red-700"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Incorrect
                  </Button>
                  <Button
                    onClick={() => handleMarkCorrect(true)}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Correct
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'result' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isCorrect ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Great job!
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      Keep practicing
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {isCorrect 
                    ? "You'll see this again later with increased spacing."
                    : "You'll see this again soon for more practice."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Additional notes (optional):
                  </label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Any thoughts or notes about this review..."
                    rows={2}
                  />
                </div>

                <Button
                  onClick={handleFinish}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Saving...' : 'Complete Review'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
