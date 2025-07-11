
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, CheckCircle, XCircle } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';

interface MultipleChoiceExerciseProps {
  exercise: SentenceMiningExercise;
  showResult: boolean;
  isCorrect: boolean;
  loading: boolean;
  onPlayAudio?: () => void;
  audioLoading?: boolean;
  onSubmit: () => void;
  onNext: () => void;
  showTranslation: boolean;
  onToggleTranslation: () => void;
}

export const MultipleChoiceExercise: React.FC<MultipleChoiceExerciseProps> = ({
  exercise,
  showResult,
  isCorrect,
  loading,
  onPlayAudio,
  audioLoading = false,
  onSubmit,
  onNext,
  showTranslation,
  onToggleTranslation
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('');

  // Get the first target word for this exercise - fixed to handle array properly
  const targetWord = Array.isArray(exercise.targetWords) && exercise.targetWords.length > 0 
    ? exercise.targetWords[0] 
    : 'the target word';

  // Fallback multiple choice options if not provided
  const multipleChoiceOptions = exercise.multipleChoiceOptions || [
    exercise.correctAnswer || 'Option 1',
    'Option 2',
    'Option 3',
    'Option 4'
  ];

  const handleOptionSelect = (option: string) => {
    if (showResult) return;
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (selectedOption) {
      onSubmit();
    }
  };

  // Reset selection when exercise changes
  useEffect(() => {
    setSelectedOption('');
  }, [exercise.id]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-lg">Multiple Choice</CardTitle>
          <div className="flex items-center gap-2 justify-start md:justify-end">
            <Badge variant="outline" className="capitalize">
              {exercise.difficulty}
            </Badge>
            {onPlayAudio && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPlayAudio}
                disabled={audioLoading}
                className="flex items-center gap-1 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                <Volume2 className="h-4 w-4" />
                {audioLoading ? 'Loading...' : 'Listen'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Sentence Display */}
          <div className="p-4 md:p-6 bg-muted rounded-lg">
            <p className="text-lg md:text-xl leading-relaxed text-center">
              {exercise.sentence}
            </p>
          </div>

          {/* Question - Fixed to show actual target word */}
          <div className="text-center">
            <p className="text-base font-medium mb-4">
              What does "<strong>{targetWord}</strong>" mean?
            </p>
          </div>

          {/* Multiple Choice Options */}
          <div className="space-y-3">
            {multipleChoiceOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(option)}
                disabled={showResult}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                  selectedOption === option
                    ? showResult
                      ? option === exercise.correctAnswer
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                        : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                      : 'border-primary bg-primary/5'
                    : showResult && option === exercise.correctAnswer
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                } ${showResult ? 'cursor-default' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">{option}</span>
                  {showResult && (
                    <div className="flex items-center gap-2">
                      {option === exercise.correctAnswer ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : selectedOption === option ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : null}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Translation Toggle */}
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleTranslation}
              className="transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              {showTranslation ? 'Hide' : 'Show'} Translation
            </Button>
          </div>

          {/* Translation Display */}
          {showTranslation && exercise.translation && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Translation:
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {exercise.translation}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            {!showResult ? (
              <Button
                onClick={handleSubmit}
                disabled={!selectedOption || loading}
                size="lg"
                className="px-8 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                {loading ? 'Checking...' : 'Submit Answer'}
              </Button>
            ) : (
              <div className="text-center space-y-4">
                <div className={`flex items-center justify-center gap-2 text-lg font-semibold ${
                  isCorrect ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isCorrect ? (
                    <>
                      <CheckCircle className="h-6 w-6" />
                      Correct!
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6" />
                      Incorrect
                    </>
                  )}
                </div>
                
                {exercise.explanation && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                      Explanation:
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {exercise.explanation}
                    </p>
                  </div>
                )}
                
                <Button
                  onClick={onNext}
                  size="lg"
                  className="px-8 transition-transform duration-200 hover:scale-105 active:scale-95"
                >
                  Next Exercise
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
