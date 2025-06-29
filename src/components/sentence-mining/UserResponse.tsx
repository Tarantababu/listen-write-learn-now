
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react';

interface UserResponseProps {
  onSubmit: () => void;
  onNext: () => void;
  showResult: boolean;
  isCorrect: boolean;
  correctAnswer: string;
  loading: boolean;
  explanation?: string;
}

export const UserResponse: React.FC<UserResponseProps> = ({
  onSubmit,
  onNext,
  showResult,
  isCorrect,
  correctAnswer,
  loading,
  explanation,
}) => {
  const [buttonState, setButtonState] = useState<'idle' | 'processing'>('idle');

  // Handle button click with proper feedback
  const handleSubmitClick = async () => {
    if (buttonState === 'processing' || loading) return;
    
    setButtonState('processing');
    
    try {
      await onSubmit();
    } catch (error) {
      console.error('Error in submit:', error);
    } finally {
      // Reset button state after a short delay
      setTimeout(() => {
        setButtonState('idle');
      }, 1000);
    }
  };

  const handleNextClick = async () => {
    if (buttonState === 'processing' || loading) return;
    
    setButtonState('processing');
    
    try {
      await onNext();
    } catch (error) {
      console.error('Error in next:', error);
    } finally {
      // Reset button state after a short delay
      setTimeout(() => {
        setButtonState('idle');
      }, 500);
    }
  };

  // Reset button state when showResult changes
  useEffect(() => {
    if (showResult) {
      setButtonState('idle');
    }
  }, [showResult]);

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex justify-center">
            {!showResult ? (
              <Button
                onClick={handleSubmitClick}
                disabled={loading || buttonState === 'processing'}
                className="px-6 py-3 text-base transition-all duration-200 hover:scale-105 active:scale-95 min-w-[140px]"
              >
                {buttonState === 'processing' && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {buttonState === 'processing' || loading ? 'Checking...' : 'Submit'}
              </Button>
            ) : (
              <Button
                onClick={handleNextClick}
                disabled={loading || buttonState === 'processing'}
                className="px-6 py-3 text-base flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 min-w-[120px]"
              >
                {buttonState === 'processing' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Next <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>

          {showResult && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-center gap-2">
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <Badge variant={isCorrect ? 'default' : 'destructive'}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </Badge>
              </div>

              {!isCorrect && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1 text-center">
                      Correct answer:
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 font-semibold text-center">
                      {correctAnswer}
                    </p>
                  </div>

                  {explanation && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                        Explanation:
                      </p>
                      <p className="text-amber-700 dark:text-amber-300 text-sm">
                        {explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="text-sm text-muted-foreground text-center px-4">
                {isCorrect 
                  ? "Great job! You've mastered this word pattern."
                  : "Don't worry, you'll get it next time. Keep practicing!"
                }
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
