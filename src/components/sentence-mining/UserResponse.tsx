
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface UserResponseProps {
  userResponse: string;
  onResponseChange: (response: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  showResult: boolean;
  isCorrect: boolean;
  correctAnswer: string;
  loading: boolean;
}

export const UserResponse: React.FC<UserResponseProps> = ({
  userResponse,
  onResponseChange,
  onSubmit,
  onNext,
  showResult,
  isCorrect,
  correctAnswer,
  loading,
}) => {
  const [inputFocused, setInputFocused] = useState(false);

  useEffect(() => {
    if (!showResult) {
      setInputFocused(true);
    }
  }, [showResult]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showResult && userResponse.trim()) {
      onSubmit();
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={userResponse}
              onChange={(e) => onResponseChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type the missing word here..."
              disabled={showResult || loading}
              className={`flex-1 text-lg transition-all duration-200 ${
                showResult
                  ? isCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                    : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                  : ''
              }`}
              autoFocus={inputFocused}
            />
            
            {!showResult ? (
              <Button
                onClick={onSubmit}
                disabled={!userResponse.trim() || loading}
                className="px-6 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                {loading ? 'Checking...' : 'Submit'}
              </Button>
            ) : (
              <Button
                onClick={onNext}
                className="px-6 flex items-center gap-2 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {showResult && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2">
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
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Correct answer:
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 font-semibold">
                    {correctAnswer}
                  </p>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
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
