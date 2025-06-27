
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Volume2, CheckCircle, XCircle, Eye, ArrowRight } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';

interface TranslationExerciseProps {
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

export const TranslationExercise: React.FC<TranslationExerciseProps> = ({
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
  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Translate into English:</CardTitle>
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
          <div className="space-y-4">
            {/* Original sentence */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xl font-medium text-center">
                "{exercise.sentence}"
              </p>
            </div>
            
            {/* Translation hint */}
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleTranslation}
                className="flex items-center gap-2 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                <Eye className="h-4 w-4" />
                {showTranslation ? 'Hide hint' : 'Show hint'}
              </Button>
              
              {showTranslation && exercise.translation && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-sm animate-fade-in">
                  <p className="text-blue-700 dark:text-blue-300">
                    Expected: {exercise.translation}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Response Area */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Textarea
              value={userResponse}
              onChange={(e) => onResponseChange(e.target.value)}
              placeholder="Type your English translation here..."
              disabled={showResult || loading}
              className={`min-h-20 text-lg transition-all duration-200 ${
                showResult
                  ? isCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                    : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                  : ''
              }`}
            />
            
            <div className="flex justify-end">
              {!showResult ? (
                <Button
                  onClick={onSubmit}
                  disabled={!userResponse.trim() || loading}
                  className="px-8 transition-transform duration-200 hover:scale-105 active:scale-95"
                >
                  {loading ? 'Checking...' : 'Submit Translation'}
                </Button>
              ) : (
                <Button
                  onClick={onNext}
                  className="px-8 flex items-center gap-2 transition-transform duration-200 hover:scale-105 active:scale-95"
                >
                  Continue <ArrowRight className="h-4 w-4" />
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
                    {isCorrect ? 'Great translation!' : 'Try again next time'}
                  </Badge>
                </div>

                {exercise.explanation && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Grammar Note:
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      {exercise.explanation}
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
