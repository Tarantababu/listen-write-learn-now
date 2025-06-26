
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, ArrowRight } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';

interface VocabularyMarkingExerciseProps {
  exercise: SentenceMiningExercise;
  selectedWords: string[];
  onWordSelect: (word: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  showResult: boolean;
  loading: boolean;
  onPlayAudio?: () => void;
  audioLoading?: boolean;
  showTranslation: boolean;
  onToggleTranslation: () => void;
}

export const VocabularyMarkingExercise: React.FC<VocabularyMarkingExerciseProps> = ({
  exercise,
  selectedWords,
  onWordSelect,
  onSubmit,
  onNext,
  showResult,
  loading,
  onPlayAudio,
  audioLoading = false,
  showTranslation,
  onToggleTranslation,
}) => {
  const renderClickableText = () => {
    const words = exercise.sentence.split(/(\s+)/);
    
    return words.map((token, index) => {
      const cleanToken = token.replace(/[.,!?;:]/g, '').toLowerCase();
      const isClickable = exercise.clickableWords?.some(cw => cw.word.toLowerCase() === cleanToken);
      const isSelected = selectedWords.includes(cleanToken);
      
      if (token.trim() === '') {
        return <span key={index}>{token}</span>;
      }
      
      if (isClickable) {
        return (
          <span
            key={index}
            className={`inline-block cursor-pointer px-1 py-0.5 rounded transition-colors ${
              isSelected
                ? 'bg-blue-500 text-white'
                : 'hover:bg-blue-100 dark:hover:bg-blue-900/30'
            }`}
            onClick={() => onWordSelect(cleanToken)}
          >
            {token}
          </span>
        );
      }
      
      return <span key={index}>{token}</span>;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Mark Unknown Words</CardTitle>
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
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="pt-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              Read the sentence and click any word you don't understand. This marks them for later repetition. Then press continue.
            </p>
          </div>
          
          {/* Clickable sentence */}
          <div className="p-6 bg-muted rounded-lg">
            <p className="text-xl leading-relaxed">
              {renderClickableText()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Selected words feedback */}
      {selectedWords.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <h3 className="font-medium">Words you've marked for review:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedWords.map(word => {
                  const wordInfo = exercise.clickableWords?.find(cw => cw.word.toLowerCase() === word);
                  return (
                    <div key={word} className="bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-lg">
                      <div className="font-medium">{word}</div>
                      {wordInfo && (
                        <div className="text-sm text-muted-foreground">
                          {wordInfo.definition}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Translation
              </Button>
            </div>
            
            <Button
              onClick={showResult ? onNext : onSubmit}
              className="px-8 flex items-center gap-2"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Continue'} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
