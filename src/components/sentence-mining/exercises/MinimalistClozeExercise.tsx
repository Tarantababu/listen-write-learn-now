
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, ArrowRight, RotateCcw, Lightbulb } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';
import { EnhancedWordFrequencyService } from '@/services/enhancedWordFrequencyService';
import { cn } from '@/lib/utils';

interface MinimalistClozeExerciseProps {
  exercise: SentenceMiningExercise;
  userResponse: string;
  showResult: boolean;
  isCorrect: boolean;
  loading: boolean;
  onResponseChange: (response: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  onSkip: () => void;
  showTranslation: boolean;
  onToggleTranslation: () => void;
  language?: string;
}

export const MinimalistClozeExercise: React.FC<MinimalistClozeExerciseProps> = ({
  exercise,
  userResponse,
  showResult,
  isCorrect,
  loading,
  onResponseChange,
  onSubmit,
  onNext,
  onSkip,
  showTranslation,
  onToggleTranslation,
  language = 'english'
}) => {
  const [focusInput, setFocusInput] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [englishMeaning, setEnglishMeaning] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => setFocusInput(true), 100);
    return () => clearTimeout(timer);
  }, [exercise.id]);

  useEffect(() => {
    // Get English meaning for the target word
    if (exercise.targetWord && language) {
      const meaning = EnhancedWordFrequencyService.getWordMeaning(language, exercise.targetWord);
      setEnglishMeaning(meaning);
    }
  }, [exercise.targetWord, language]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showResult) {
      onSubmit();
    } else if (e.key === 'Enter' && showResult) {
      onNext();
    } else if (e.key === ' ' && e.ctrlKey) {
      e.preventDefault();
      onToggleTranslation();
    } else if (e.key === 'h' && e.ctrlKey) {
      e.preventDefault();
      setShowHint(!showHint);
    }
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Main Exercise Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/10">
        <div className="p-8 space-y-8">
          {/* Sentence with Blank */}
          <div className="text-center space-y-6">
            <div className="text-xl md:text-2xl leading-relaxed text-foreground font-medium">
              {exercise.clozeSentence.split('___').map((part, index, array) => (
                <span key={index}>
                  {part}
                  {index < array.length - 1 && (
                    <span className="inline-block mx-2">
                      {showResult ? (
                        <span className={cn(
                          "px-3 py-1 rounded-lg font-semibold",
                          isCorrect 
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                        )}>
                          {isCorrect ? userResponse : exercise.correctAnswer}
                        </span>
                      ) : (
                        <Input
                          value={userResponse}
                          onChange={(e) => onResponseChange(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="inline-block w-32 text-center border-2 border-dashed border-primary/40 focus:border-primary bg-background/50"
                          placeholder="?"
                          autoFocus={focusInput}
                          disabled={loading}
                        />
                      )}
                    </span>
                  )}
                </span>
              ))}
            </div>

            {/* English Meaning Hint */}
            {showHint && englishMeaning && !showResult && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Lightbulb className="h-4 w-4" />
                  <span className="text-sm font-medium">English meaning:</span>
                  <span className="text-sm italic">{englishMeaning}</span>
                </div>
              </div>
            )}

            {/* Translation (if enabled) */}
            {showTranslation && exercise.translation && (
              <div className="text-sm text-muted-foreground italic bg-muted/30 p-4 rounded-lg">
                {exercise.translation}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {!showResult ? (
              <>
                <Button
                  onClick={onSubmit}
                  disabled={!userResponse.trim() || loading}
                  className="px-8 py-2 bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Checking...' : 'Check'}
                </Button>
                
                {/* Hint Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleHint}
                  disabled={loading}
                  className={cn(
                    "flex items-center gap-1",
                    showHint && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  )}
                >
                  <Lightbulb className="h-3 w-3" />
                  {showHint ? 'Hide Hint' : 'Hint'}
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={onSkip}
                  disabled={loading}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Skip
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-4 flex-wrap justify-center">
                {/* Result Feedback */}
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <X className="h-5 w-5 text-red-600" />
                  )}
                  <span className={cn(
                    "font-medium",
                    isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                  )}>
                    {isCorrect ? 'Correct!' : `Correct answer: ${exercise.correctAnswer}`}
                  </span>
                </div>
                
                {/* Show meaning after result */}
                {englishMeaning && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" />
                    <span>"{englishMeaning}"</span>
                  </div>
                )}
                
                <Button
                  onClick={onNext}
                  disabled={loading}
                  className="px-6 py-2 bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <RotateCcw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Next <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Minimal Keyboard Hints */}
      <div className="text-center text-xs text-muted-foreground space-y-1">
        <div>Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to check answer</div>
        <div>Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl + H</kbd> for hint • <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl + Space</kbd> for translation</div>
      </div>
    </div>
  );
};
