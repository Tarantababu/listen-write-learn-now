
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const [progress, setProgress] = useState(0);

  // Animate progress bar while loading
  useEffect(() => {
    if (loading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90; // Stop at 90% until actual response
          return prev + Math.random() * 15;
        });
      }, 200);

      return () => clearInterval(interval);
    } else {
      // Complete the progress bar when done
      if (progress > 0) {
        setProgress(100);
        setTimeout(() => setProgress(0), 500);
      }
    }
  }, [loading, progress]);

  // Mobile layout
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 z-20">
        <div className="space-y-4">
          {!showResult ? (
            <div className="space-y-2">
              <Button
                onClick={onSubmit}
                disabled={loading}
                className="w-full py-3 text-base relative overflow-hidden"
                size="lg"
              >
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary">
                    <div className="flex items-center gap-2 text-primary-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Checking answer...</span>
                    </div>
                  </div>
                )}
                {loading ? '' : 'Submit'}
              </Button>
              
              {loading && (
                <div className="space-y-1">
                  <Progress value={progress} className="w-full h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    Analyzing your response...
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3">
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
                  <div className="space-y-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-center">
                      <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                        Correct answer:
                      </p>
                      <p className="text-blue-700 dark:text-blue-300 font-semibold text-sm">
                        {correctAnswer}
                      </p>
                    </div>

                    {explanation && (
                      <div className="p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded">
                        <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">
                          Explanation:
                        </p>
                        <p className="text-amber-700 dark:text-amber-300 text-xs">
                          {explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-xs text-muted-foreground text-center px-2">
                  {isCorrect 
                    ? "Great job! You've mastered this word pattern."
                    : "Don't worry, you'll get it next time. Keep practicing!"
                  }
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={onNext}
                  disabled={loading}
                  className="w-full py-3 text-base relative overflow-hidden"
                  size="lg"
                >
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary">
                      <div className="flex items-center gap-2 text-primary-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading next...</span>
                      </div>
                    </div>
                  )}
                  {loading ? '' : (
                    <>
                      Next <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                {loading && (
                  <div className="space-y-1">
                    <Progress value={progress} className="w-full h-2" />
                    <p className="text-xs text-center text-muted-foreground">
                      Preparing next exercise...
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex justify-center">
            {!showResult ? (
              <div className="flex flex-col items-center gap-3">
                <Button
                  onClick={onSubmit}
                  disabled={loading}
                  className="px-6 py-3 text-base transition-all duration-200 hover:scale-105 active:scale-95 min-w-[140px] relative overflow-hidden"
                >
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary">
                      <div className="flex items-center gap-2 text-primary-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Checking...</span>
                      </div>
                    </div>
                  )}
                  {loading ? '' : 'Submit'}
                </Button>
                
                {loading && (
                  <div className="w-48 space-y-2">
                    <Progress value={progress} className="w-full h-2" />
                    <p className="text-xs text-center text-muted-foreground">
                      Analyzing your response...
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Button
                  onClick={onNext}
                  disabled={loading}
                  className="px-6 py-3 text-base flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 min-w-[120px] relative overflow-hidden"
                >
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary">
                      <div className="flex items-center gap-2 text-primary-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading...</span>
                      </div>
                    </div>
                  )}
                  {loading ? '' : (
                    <>
                      Next <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                {loading && (
                  <div className="w-48 space-y-2">
                    <Progress value={progress} className="w-full h-2" />
                    <p className="text-xs text-center text-muted-foreground">
                      Preparing next exercise...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {showResult && !loading && (
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
