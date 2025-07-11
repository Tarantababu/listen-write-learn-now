
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, CheckCircle, XCircle, Book } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';

interface VocabularyMarkingExerciseProps {
  exercise: SentenceMiningExercise;
  selectedWords: string[];
  showResult: boolean;
  isCorrect: boolean;
  loading: boolean;
  onPlayAudio?: () => void;
  audioLoading?: boolean;
  onWordSelect: (word: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  showTranslation: boolean;
  onToggleTranslation: () => void;
}

export const VocabularyMarkingExercise: React.FC<VocabularyMarkingExerciseProps> = ({
  exercise,
  selectedWords,
  showResult,
  isCorrect,
  loading,
  onPlayAudio,
  audioLoading = false,
  onWordSelect,
  onSubmit,
  onNext,
  showTranslation,
  onToggleTranslation
}) => {
  const [wordDefinitions, setWordDefinitions] = useState<Record<string, string>>({});

  // Mock function to get word definitions - in a real app, this would call an API
  const getWordDefinition = (word: string): string => {
    const mockDefinitions: Record<string, string> = {
      'katze': 'cat - a small domesticated carnivorous mammal',
      'sitzt': 'sits - to be in a position where your body is resting on your bottom',
      'auf': 'on - in a position above and touching something',
      'dem': 'the - definite article (masculine/neuter dative)',
      'stuhl': 'chair - a piece of furniture for one person to sit on',
      'die': 'the - definite article (feminine nominative/accusative)',
      'der': 'the - definite article (masculine nominative)',
      'das': 'the - definite article (neuter nominative/accusative)',
      'ist': 'is - third person singular form of "to be"',
      'ein': 'a/an - indefinite article',
      'eine': 'a/an - indefinite article (feminine)',
      'und': 'and - conjunction connecting words or phrases',
      'oder': 'or - conjunction expressing alternative',
      'aber': 'but - conjunction expressing contrast',
      'nicht': 'not - negation particle',
      'ich': 'I - first person singular pronoun',
      'du': 'you - second person singular pronoun (informal)',
      'er': 'he - third person singular masculine pronoun',
      'sie': 'she/they - third person singular feminine or plural pronoun',
      'es': 'it - third person singular neuter pronoun',
      'wir': 'we - first person plural pronoun',
      'ihr': 'you - second person plural pronoun',
      'haben': 'to have - auxiliary and main verb',
      'sein': 'to be - auxiliary and main verb',
      'werden': 'to become/will - auxiliary verb for future and passive',
      'können': 'can/to be able to - modal verb',
      'müssen': 'must/to have to - modal verb',
      'sollen': 'should/to be supposed to - modal verb',
      'wollen': 'to want - modal verb',
      'dürfen': 'may/to be allowed to - modal verb',
      'mögen': 'to like - modal verb',
      'gehen': 'to go - verb of movement',
      'kommen': 'to come - verb of movement',
      'machen': 'to make/to do - general action verb',
      'sagen': 'to say - speech verb',
      'sehen': 'to see - perception verb',
      'hören': 'to hear - perception verb',
      'essen': 'to eat - verb related to food',
      'trinken': 'to drink - verb related to beverages',
      'schlafen': 'to sleep - verb related to rest',
      'arbeiten': 'to work - verb related to employment',
      'spielen': 'to play - verb related to games/music',
      'lernen': 'to learn - verb related to education',
      'lesen': 'to read - verb related to texts',
      'schreiben': 'to write - verb related to texts',
      'sprechen': 'to speak - verb related to communication',
      'verstehen': 'to understand - verb related to comprehension'
    };
    
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    return mockDefinitions[cleanWord] || `${word} - definition not available`;
  };

  // Load definitions for selected words
  useEffect(() => {
    const newDefinitions: Record<string, string> = {};
    selectedWords.forEach(word => {
      if (!wordDefinitions[word]) {
        newDefinitions[word] = getWordDefinition(word);
      }
    });
    
    if (Object.keys(newDefinitions).length > 0) {
      setWordDefinitions(prev => ({ ...prev, ...newDefinitions }));
    }
  }, [selectedWords]);

  // Split sentence into clickable words
  const renderClickableWords = () => {
    const words = exercise.sentence.split(/(\s+|[^\w\s])/);
    
    return words.map((segment, index) => {
      // Skip whitespace and punctuation
      if (/^\s+$/.test(segment) || /^[^\w\s]+$/.test(segment)) {
        return <span key={index}>{segment}</span>;
      }

      // Skip empty segments
      if (!segment.trim()) {
        return <span key={index}>{segment}</span>;
      }

      const isSelected = selectedWords.includes(segment);
      const isTargetWord = exercise.targetWords?.some(target => 
        segment.toLowerCase().includes(target.toLowerCase())
      );

      return (
        <button
          key={index}
          onClick={() => !showResult && onWordSelect(segment)}
          disabled={showResult}
          className={`mx-1 px-2 py-1 rounded transition-all duration-200 ${
            showResult
              ? isTargetWord
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 cursor-default'
                : isSelected
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 cursor-default'
                : 'cursor-default'
              : isSelected
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'hover:bg-muted hover:text-foreground cursor-pointer'
          } ${!showResult ? 'hover:scale-105 active:scale-95' : ''}`}
        >
          {segment}
        </button>
      );
    });
  };

  const handleSubmit = () => {
    onSubmit();
  };

  return (
    <Card className="w-full">
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
      
      <CardContent>
        <div className="space-y-6">
          {/* Instructions */}
          <div className="text-center">
            <p className="text-base font-medium mb-4">
              Click on words you don't know or want to learn:
            </p>
          </div>

          {/* Interactive Sentence */}
          <div className="p-6 md:p-8 bg-muted rounded-lg">
            <div className="text-lg md:text-xl leading-relaxed text-center">
              {renderClickableWords()}
            </div>
          </div>

          {/* Selected Words Definitions - Fixed to show English definitions */}
          {selectedWords.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Book className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Selected Words & Definitions:</h3>
              </div>
              <div className="grid gap-3">
                {selectedWords.map((word, index) => (
                  <div
                    key={index}
                    className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-blue-800 dark:text-blue-200">
                        {word}
                      </span>
                      <span className="text-sm text-blue-700 dark:text-blue-300 flex-1">
                        {wordDefinitions[word] || 'Loading definition...'}
                      </span>
                    </div>
                  </div>
                ))}
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
                disabled={loading}
                size="lg"
                className="px-8 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                {loading ? 'Processing...' : 'Continue'}
              </Button>
            ) : (
              <div className="text-center space-y-4">
                <div className={`flex items-center justify-center gap-2 text-lg font-semibold ${
                  isCorrect ? 'text-green-600' : 'text-blue-600'
                }`}>
                  <CheckCircle className="h-6 w-6" />
                  {selectedWords.length > 0 
                    ? `Great! You marked ${selectedWords.length} word(s) for learning.`
                    : 'Words marked for learning!'
                  }
                </div>
                
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
