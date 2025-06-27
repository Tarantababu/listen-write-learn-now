
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface UserResponseProps {
  onSubmit: () => void;
  onNext: () => void;
  showResult: boolean;
  isCorrect: boolean;
  correctAnswer: string;
  loading: boolean;
}

export const UserResponse: React.FC<UserResponseProps> = ({
  onSubmit,
  onNext,
  showResult,
  isCorrect,
  correctAnswer,
  loading,
}) => {
  const [buttonDisabled, setButtonDisabled] = useState(false);

  // Prevent rapid clicking that might cause errors
  const handleSubmitClick = () => {
    if (buttonDisabled || loading) return;
    
    setButtonDisabled(true);
    
    try {
      onSubmit();
    } catch (error) {
      console.error('Error in submit:', error);
    } finally {
      // Re-enable button after a short delay
      setTimeout(() => {
        setButtonDisabled(false);
      }, 1000);
    }
  };

  const handleNextClick = () => {
    if (buttonDisabled || loading) return;
    
    setButtonDisabled(true);
    
    try {
      onNext();
    } catch (error) {
      console.error('Error in next:', error);
    } finally {
      // Re-enable button after a short delay
      setTimeout(() => {
        setButtonDisabled(false);
      }, 1000);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex justify-center">
            {!showResult ? (
              <Button
                onClick={handleSubmitClick}
                disabled={loading || buttonDisabled}
                className="px-6 py-3 text-base transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                {loading ? 'Checking...' : 'Submit'}
              </Button>
            ) : (
              <Button
                onClick={handleNextClick}
                disabled={loading || buttonDisabled}
                className="px-6 py-3 text-base flex items-center gap-2 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                Next <ArrowRight className="h-4 w-4" />
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
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1 text-center">
                    Correct answer:
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 font-semibold text-center">
                    {correctAnswer}
                  </p>
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
