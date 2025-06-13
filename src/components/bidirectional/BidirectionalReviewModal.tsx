
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, CheckCircle, XCircle, ArrowLeft, Volume2 } from 'lucide-react';
import { BidirectionalService } from '@/services/bidirectionalService';
import type { BidirectionalExercise, BidirectionalReview } from '@/types/bidirectional';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { compareTexts } from '@/utils/textComparison';
import AudioPlayer from '@/components/AudioPlayer';

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
  const isMobile = useIsMobile();
  const [userRecall, setUserRecall] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previousReviews, setPreviousReviews] = useState<BidirectionalReview[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [textComparison, setTextComparison] = useState<ReturnType<typeof compareTexts> | null>(null);

  React.useEffect(() => {
    if (isOpen && exercise) {
      setUserRecall('');
      setShowAnswer(false);
      setTextComparison(null);
      loadReviewSession();
    }
  }, [isOpen, exercise, reviewType]);

  const loadReviewSession = async () => {
    if (!exercise) return;

    try {
      const { data: reviewsData } = await BidirectionalService.getPreviousReviews(
        exercise.id, 
        reviewType
      );
      
      const reviews = (reviewsData || []) as BidirectionalReview[];
      const round = BidirectionalService.calculateActualReviewRound(reviews);
      
      setPreviousReviews(reviews);
      setCurrentRound(round);
      setIsLoaded(true);

      console.log(`Loaded review session - Round: ${round}, Previous reviews: ${reviews.length}`);
    } catch (error) {
      console.error('Error loading review session:', error);
      setPreviousReviews([]);
      setCurrentRound(1);
      setIsLoaded(true);
    }
  };

  // Format interval for display
  const formatInterval = (interval: { days: number; hours: number; minutes: number; seconds: number; mastered?: boolean }): string => {
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

  // Get the correct interval for the "Good" button
  const getGoodButtonInterval = () => {
    if (!exercise || !isLoaded) {
      return { days: 0, hours: 0, minutes: 0, seconds: 30 };
    }

    // Calculate what the interval would be for a correct answer
    return BidirectionalService.calculateGoodButtonInterval(
      exercise.id,
      reviewType,
      false, // Not using session state anymore
      previousReviews
    );
  };

  const handlePlayAudio = () => {
    if (exercise?.original_audio_url) {
      const audio = new Audio(exercise.original_audio_url);
      audio.play().catch(console.error);
    }
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
    
    // Generate text comparison when showing answer
    if (userRecall.trim() && exercise) {
      const expectedAnswer = getExpectedAnswer();
      if (expectedAnswer) {
        const comparison = compareTexts(expectedAnswer, userRecall);
        setTextComparison(comparison);
      }
    }
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

      // Calculate the next interval for feedback
      const nextInterval = isCorrect
        ? BidirectionalService.calculateGoodButtonInterval(
            exercise.id,
            reviewType,
            false,
            previousReviews
          )
        : { days: 0, hours: 0, minutes: 0, seconds: 30 }; // "Again" always shows 30s
      
      const intervalText = formatInterval(nextInterval);
      
      toast({
        title: "Review Complete",
        description: isCorrect 
          ? nextInterval.mastered 
            ? `Excellent! This exercise is now mastered.`
            : `Great job! Next review in ${intervalText}.`
          : `This exercise has been reset to the beginning. You'll see it again in 30s.`,
        variant: isCorrect ? "default" : "destructive"
      });

      // Close modal first, then trigger refresh
      onClose();
      // Small delay to ensure modal closes before refreshing
      setTimeout(() => {
        onReviewComplete();
      }, 100);
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

  const getAudioUrl = () => {
    if (!exercise) return null;

    if (reviewType === 'forward') {
      return exercise.original_audio_url;
    } else {
      return exercise.normal_translation_audio_url;
    }
  };

  const renderWordFeedback = (comparison: ReturnType<typeof compareTexts>) => {
    if (!comparison) return null;
    
    return (
      <div className="space-y-2">
        <div className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-muted-foreground`}>Word-by-word analysis:</div>
        <div className="flex flex-wrap gap-1 p-2 bg-muted/50 rounded-md border">
          {comparison.tokenResults.map((token, index) => {
            let className = "px-1.5 py-0.5 rounded text-xs ";
            let displayText = token.userToken || `[${token.originalToken}]`;
            
            switch (token.status) {
              case 'correct':
                className += "bg-green-100 text-green-700 border border-green-200";
                break;
              case 'almost':
                className += "bg-yellow-100 text-yellow-700 border border-yellow-200";
                break;
              case 'incorrect':
                className += "bg-red-100 text-red-700 border border-red-200";
                break;
              case 'missing':
                className += "bg-gray-100 text-gray-600 border border-gray-200 line-through";
                displayText = `[${token.originalToken}]`;
                break;
              case 'extra':
                className += "bg-orange-100 text-orange-700 border border-orange-200";
                break;
              default:
                className += "bg-gray-100 text-gray-600";
            }
            
            return (
              <span key={index} className={className}>
                {displayText}
              </span>
            );
          })}
        </div>
        
        <div className="grid grid-cols-3 md:grid-cols-5 gap-1 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-xs">Correct ({comparison.correct})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span className="text-xs">Almost ({comparison.almost})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-100 border border-red-200 rounded"></div>
            <span className="text-xs">Wrong ({comparison.incorrect})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-100 border border-gray-200 rounded"></div>
            <span className="text-xs">Missing ({comparison.missing})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-orange-100 border border-orange-200 rounded"></div>
            <span className="text-xs">Extra ({comparison.extra})</span>
          </div>
        </div>
      </div>
    );
  };

  if (!exercise) return null;

  // Get the real-time interval for the Good button
  const goodButtonInterval = getGoodButtonInterval();
  const audioUrl = getAudioUrl();

  const modalContent = (
    <div className={`space-y-4 ${isMobile ? 'space-y-3' : 'space-y-6'}`}>
      {/* Prompt with Text to Translate */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <CardHeader className={isMobile ? 'pb-2' : 'pb-3'}>
          <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} text-primary`}>
            {getPromptText()}
          </CardTitle>
        </CardHeader>
        <CardContent className={`space-y-${isMobile ? '3' : '4'}`}>
          <div className="p-4 bg-background/80 backdrop-blur-sm rounded-lg border-2 border-primary/20 shadow-inner">
            <div className={`absolute top-2 right-2 ${isMobile ? 'text-xs' : 'text-xs'} font-medium px-2 py-1 bg-primary/10 text-primary rounded-full`}>
              {reviewType === 'forward' ? exercise.target_language : exercise.support_language}
            </div>
            <p className={`${isMobile ? 'text-lg' : 'text-xl'} font-medium text-center leading-relaxed pt-2`}>
              {getSourceText()}
            </p>
          </div>
          
          {/* Audio Player */}
          {audioUrl && (
            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-2 p-3 bg-background/60 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-primary" />
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-primary`}>
                    Listen Again
                  </span>
                </div>
                <AudioPlayer audioUrl={audioUrl} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Input */}
      <Card>
        <CardHeader className={isMobile ? 'pb-2' : ''}>
          <CardTitle className={isMobile ? 'text-base' : 'text-lg'}>
            Your Translation
          </CardTitle>
        </CardHeader>
        <CardContent className={`space-y-3 ${isMobile ? 'space-y-2' : 'space-y-4'}`}>
          <Textarea
            value={userRecall}
            onChange={(e) => {
              setUserRecall(e.target.value);
              setTextComparison(null);
            }}
            placeholder="Enter your translation..."
            rows={isMobile ? 2 : 3}
            disabled={showAnswer}
            className={isMobile ? 'text-base' : ''}
          />
          
          {!showAnswer && (
            <Button 
              onClick={handleShowAnswer}
              disabled={!userRecall.trim()}
              className="w-full"
              size={isMobile ? "default" : "default"}
            >
              Show Answer
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Answer Comparison */}
      {showAnswer && (
        <Card>
          <CardHeader className={isMobile ? 'pb-2' : ''}>
            <CardTitle className={isMobile ? 'text-base' : 'text-lg'}>
              Compare Your Answer
            </CardTitle>
          </CardHeader>
          <CardContent className={`space-y-3 ${isMobile ? 'space-y-2' : 'space-y-4'}`}>
            <div className={`grid gap-3 ${
              isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 gap-4'
            }`}>
              <div className={`p-3 border rounded-md ${isMobile ? 'p-2' : 'p-4'}`}>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">Your Translation:</p>
                <p className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{userRecall}</p>
              </div>
              <div className={`p-3 border rounded-md bg-muted ${isMobile ? 'p-2' : 'p-4'}`}>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">Expected Answer:</p>
                <p className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{getExpectedAnswer()}</p>
              </div>
            </div>

            {/* Text Comparison Analysis */}
            {textComparison && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className={isMobile ? 'pb-1' : 'pb-2'}>
                  <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-sm' : 'text-sm'} text-blue-800`}>
                    <CheckCircle className="h-4 w-4" />
                    Accuracy: {textComparison.accuracy}%
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderWordFeedback(textComparison)}
                </CardContent>
              </Card>
            )}

            <div className={`text-center space-y-3 ${isMobile ? 'space-y-2' : 'space-y-4'}`}>
              <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
                How did you do?
              </p>
              <div className={`flex gap-3 justify-center ${
                isMobile ? 'flex-col gap-2' : 'gap-4'
              }`}>
                <Button
                  onClick={() => handleMarkResult(false)}
                  disabled={isLoading}
                  variant="destructive"
                  className={`flex items-center gap-2 ${
                    isMobile ? 'w-full justify-center' : ''
                  }`}
                  size={isMobile ? "default" : "default"}
                >
                  <XCircle className="h-4 w-4" />
                  Again (30s - resets progress)
                </Button>
                <Button
                  onClick={() => handleMarkResult(true)}
                  disabled={isLoading}
                  className={`flex items-center gap-2 ${
                    isMobile ? 'w-full justify-center' : ''
                  }`}
                  size={isMobile ? "default" : "default"}
                >
                  <CheckCircle className="h-4 w-4" />
                  Good ({formatInterval(goodButtonInterval)})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Mobile: Use Sheet, Desktop: Use Dialog
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[95vh] flex flex-col overflow-hidden">
          <SheetHeader className="flex-shrink-0 pb-2">
            <SheetTitle className="flex items-center gap-2 text-base">
              <ArrowLeft className="h-4 w-4" />
              {reviewType === 'forward' ? 'Forward' : 'Backward'} Review (Round {currentRound})
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-1">
            {modalContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use Dialog
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${
        isMobile 
          ? 'max-w-[95vw] max-h-[90vh] w-full h-full m-2' 
          : 'max-w-3xl max-h-[80vh]'
      } overflow-y-auto`}>
        <DialogHeader className={isMobile ? 'pb-2' : ''}>
          <DialogTitle className={`flex items-center gap-2 ${
            isMobile ? 'text-base' : 'text-lg'
          }`}>
            <ArrowLeft className="h-4 w-4" />
            {reviewType === 'forward' ? 'Forward' : 'Backward'} Review (Round {currentRound})
          </DialogTitle>
        </DialogHeader>
        {modalContent}
      </DialogContent>
    </Dialog>
  );
};
