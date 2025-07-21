
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Volume2, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';

interface TranslationExerciseProps {
  exercise: SentenceMiningExercise;
  userResponse: string;
  showResult: boolean;
  isCorrect: boolean;
  loading: boolean;
  onPlayAudio?: () => void;
  audioLoading?: boolean;
  onResponseChange: (response: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  showTranslation: boolean;
  onToggleTranslation: () => void;
}

export const TranslationExercise: React.FC<TranslationExerciseProps> = ({
  exercise,
  userResponse,
  showResult,
  isCorrect,
  loading,
  onPlayAudio,
  audioLoading = false,
  onResponseChange,
  onSubmit,
  onNext,
  showTranslation,
  onToggleTranslation
}) => {
  const [localResponse, setLocalResponse] = useState('');

  const handleInputChange = (value: string) => {
    setLocalResponse(value);
    onResponseChange(value);
  };

  const handleSubmit = () => {
    if (localResponse.trim()) {
      onSubmit();
    }
  };

  // Reset response when exercise changes
  useEffect(() => {
    setLocalResponse('');
    onResponseChange('');
  }, [exercise.id, onResponseChange]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-lg">Translation Exercise</CardTitle>
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
          {/* Instructions */}
          <div className="text-center">
            <p className="text-base font-medium mb-4">
              Translate the following sentence to English:
            </p>
          </div>

          {/* Original Sentence Display */}
          <div className="p-6 md:p-8 bg-muted rounded-lg">
            <p className="text-lg md:text-xl font-medium text-center leading-relaxed">
              {exercise.sentence}
            </p>
          </div>

          {/* Target Words Hint */}
          {exercise.targetWords && exercise.targetWords.length > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Focus on these words:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {exercise.targetWords.map((word, index) => (
                      <Badge key={index} variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {word}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Translation Input */}
          {!showResult && (
            <div className="space-y-4">
              <div>
                <label htmlFor="translation" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Your English translation:
                </label>
                <Textarea
                  id="translation"
                  value={localResponse}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Type your translation here..."
                  className="min-h-[100px] text-base"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Show Translation Toggle */}
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleTranslation}
              className="transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              {showTranslation ? 'Hide' : 'Show'} Expected Translation
            </Button>
          </div>

          {/* Expected Translation Display */}
          {showTranslation && exercise.translation && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                Expected Translation:
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {exercise.translation}
              </p>
            </div>
          )}

          {/* Explanation Display (when result is shown) */}
          {showResult && exercise.explanation && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                Explanation:
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {exercise.explanation}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            {!showResult ? (
              <Button
                onClick={handleSubmit}
                disabled={!localResponse.trim() || loading}
                size="lg"
                className="px-8 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                {loading ? 'Checking...' : 'Submit Translation'}
              </Button>
            ) : (
              <div className="text-center space-y-4">
                <div className={`flex items-center justify-center gap-2 text-lg font-semibold ${
                  isCorrect ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isCorrect ? (
                    <>
                      <CheckCircle className="h-6 w-6" />
                      Excellent!
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6" />
                      Good attempt!
                    </>
                  )}
                </div>
                
                {/* Show user's translation vs expected */}
                {!isCorrect && (
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                        Your translation:
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {localResponse}
                      </p>
                    </div>
                    
                    {exercise.translation && (
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                          Expected translation:
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {exercise.translation}
                        </p>
                      </div>
                    )}
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
