import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, ArrowRight, Eye, Loader2, Keyboard } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';
import { supabase } from '@/integrations/supabase/client';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const [buttonState, setButtonState] = useState<'idle' | 'processing'>('idle');
  const [wordDefinitions, setWordDefinitions] = useState<WordDefinition[]>([]);
  const [loadingDefinitions, setLoadingDefinitions] = useState(false);
  const [translationText, setTranslationText] = useState<string>('');
  const [translationLoading, setTranslationLoading] = useState(false);

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

  // Fetch translation when showTranslation changes to true
  useEffect(() => {
    if (showTranslation && !translationText && !translationLoading) {
      fetchTranslation();
    }
  }, [showTranslation]);

  const fetchTranslation = async () => {
    if (translationLoading) return;
    
    setTranslationLoading(true);
    try {
      console.log('Fetching translation for sentence:', exercise.sentence);
      
      const { data, error } = await supabase.functions.invoke('generate-vocabulary-info', {
        body: {
          text: `Translate this ${settings.selectedLanguage} sentence to English: "${exercise.sentence}"`,
          language: settings.selectedLanguage,
          requestExplanation: true
        }
      });

      if (error) {
        console.error('Translation error:', error);
        setTranslationText('Translation not available');
      } else if (data?.explanation) {
        setTranslationText(data.explanation);
      } else if (data?.definition) {
        setTranslationText(data.definition);
      } else {
        setTranslationText('Translation not available');
      }
    } catch (error) {
      console.error('Error fetching translation:', error);
      setTranslationText('Translation not available');
    } finally {
      setTranslationLoading(false);
    }
  };

  // Add keyboard event listener for Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Use Enter key for both submitting and continuing
      if (e.key === 'Enter' && buttonState === 'idle' && !loading) {
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
      
      // Make every word clickable with better mobile touch targets
      if (token.trim().length > 0) {
        return (
          <span
            key={index}
            className={`inline-block cursor-pointer transition-all duration-200 transform hover:scale-105 active:scale-95 ${
              isMobile 
                ? 'px-2 py-1.5 m-0.5 text-base min-h-[44px] flex items-center rounded-lg' 
                : 'px-1 py-0.5 rounded text-sm md:text-base'
            } ${
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

  // Mobile-first layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Mobile Header - Sticky */}
        <div className="sticky top-0 z-10 bg-card border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs capitalize">
                {exercise.difficulty}
              </Badge>
              <span className="text-sm font-medium">Mark Unknown Words</span>
            </div>
            {onPlayAudio && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPlayAudio}
                disabled={audioLoading}
                className="text-xs px-3 py-2 h-8"
              >
                <Volume2 className="h-3 w-3 mr-1" />
                {audioLoading ? 'Loading' : 'Listen'}
              </Button>
            )}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 flex flex-col px-4 py-4 space-y-4 pb-24">
          {/* Instructions */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              Tap any word you don't understand to mark it for review.
            </p>
          </div>
          
          {/* Clickable sentence */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-lg leading-relaxed flex flex-wrap">
              {renderClickableText()}
            </div>
          </div>

          {/* Selected words feedback */}
          {selectedWords.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Words marked for review:</h3>
              <div className="grid grid-cols-1 gap-2">
                {selectedWords.map(word => (
                  <div key={word} className="bg-blue-100 dark:bg-blue-900/30 px-3 py-3 rounded-lg">
                    <div className="font-medium text-base">{word}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {getWordDefinition(word)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Translation display */}
          {showTranslation && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg animate-fade-in">
              {translationLoading ? (
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading translation...
                </div>
              ) : (
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  <strong>Translation:</strong> {translationText || 'Translation not available'}
                </p>
              )}
            </div>
          )}

          {loadingDefinitions && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading word definitions...
            </div>
          )}
        </div>

        {/* Mobile Bottom Actions - Fixed */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t px-4 py-4 safe-area-bottom">
          <div className="flex flex-col gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onToggleTranslation}
              disabled={translationLoading}
              className="w-full h-12 flex items-center justify-center gap-2"
            >
              {translationLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  {showTranslation ? 'Hide Translation' : 'Show Translation'}
                </>
              )}
            </Button>
            
            <Button
              onClick={handleContinueClick}
              className="w-full h-12 text-base flex items-center justify-center gap-2"
              disabled={loading || buttonState === 'processing'}
            >
              {(loading || buttonState === 'processing') ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {showResult ? 'Next Exercise' : 'Continue'} <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            {/* Keyboard shortcuts hint */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Keyboard className="h-3 w-3" />
              <span>Enter: continue</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout (keep existing desktop code)
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
            <span>Enter: {showResult ? 'next' : 'submit'} • Ctrl+T: translation</span>
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
                disabled={translationLoading}
                className="transition-transform duration-200 hover:scale-105 active:scale-95 flex-1 md:flex-none flex items-center gap-2"
              >
                {translationLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    {showTranslation ? 'Hide Translation' : 'Show Translation'}
                  </>
                )}
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
                  {showResult ? 'Next' : 'Continue'} <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Translation display */}
          {showTranslation && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg animate-fade-in">
              {translationLoading ? (
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading translation...
                </div>
              ) : (
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  <strong>Translation:</strong> {translationText || 'Translation not available'}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
