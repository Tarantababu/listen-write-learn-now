
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Volume2, CheckCircle, XCircle } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';

interface ClozeExerciseProps {
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

export const ClozeExercise: React.FC<ClozeExerciseProps> = ({
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

  // Get the cloze sentence or create one if not provided
  const clozeSentence = exercise.clozeSentence || generateClozeSentence(exercise.sentence, exercise.targetWords?.[0] || '');
  const targetWord = exercise.targetWords?.[0] || '';

  const handleInputChange = (value: string) => {
    setLocalResponse(value);
    onResponseChange(value);
  };

  const handleSubmit = () => {
    if (localResponse.trim()) {
      onSubmit();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showResult && localResponse.trim()) {
      handleSubmit();
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
          <CardTitle className="text-lg">Complete the Sentence</CardTitle>
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
              Fill in the missing word in the sentence below:
            </p>
          </div>

          {/* Cloze Sentence Display */}
          <div className="p-6 md:p-8 bg-muted rounded-lg">
            <div className="text-lg md:text-xl leading-relaxed text-center">
              {renderClozeSentence(clozeSentence, localResponse, showResult, isCorrect, targetWord)}
            </div>
          </div>

          {/* Input Field */}
          {!showResult && (
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <Input
                  type="text"
                  value={localResponse}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your answer here..."
                  className="text-center text-lg py-3"
                  disabled={loading}
                />
              </div>
            </div>
          )}

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
                disabled={!localResponse.trim() || loading}
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
                
                {!isCorrect && targetWord && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                      Correct answer:
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {targetWord}
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

// Helper function to generate a cloze sentence
function generateClozeSentence(sentence: string, targetWord: string): string {
  if (!targetWord || !sentence) return sentence;
  
  const words = sentence.split(' ');
  const targetIndex = words.findIndex(word => 
    word.toLowerCase().includes(targetWord.toLowerCase())
  );
  
  if (targetIndex !== -1) {
    words[targetIndex] = '___';
  }
  
  return words.join(' ');
}

// Helper function to render the cloze sentence with proper styling
function renderClozeSentence(
  clozeSentence: string, 
  userResponse: string, 
  showResult: boolean, 
  isCorrect: boolean,
  targetWord: string
) {
  if (!showResult) {
    // Before submission, show the blank
    return clozeSentence;
  }
  
  // After submission, show the user's answer with appropriate styling
  const filledSentence = clozeSentence.replace('___', userResponse || '___');
  const parts = filledSentence.split(userResponse || '___');
  
  if (parts.length === 2 && userResponse) {
    return (
      <>
        {parts[0]}
        <span className={`px-2 py-1 rounded font-semibold ${
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
}
