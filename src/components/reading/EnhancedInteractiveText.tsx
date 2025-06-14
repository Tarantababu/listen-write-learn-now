
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Volume2, BookOpen, Plus } from 'lucide-react';
import { readingExerciseService } from '@/services/readingExerciseService';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { toast } from 'sonner';

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
}

export const EnhancedInteractiveText: React.FC<EnhancedInteractiveTextProps> = ({
  text,
  words = [],
  language,
  onWordClick,
  enableTooltips = true,
  enableBidirectionalCreation = false
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
      // Create a simple sentence using the word for bidirectional exercise
      const sentence = `This sentence contains the word "${word}".`;
      
      const bidirectionalExercise = {
        title: `Bidirectional: ${word}`,
        text: sentence,
        language: language as any,
        tags: ['bidirectional', 'from-reading', word.toLowerCase()],
        directoryId: null
      };
      
      await addExercise(bidirectionalExercise);
      toast.success(`Bidirectional exercise created for "${word}"`);
    } catch (error) {
      console.error('Error creating bidirectional exercise:', error);
      toast.error('Failed to create bidirectional exercise');
    }
  };

  const getWordInfo = (wordText: string): Word | undefined => {
    const cleanWord = wordText.toLowerCase().replace(/[.,!?;:"'()]/g, '');
    return words.find(w => w.word.toLowerCase() === cleanWord);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100';
      case 'medium': return 'text-yellow-600 border-yellow-200 bg-yellow-50 hover:bg-yellow-100';
      case 'hard': return 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100';
      default: return 'text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100';
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
                className={`inline-flex items-center gap-1 h-auto p-1 text-base font-normal rounded-sm border border-transparent transition-all ${getDifficultyColor(wordInfo.difficulty)}`}
                onMouseEnter={() => setHoveredWord(word)}
                onMouseLeave={() => setHoveredWord(null)}
                onClick={() => onWordClick?.(word)}
              >
                {word}
                {hoveredWord === word && (
                  <div className="ml-1 text-xs opacity-70">
                    {wordInfo.difficulty === 'easy' && '●'}
                    {wordInfo.difficulty === 'medium' && '●●'}
                    {wordInfo.difficulty === 'hard' && '●●●'}
                  </div>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" side="top">
              <Card className="border-0 shadow-lg">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg">{wordInfo.word}</h4>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => playWordAudio(wordInfo.word)}
                        disabled={playingWord === wordInfo.word}
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                      {enableBidirectionalCreation && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => createBidirectionalExercise(wordInfo.word, wordInfo.definition)}
                          title="Create bidirectional exercise"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium ${getDifficultyColor(wordInfo.difficulty)}`}
                      >
                        {wordInfo.difficulty} level
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {wordInfo.difficulty === 'easy' && 'Common word'}
                        {wordInfo.difficulty === 'medium' && 'Intermediate vocabulary'}
                        {wordInfo.difficulty === 'hard' && 'Advanced vocabulary'}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Click to pronounce • Hover for quick info
                    {enableBidirectionalCreation && ' • + to create exercise'}
                  </div>
                </div>
              </Card>
            </PopoverContent>
          </Popover>
        );
      }

      return <span key={index}>{word}</span>;
    });
  };

  return (
    <div className="leading-relaxed text-lg">
      {renderInteractiveText()}
    </div>
  );
};
