
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
  const [buttonDisabled, setButtonDisabled] = React.useState(false);

  const renderClickableText = () => {
    const words = exercise.sentence.split(/(\s+)/);
    
    return words.map((token, index) => {
      const cleanToken = token.replace(/[.,!?;:]/g, '').toLowerCase();
      const isSelected = selectedWords.includes(cleanToken);
      
      if (token.trim() === '') {
        return <span key={index}>{token}</span>;
      }
      
      // Make every word clickable (not just whitespace)
      if (token.trim().length > 0) {
        return (
          <span
            key={index}
            className={`inline-block cursor-pointer px-1 py-0.5 rounded transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm md:text-base ${
              isSelected
                ? 'bg-blue-500 text-white shadow-md'
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

  const handleContinueClick = () => {
    if (buttonDisabled || loading) return;
    
    setButtonDisabled(true);
    
    try {
      if (showResult) {
        onNext();
      } else {
        onSubmit();
      }
    } catch (error) {
      console.error('Error in continue:', error);
    } finally {
      // Re-enable button after a short delay
      setTimeout(() => {
        setButtonDisabled(false);
      }, 1000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg">Mark Unknown Words</CardTitle>
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
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="pt-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              Read the sentence and tap any word you don't understand. This marks them for later repetition. Then press continue.
            </p>
          </div>
          
          {/* Clickable sentence */}
          <div className="p-4 md:p-6 bg-muted rounded-lg">
            <p className="text-lg md:text-xl leading-relaxed">
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
                    <div key={word} className="bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-lg transform transition-all duration-200 hover:scale-105">
                      <div className="font-medium text-sm md:text-base">{word}</div>
                      {wordInfo && (
                        <div className="text-xs md:text-sm text-muted-foreground">
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
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-2 w-full md:w-auto">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onToggleTranslation}
                className="transition-transform duration-200 hover:scale-105 active:scale-95 flex-1 md:flex-none"
              >
                {showTranslation ? 'Hide Translation' : 'Translation'}
              </Button>
            </div>
            
            <Button
              onClick={handleContinueClick}
              className="px-6 md:px-8 py-3 flex items-center gap-2 transition-transform duration-200 hover:scale-105 active:scale-95 w-full md:w-auto text-base"
              disabled={loading || buttonDisabled}
            >
              {loading ? 'Processing...' : 'Continue'} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
