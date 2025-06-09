import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { BidirectionalService } from '@/services/bidirectionalService';
import type { BidirectionalExercise } from '@/types/bidirectional';
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
  const { toast } = useToast();
  const [userRecall, setUserRecall] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setUserRecall('');
      setShowAnswer(false);
    }
  }, [isOpen, exercise, reviewType]);

  // Calculate next review intervals based on spaced repetition
  const calculateNextReviewDays = (isCorrect: boolean) => {
    if (isCorrect) {
      // Correct answer - longer intervals (similar to Anki)
      return Math.round(1 * 2.5); // ~3 days for correct
    } else {
      // Incorrect answer - shorter interval
      return 1; // 1 day for incorrect
    }
  };

  const handlePlayAudio = () => {
    if (exercise?.original_audio_url) {
      const audio = new Audio(exercise.original_audio_url);
      audio.play().catch(console.error);
    }
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleMarkResult = async (isCorrect: boolean) => {
    if (!exercise || !userRecall.trim()) {
      toast({
        title: "Error",
        description: "Please enter your recall attempt first.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await BidirectionalService.recordReview({
        exercise_id: exercise.id,
        review_type: reviewType,
        user_recall_attempt: userRecall,
        is_correct: isCorrect,
        feedback: isCorrect ? "Correct!" : "Needs more practice"
      });

      const nextReviewDays = calculateNextReviewDays(isCorrect);
      
      toast({
        title: "Review Complete",
        description: isCorrect 
          ? `Great job! Next review in ${nextReviewDays} days.` 
          : `Don't worry, you'll see this again tomorrow.`,
        variant: isCorrect ? "default" : "destructive"
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

  const getPromptText = () => {
    if (!exercise) return '';

    if (reviewType === 'forward') {
      return `Translate this ${exercise.target_language} sentence to ${exercise.support_language}:`;
    } else {
      return `Translate this ${exercise.support_language} sentence back to ${exercise.target_language}:`;
    }
  };

  const getSourceText = () => {
    if (!exercise) return '';

    if (reviewType === 'forward') {
      return exercise.original_sentence;
    } else {
      return exercise.user_forward_translation || exercise.normal_translation || '';
    }
  };

  const getExpectedAnswer = () => {
    if (!exercise) return '';

    if (reviewType === 'forward') {
      return exercise.user_forward_translation || exercise.normal_translation || '';
    } else {
      return exercise.original_sentence;
    }
  };

  if (!exercise) return null;

  const correctDays = calculateNextReviewDays(true);
  const incorrectDays = calculateNextReviewDays(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {reviewType === 'forward' ? 'Forward' : 'Backward'} Review
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Prompt */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{getPromptText()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <p className="text-xl font-medium flex-1">{getSourceText()}</p>
                {reviewType === 'forward' && exercise.original_audio_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePlayAudio}
                    className="flex items-center gap-1"
                  >
                    <Play className="h-3 w-3" />
                    Play
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* User Input */}
          <Card>
            <CardHeader>
              <CardTitle>Your Translation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={userRecall}
                onChange={(e) => setUserRecall(e.target.value)}
                placeholder="Enter your translation..."
                rows={3}
                disabled={showAnswer}
              />
              
              {!showAnswer && (
                <Button 
                  onClick={handleShowAnswer}
                  disabled={!userRecall.trim()}
                  className="w-full"
                >
                  Show Answer
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Answer Comparison */}
          {showAnswer && (
            <Card>
              <CardHeader>
                <CardTitle>Compare Your Answer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-md">
                    <p className="text-sm text-muted-foreground mb-2">Your Translation:</p>
                    <p className="font-medium">{userRecall}</p>
                  </div>
                  <div className="p-4 border rounded-md bg-muted">
                    <p className="text-sm text-muted-foreground mb-2">Expected Answer:</p>
                    <p className="font-medium">{getExpectedAnswer()}</p>
                  </div>
                </div>

                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">How did you do?</p>
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={() => handleMarkResult(false)}
                      disabled={isLoading}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Again ({incorrectDays}d)
                    </Button>
                    <Button
                      onClick={() => handleMarkResult(true)}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Good ({correctDays}d)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
