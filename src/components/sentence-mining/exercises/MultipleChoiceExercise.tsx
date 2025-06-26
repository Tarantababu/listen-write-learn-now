
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, CheckCircle, XCircle, ArrowRight, Eye } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';

interface MultipleChoiceExerciseProps {
  exercise: SentenceMiningExercise;
  userResponse: string;
  onResponseChange: (response: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  showResult: boolean;
  isCorrect: boolean;
  loading: boolean;
  onPlayAudio?: () => void;
  audioLoading?: boolean;
  showTranslation: boolean;
  onToggleTranslation: () => void;
}

export const MultipleChoiceExercise: React.FC<MultipleChoiceExerciseProps> = ({
  exercise,
  userResponse,
  onResponseChange,
  onSubmit,
  onNext,
  showResult,
  isCorrect,
  loading,
  onPlayAudio,
  audioLoading = false,
  showTranslation,
  onToggleTranslation,
}) => {
  const renderSentenceWithBlank = (sentence: string, targetWord: string) => {
    const parts = sentence.split(new RegExp(`\\b${targetWord}\\b`, 'gi'));
    const result = [];
    
    parts.forEach((part, index) => {
      result.push(part);
      if (index < parts.length - 1) {
        result.push(
          <span key={index} className="inline-block border-2 border-primary border-dashed min-w-[120px] mx-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/20 rounded text-center">
            {showResult && userResponse ? (
              <span className={isCorrect ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {userResponse}
              </span>
            ) : (
              <span className="text-muted-foreground font-medium">
                ?
              </span>
            )}
          </span>
        );
      }
    });
    
    return result;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Find the missing word</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {exercise.difficulty}
              </Badge>
              {onPlayAudio && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPlayAudio}
                  disabled={audioLoading}
                  className="flex items-center gap-1"
                >
                  <Volume2 className="h-4 w-4" />
                  {audioLoading ? 'Loading...' : 'Listen'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Sentence with blank */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xl leading-relaxed text-center">
                {renderSentenceWithBlank(exercise.sentence, exercise.targetWord)}
              </p>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              Find the missing word. Click any words you don't know.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Multiple Choice Options */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {exercise.multipleChoiceOptions?.map((option, index) => (
                <Button
                  key={index}
                  variant={userResponse === option ? 'default' : 'outline'}
                  className={`p-4 h-auto text-lg ${
                    showResult && option === exercise.correctAnswer
                      ? 'bg-green-100 border-green-500 text-green-700 hover:bg-green-100'
                      : showResult && userResponse === option && !isCorrect
                      ? 'bg-red-100 border-red-500 text-red-700 hover:bg-red-100'
                      : ''
                  }`}
                  onClick={() => !showResult && onResponseChange(option)}
                  disabled={showResult || loading}
                >
                  {option}
                </Button>
              ))}
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleTranslation}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {showTranslation ? 'Hide Hint' : 'Hint'}
                </Button>
                <Button variant="outline" size="sm">
                  Translate
                </Button>
                <Button variant="outline" size="sm">
                  Reveal
                </Button>
              </div>
              
              {!showResult ? (
                <Button
                  onClick={onSubmit}
                  disabled={!userResponse || loading}
                  className="px-8"
                >
                  {loading ? 'Checking...' : 'Submit'}
                </Button>
              ) : (
                <Button
                  onClick={onNext}
                  className="px-8 flex items-center gap-2"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            {showResult && (
              <div className="space-y-3">
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

                {exercise.explanation && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Explanation:
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      {exercise.explanation}
                    </p>
                  </div>
                )}

                {showTranslation && exercise.translation && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      Translation:
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                      {exercise.translation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
