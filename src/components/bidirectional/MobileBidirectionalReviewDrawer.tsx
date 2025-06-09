import React from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import type { BidirectionalExercise } from '@/types/bidirectional';

interface MobileBidirectionalReviewDrawerProps {
  exercise: BidirectionalExercise | null;
  reviewType: 'forward' | 'backward';
  isOpen: boolean;
  onClose: () => void;
  userRecall: string;
  setUserRecall: (value: string) => void;
  showAnswer: boolean;
  onShowAnswer: () => void;
  onMarkResult: (isCorrect: boolean) => void;
  isLoading: boolean;
  currentReviewRound: number;
  getPromptText: () => string;
  getSourceText: () => string;
  getExpectedAnswer: () => string;
  handlePlayAudio: () => void;
}

export const MobileBidirectionalReviewDrawer: React.FC<MobileBidirectionalReviewDrawerProps> = ({
  exercise,
  reviewType,
  isOpen,
  onClose,
  userRecall,
  setUserRecall,
  showAnswer,
  onShowAnswer,
  onMarkResult,
  isLoading,
  currentReviewRound,
  getPromptText,
  getSourceText,
  getExpectedAnswer,
  handlePlayAudio
}) => {
  if (!exercise) return null;

  // Updated interval calculation to match the new schedule: again, 1d, 3d, 7d, mastered
  const calculateNextReviewInterval = (isCorrect: boolean, reviewRound: number = 1) => {
    if (!isCorrect) {
      // If incorrect, reset to 30 seconds
      return { days: 0, hours: 0, minutes: 0, seconds: 30 };
    }

    // New progression: 30s → 1d → 3d → 7d → mastered
    switch (reviewRound) {
      case 1:
        // First review after 30 seconds
        return { days: 0, hours: 0, minutes: 0, seconds: 30 };
      case 2:
        // Second review after 1 day
        return { days: 1, hours: 0, minutes: 0, seconds: 0 };
      case 3:
        // Third review after 3 days
        return { days: 3, hours: 0, minutes: 0, seconds: 0 };
      case 4:
        // Fourth review after 7 days
        return { days: 7, hours: 0, minutes: 0, seconds: 0 };
      default:
        // After 4th review, mark as mastered
        return { days: 0, hours: 0, minutes: 0, seconds: 0, mastered: true };
    }
  };

  // Format interval for display
  const formatInterval = (interval: { days: number; hours: number; minutes: number; seconds: number; mastered?: boolean }) => {
    if (interval.mastered) {
      return 'Mastered!';
    }
    if (interval.days > 0) {
      return `${interval.days}d`;
    } else if (interval.hours > 0) {
      return `${interval.hours}h`;
    } else if (interval.minutes > 0) {
      return `${interval.minutes}m`;
    } else {
      return `${interval.seconds}s`;
    }
  };

  // Calculate intervals for button display - use the next round for correct, round 1 for incorrect
  const correctInterval = calculateNextReviewInterval(true, currentReviewRound + 1);

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[95vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="flex items-center gap-2 text-base">
            <ArrowLeft className="h-4 w-4" />
            {reviewType === 'forward' ? 'Forward' : 'Backward'} Review (Round {currentReviewRound})
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-3 overflow-y-auto">
          {/* Prompt */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{getPromptText()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-start gap-2">
                <p className="text-lg font-medium w-full mb-2 break-words">
                  {getSourceText()}
                </p>
                {reviewType === 'forward' && exercise.original_audio_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePlayAudio}
                    className="w-full justify-center"
                  >
                    <Play className="h-3 w-3 mr-2" />
                    Play Audio
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* User Input */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Your Translation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={userRecall}
                onChange={(e) => setUserRecall(e.target.value)}
                placeholder="Enter your translation..."
                rows={3}
                disabled={showAnswer}
                className="text-base"
              />
              
              {!showAnswer && (
                <Button 
                  onClick={onShowAnswer}
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
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Compare Your Answer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  <div className="p-3 border rounded-md">
                    <p className="text-xs text-muted-foreground mb-2">Your Translation:</p>
                    <p className="font-medium text-sm break-words">{userRecall}</p>
                  </div>
                  <div className="p-3 border rounded-md bg-muted">
                    <p className="text-xs text-muted-foreground mb-2">Expected Answer:</p>
                    <p className="font-medium text-sm break-words">{getExpectedAnswer()}</p>
                  </div>
                </div>

                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">How did you do?</p>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => onMarkResult(false)}
                      disabled={isLoading}
                      variant="destructive"
                      className="w-full justify-center"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Again
                    </Button>
                    <Button
                      onClick={() => onMarkResult(true)}
                      disabled={isLoading}
                      className="w-full justify-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Good ({formatInterval(correctInterval)})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
