
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card } from '@/components/ui/card';
import { Volume2, BookOpen } from 'lucide-react';
import { readingExerciseService } from '@/services/readingExerciseService';
import { ReadingSentence } from '@/types/reading';
import { toast } from 'sonner';

interface Word {
  word: string;
  definition?: string;
  partOfSpeech?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface InteractiveTextProps {
  text: string;
  sentences?: ReadingSentence[];
  words?: Word[];
  language: string;
  exerciseId?: string;
  enableTooltips?: boolean;
  enableTextSelection?: boolean;
  enableHighlighting?: boolean;
  enableWordSync?: boolean;
  enableContextMenu?: boolean;
  enableSmartProcessing?: boolean;
  onWordClick?: (word: string) => void;
  onTextSelection?: (selectedText: string) => void;
  onCreateDictation?: (selectedText: string) => void;
  onCreateBidirectional?: (selectedText: string) => void;
  currentAudio?: HTMLAudioElement | null;
  isPlaying?: boolean;
}

export const InteractiveText: React.FC<InteractiveTextProps> = ({
  text,
  sentences = [],
  words = [],
  language,
  exerciseId,
  enableTooltips = false,
  enableTextSelection = false,
  enableHighlighting = false,
  enableWordSync = false,
  enableContextMenu = false,
  enableSmartProcessing = false,
  onWordClick,
  onTextSelection,
  onCreateDictation,
  onCreateBidirectional,
  currentAudio,
  isPlaying = false
}) => {
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');

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

  const getWordInfo = (wordText: string): Word | undefined => {
    const cleanWord = wordText.toLowerCase().replace(/[.,!?;:"'()]/g, '');
    return words.find(w => w.word.toLowerCase() === cleanWord);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 border-green-200 bg-green-50';
      case 'medium': return 'text-yellow-600 border-yellow-200 bg-yellow-50';
      case 'hard': return 'text-red-600 border-red-200 bg-red-50';
      default: return 'text-blue-600 border-blue-200 bg-blue-50';
    }
  };

  const handleTextSelectionChange = () => {
    if (!enableTextSelection) return;
    
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selected = selection.toString().trim();
      setSelectedText(selected);
      if (onTextSelection) {
        onTextSelection(selected);
      }
    }
  };

  const handleCreateDictation = () => {
    if (selectedText && onCreateDictation) {
      onCreateDictation(selectedText);
    }
  };

  const handleCreateBidirectional = () => {
    if (selectedText && onCreateBidirectional) {
      onCreateBidirectional(selectedText);
    }
  };

  const renderInteractiveText = () => {
    const textWords = text.split(/(\s+)/);
    
    return textWords.map((word, index) => {
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
                className={`inline-flex items-center gap-1 h-auto p-1 text-base font-normal hover:${getDifficultyColor(wordInfo.difficulty)} rounded-sm border border-transparent hover:border-current transition-all ${
                  enableHighlighting ? 'hover:bg-blue-100' : ''
                }`}
                onClick={() => {
                  if (onWordClick) onWordClick(word);
                }}
              >
                {word}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" side="top">
              <Card className="border-0 shadow-lg">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg">{wordInfo.word}</h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => playWordAudio(wordInfo.word)}
                      disabled={playingWord === wordInfo.word}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {wordInfo.partOfSpeech && (
                    <div className="text-sm text-muted-foreground italic">
                      {wordInfo.partOfSpeech}
                    </div>
                  )}
                  
                  {wordInfo.definition && (
                    <div className="text-sm">
                      <strong>Definition:</strong> {wordInfo.definition}
                    </div>
                  )}
                  
                  {wordInfo.difficulty && (
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(wordInfo.difficulty)}`}>
                      {wordInfo.difficulty} level
                    </div>
                  )}
                </div>
              </Card>
            </PopoverContent>
          </Popover>
        );
      }

      return (
        <span 
          key={index}
          className={enableHighlighting ? 'hover:bg-blue-100 transition-colors' : ''}
          onClick={() => {
            if (onWordClick) onWordClick(word);
          }}
        >
          {word}
        </span>
      );
    });
  };

  return (
    <div 
      className="leading-relaxed text-lg"
      onMouseUp={handleTextSelectionChange}
      onTouchEnd={handleTextSelectionChange}
    >
      {renderInteractiveText()}
      
      {/* Selection Actions */}
      {enableTextSelection && selectedText && (enableContextMenu || onCreateDictation || onCreateBidirectional) && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-sm text-blue-800 mb-2">
            <BookOpen className="h-4 w-4" />
            Selected: "{selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}"
          </div>
          <div className="flex gap-2">
            {onCreateDictation && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCreateDictation}
                className="text-xs"
              >
                Create Dictation
              </Button>
            )}
            {onCreateBidirectional && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCreateBidirectional}
                className="text-xs"
              >
                Create Translation
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
