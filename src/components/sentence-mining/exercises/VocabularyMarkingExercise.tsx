
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SentenceMiningExercise } from '@/types/sentence-mining';
import { CheckCircle, XCircle, Volume2, SkipForward } from 'lucide-react';

interface VocabularyMarkingExerciseProps {
  exercise: SentenceMiningExercise;
  selectedWords: string[];
  showResult: boolean;
  isCorrect: boolean;
  loading: boolean;
  onWordSelect: (word: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
  onNext: () => void;
}

export const VocabularyMarkingExercise: React.FC<VocabularyMarkingExerciseProps> = ({
  exercise,
  selectedWords,
  showResult,
  isCorrect,
  loading,
  onWordSelect,
  onSubmit,
  onSkip,
  onNext
}) => {
  const words = exercise.sentence.split(' ');
  const targetWords = exercise.targetWords || [];

  const getWordStatus = (word: string) => {
    const cleanWord = word.replace(/[.,!?;:]/g, '').toLowerCase();
    
    if (!showResult) {
      return selectedWords.includes(word) ? 'selected' : 'default';
    }
    
    const isTarget = targetWords.some(target => target.toLowerCase() === cleanWord);
    const isSelected = selectedWords.includes(word);
    
    if (isTarget && isSelected) return 'correct';
    if (isTarget && !isSelected) return 'missed';
    if (!isTarget && isSelected) return 'wrong';
    return 'default';
  };

  const getWordClassName = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded cursor-pointer transition-colors';
    
    switch (status) {
      case 'selected':
        return `${baseClasses} bg-blue-100 text-blue-800 border-2 border-blue-300`;
      case 'correct':
        return `${baseClasses} bg-green-100 text-green-800 border-2 border-green-300`;
      case 'missed':
        return `${baseClasses} bg-red-100 text-red-800 border-2 border-red-300`;
      case 'wrong':
        return `${baseClasses} bg-yellow-100 text-yellow-800 border-2 border-yellow-300`;
      default:
        return `${baseClasses} hover:bg-gray-100 border-2 border-transparent`;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Mark Unknown Words
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Click on words you don't know or find difficult
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Sentence Display */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-2 text-lg leading-relaxed">
            {words.map((word, index) => (
              <span
                key={index}
                className={getWordClassName(getWordStatus(word))}
                onClick={() => !showResult && onWordSelect(word)}
              >
                {word}
              </span>
            ))}
          </div>
        </div>

        {/* Translation */}
        {exercise.translation && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 font-medium mb-1">Translation:</p>
            <p className="text-blue-800">{exercise.translation}</p>
          </div>
        )}

        {/* Result Display */}
        {showResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {isCorrect ? 'Well done!' : 'Review the correct answers'}
              </span>
            </div>

            {/* Target Words */}
            {targetWords.length > 0 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700 font-medium mb-2">Target words:</p>
                <div className="flex flex-wrap gap-2">
                  {targetWords.map((word, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!showResult ? (
            <>
              <Button
                onClick={onSubmit}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Submitting...' : 'Submit Selection'}
              </Button>
              <Button
                onClick={onSkip}
                variant="outline"
                disabled={loading}
                className="flex items-center gap-2"
              >
                <SkipForward className="h-4 w-4" />
                Skip Exercise
              </Button>
            </>
          ) : (
            <Button
              onClick={onNext}
              className="flex-1"
            >
              Next Exercise
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
