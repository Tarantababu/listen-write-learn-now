
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, ArrowRight, Eye, Loader2, Keyboard } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';
import { supabase } from '@/integrations/supabase/client';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';

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

interface WordDefinition {
  word: string;
  definition: string;
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
  const { settings } = useUserSettingsContext();
  const [buttonState, setButtonState] = useState<'idle' | 'processing'>('idle');
  const [wordDefinitions, setWordDefinitions] = useState<WordDefinition[]>([]);
  const [loadingDefinitions, setLoadingDefinitions] = useState(false);

  // Extract and get definitions for all words when component mounts
  useEffect(() => {
    const extractAndDefineWords = async () => {
      setLoadingDefinitions(true);
      try {
        const words = exercise.sentence.split(/(\s+)/).filter(token => {
          const cleanToken = token.replace(/[.,!?;:]/g, '').toLowerCase();
          return cleanToken.trim().length > 0 && /^[a-zA-Z]+$/.test(cleanToken);
        });

        const uniqueWords = [...new Set(words.map(word => word.replace(/[.,!?;:]/g, '').toLowerCase()))];
        
        // Get definitions for all words
        const definitions: WordDefinition[] = [];
        
        for (const word of uniqueWords) {
          try {
            const { data, error } = await supabase.functions.invoke('generate-vocabulary-info', {
              body: {
                text: word,
                language: settings.selectedLanguage,
                requestDefinition: true
              }
            });

            if (!error && data?.definition) {
              definitions.push({
                word: word,
                definition: data.definition
              });
            } else {
              // Fallback definition
              definitions.push({
                word: word,
                definition: `${word} (definition not available)`
              });
            }
          } catch (error) {
            console.error(`Error getting definition for ${word}:`, error);
            definitions.push({
              word: word,
              definition: `${word} (definition not available)`
            });
          }
        }

        setWordDefinitions(definitions);
      } catch (error) {
        console.error('Error extracting words:', error);
      } finally {
        setLoadingDefinitions(false);
      }
    };

    extractAndDefineWords();
  }, [exercise.sentence, settings.selectedLanguage]);

  // Add keyboard event listener for Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Submit on Enter key
      if (e.key === 'Enter' && !showResult && buttonState === 'idle' && !loading) {
        e.preventDefault();
        handleContinueClick();
      }
      // Show/hide translation on Ctrl+T or Cmd+T
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        onToggleTranslation();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showResult, buttonState, loading, onToggleTranslation]);

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

  const handleContinueClick = async () => {
    if (buttonState === 'processing' || loading) return;
    
    setButtonState('processing');
    
    try {
      if (showResult) {
        await onNext();
      } else {
        await onSubmit();
      }
    } catch (error) {
      console.error('Error in continue:', error);
    } finally {
      setTimeout(() => {
        setButtonState('idle');
      }, 1000);
    }
  };

  const getWordDefinition = (word: string) => {
    const definition = wordDefinitions.find(def => def.word === word);
    return definition?.definition || `${word} (loading definition...)`;
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

          {/* Keyboard shortcuts hint */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
            <Keyboard className="h-3 w-3" />
            <span>Enter: continue • Ctrl+T: translation</span>
          </div>

          {loadingDefinitions && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading word definitions...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected words feedback */}
      {selectedWords.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <h3 className="font-medium">Words you've marked for review:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedWords.map(word => (
                  <div key={word} className="bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-lg transform transition-all duration-200 hover:scale-105">
                    <div className="font-medium text-sm md:text-base">{word}</div>
                    <div className="text-xs md:text-sm text-muted-foreground">
                      {getWordDefinition(word)}
                    </div>
                  </div>
                ))}
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
                className="transition-transform duration-200 hover:scale-105 active:scale-95 flex-1 md:flex-none flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {showTranslation ? 'Hide Translation' : 'Show Translation'}
              </Button>
            </div>
            
            <Button
              onClick={handleContinueClick}
              className="px-6 md:px-8 py-3 flex items-center gap-2 transition-transform duration-200 hover:scale-105 active:scale-95 w-full md:w-auto text-base"
              disabled={loading || buttonState === 'processing'}
            >
              {(loading || buttonState === 'processing') ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Continue <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Translation display */}
          {showTranslation && exercise.translation && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg animate-fade-in">
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                <strong>Translation:</strong> {exercise.translation}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
