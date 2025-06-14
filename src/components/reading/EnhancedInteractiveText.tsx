
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card } from '@/components/ui/card';
import { Volume2, Plus } from 'lucide-react';
import { readingExerciseService } from '@/services/readingExerciseService';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { toast } from 'sonner';
import { TextSelectionManager } from './TextSelectionManager';
import { Language } from '@/types';

interface Word {
  word: string;
  definition?: string;
  partOfSpeech?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface EnhancedInteractiveTextProps {
  text: string;
  words?: Word[];
  language: string;
  onWordClick?: (word: string) => void;
  enableTooltips?: boolean;
  enableBidirectionalCreation?: boolean;
  // New props for enhanced functionality
  enableTextSelection?: boolean;
  vocabularyIntegration?: boolean;
  enhancedHighlighting?: boolean;
  exerciseId?: string;
  onCreateDictation?: (selectedText: string) => void;
  onCreateBidirectional?: (selectedText: string) => void;
}

export const EnhancedInteractiveText: React.FC<EnhancedInteractiveTextProps> = ({
  text,
  words = [],
  language,
  onWordClick,
  enableTooltips = true,
  enableBidirectionalCreation = false,
  // New props with defaults for backward compatibility
  enableTextSelection = false,
  vocabularyIntegration = false,
  enhancedHighlighting = false,
  exerciseId,
  onCreateDictation,
  onCreateBidirectional
}) => {
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const { addExercise } = useExerciseContext();

  const playWordAudio = async (word: string) => {
    try {
      setPlayingWord(word);
      const audioUrl = await readingExerciseService.generateAudio(word, language);
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      console.error('Error playing word audio:', error);
      toast.error('Audio playback failed');
    } finally {
      setPlayingWord(null);
    }
  };

  const createBidirectionalExercise = async (word: string, definition?: string) => {
    if (!enableBidirectionalCreation) return;
    
    try {
      const sentence = `Practice sentence with the word "${word}".`;
      
      const bidirectionalExercise = {
        title: `Translation: ${word}`,
        text: sentence,
        language: language as any,
        tags: ['bidirectional', 'from-reading', word.toLowerCase()],
        directoryId: null
      };
      
      await addExercise(bidirectionalExercise);
      toast.success(`Translation exercise created for "${word}"`);
    } catch (error) {
      console.error('Error creating bidirectional exercise:', error);
      toast.error('Failed to create translation exercise');
    }
  };

  const getWordInfo = (wordText: string): Word | undefined => {
    const cleanWord = wordText.toLowerCase().replace(/[.,!?;:"'()]/g, '');
    return words.find(w => w.word.toLowerCase() === cleanWord);
  };

  const handleCreateDictation = (selectedText: string) => {
    if (onCreateDictation) {
      onCreateDictation(selectedText);
    } else {
      // Default behavior - could create a dictation exercise
      toast.success(`Dictation exercise can be created for: "${selectedText}"`);
    }
  };

  const handleCreateBidirectional = (selectedText: string) => {
    if (onCreateBidirectional) {
      onCreateBidirectional(selectedText);
    } else {
      // Default behavior
      createBidirectionalExercise(selectedText);
    }
  };

  const renderInteractiveText = () => {
    const words = text.split(/(\s+)/);
    
    return words.map((word, index) => {
      if (/^\s+$/.test(word)) {
        return <span key={index}>{word}</span>;
      }

      const wordInfo = getWordInfo(word);
      
      if (wordInfo && enableTooltips) {
        return (
          <Popover key={index}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="inline-flex items-center h-auto p-0.5 font-normal text-base leading-relaxed text-gray-800 hover:bg-gray-50 hover:text-gray-800 border-b border-transparent hover:border-gray-200 transition-colors duration-300"
                onMouseEnter={() => setHoveredWord(word)}
                onMouseLeave={() => setHoveredWord(null)}
                onClick={() => onWordClick?.(word)}
              >
                {word}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-lg border-gray-200" side="top" sideOffset={8}>
              <Card className="border-0 shadow-none">
                <div className="p-4 space-y-3">
                  {/* Simple header with word and controls */}
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg text-gray-900">{wordInfo.word}</h4>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => playWordAudio(wordInfo.word)}
                        disabled={playingWord === wordInfo.word}
                        className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-600 transition-colors duration-200"
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                      {enableBidirectionalCreation && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => createBidirectionalExercise(wordInfo.word, wordInfo.definition)}
                          title="Create translation exercise"
                          className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-600 transition-colors duration-200"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {wordInfo.partOfSpeech && (
                    <div className="text-sm text-gray-600 italic">{wordInfo.partOfSpeech}</div>
                  )}
                  
                  {wordInfo.definition && (
                    <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                      <p className="text-sm text-gray-800 leading-relaxed">
                        <span className="font-medium text-gray-900">Definition:</span> {wordInfo.definition}
                      </p>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Volume2 className="h-3 w-3" />
                        Click to hear
                      </span>
                      {enableBidirectionalCreation && (
                        <span className="flex items-center gap-1">
                          <Plus className="h-3 w-3" />
                          + for exercise
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </PopoverContent>
          </Popover>
        );
      }

      return <span key={index} className="text-base leading-relaxed text-gray-800">{word}</span>;
    });
  };

  const textContent = (
    <div className="leading-relaxed text-lg text-gray-800">
      {renderInteractiveText()}
    </div>
  );

  // Conditionally wrap with TextSelectionManager if text selection is enabled
  if (enableTextSelection) {
    return (
      <TextSelectionManager
        onCreateDictation={handleCreateDictation}
        onCreateBidirectional={handleCreateBidirectional}
        exerciseId={exerciseId}
        exerciseLanguage={language as Language}
        enableVocabulary={vocabularyIntegration}
        enhancedHighlighting={enhancedHighlighting}
        vocabularyIntegration={vocabularyIntegration}
      >
        {textContent}
      </TextSelectionManager>
    );
  }

  // Return the original component for backward compatibility
  return textContent;
};
