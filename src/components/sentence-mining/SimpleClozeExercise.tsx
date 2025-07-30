
import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Lightbulb, Loader2, Zap } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';
import { ClozeAudioPlayer } from './ClozeAudioPlayer';

interface SimpleClozeExerciseProps {
  exercise: SentenceMiningExercise;
  userResponse: string;
  showResult: boolean;
  isCorrect: boolean;
  loading: boolean;
  onResponseChange: (response: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  showTranslation: boolean;
  onToggleTranslation: () => void;
}

export const SimpleClozeExercise: React.FC<SimpleClozeExerciseProps> = ({
  exercise,
  userResponse,
  showResult,
  isCorrect,
  loading,
  onResponseChange,
  onSubmit,
  onNext,
  showTranslation,
  onToggleTranslation
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onResponseChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showResult && userResponse.trim() && !loading) {
      e.preventDefault();
      onSubmit();
    }
    if (e.key === 'Enter' && showResult) {
      e.preventDefault();
      onNext();
    }
  };

  // Add global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to submit answer
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!showResult && userResponse.trim() && !loading) {
          onSubmit();
        } else if (showResult) {
          onNext();
        }
      }
      
      // Space to toggle translation (when not focused on input)
      if (e.key === ' ' && e.target !== document.querySelector('input[type="text"]')) {
        e.preventDefault();
        onToggleTranslation();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showResult, userResponse, loading, onSubmit, onNext, onToggleTranslation]);

  const renderClozeSentence = () => {
    if (!showResult) {
      return exercise.clozeSentence;
    }
    
    const filledSentence = exercise.clozeSentence.replace('___', userResponse || '___');
    const parts = filledSentence.split(userResponse || '___');
    
    if (parts.length === 2 && userResponse) {
      return (
        <>
          {parts[0]}
          <span className={`px-2 py-1 rounded font-medium ${
            isCorrect 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {userResponse}
          </span>
          {parts[1]}
        </>
      );
    }
    
    return filledSentence;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-none shadow-lg">
        <CardContent className="p-8 space-y-8">
          {/* Header with audio button and loading indicator */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground capitalize">
                {exercise.difficulty}
              </div>
              {loading && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              )}
            </div>
            <ClozeAudioPlayer 
              text={exercise.sentence}
            />
          </div>

          {/* Main sentence display */}
          <div className="text-center">
            <div className="text-xl font-medium leading-relaxed mb-6">
              {renderClozeSentence()}
            </div>
          </div>

          {/* Input field with enhanced keyboard hints */}
          {!showResult && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Input
                  type="text"
                  value={userResponse}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your answer..."
                  className="max-w-xs text-center text-lg py-3"
                  disabled={loading}
                  autoFocus
                />
              </div>
              
              {/* Keyboard shortcuts hint */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd> or{' '}
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Enter</kbd> to check answer
                </p>
              </div>
            </div>
          )}

          {/* Hints */}
          {exercise.hints && exercise.hints.length > 0 && (
            <div className="flex justify-center">
              <div className="max-w-md p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {exercise.hints[0]}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Translation toggle with keyboard hint */}
          {exercise.translation && (
            <div className="text-center space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleTranslation}
                className="text-muted-foreground hover:text-foreground"
              >
                {showTranslation ? 'Hide' : 'Show'} translation
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Space</kbd> to toggle
              </p>
              
              {showTranslation && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {exercise.translation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons with enhanced loading states */}
          <div className="flex justify-center">
            {!showResult ? (
              <Button
                onClick={onSubmit}
                disabled={!userResponse.trim() || loading}
                size="lg"
                className="px-12 relative"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Check Answer
                  </>
                )}
              </Button>
            ) : (
              <div className="text-center space-y-6">
                <div className={`flex items-center justify-center gap-2 text-lg font-medium ${
                  isCorrect ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isCorrect ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Correct!
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5" />
                      The answer was: {exercise.targetWord}
                    </>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Button
                    onClick={onNext}
                    size="lg"
                    className="px-12"
                  >
                    Next Exercise
                  </Button>
                  
                  <p className="text-xs text-muted-foreground">
                    Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd> or{' '}
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Enter</kbd> to continue
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
