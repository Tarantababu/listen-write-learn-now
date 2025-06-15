
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card } from '@/components/ui/card';
import { Volume2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface Word {
  word: string;
  definition?: string;
  partOfSpeech?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface InteractiveTextProps {
  text: string;
  words?: Word[];
  language: string;
  onWordClick?: (word: string) => void;
}

export const InteractiveText: React.FC<InteractiveTextProps> = ({
  text,
  words = [],
  language,
  onWordClick
}) => {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);

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

  const renderInteractiveText = () => {
    const words = text.split(/(\s+)/);
    
    return words.map((word, index) => {
      if (/^\s+$/.test(word)) {
        return <span key={index}>{word}</span>;
      }

      const wordInfo = getWordInfo(word);
      
      if (wordInfo) {
        return (
          <Popover key={index}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={`inline-flex items-center gap-1 h-auto p-1 text-base font-normal hover:${getDifficultyColor(wordInfo.difficulty)} rounded-sm border border-transparent hover:border-current transition-all`}
                onClick={() => onWordClick?.(word)}
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
                      onClick={() => toast.info('Individual word audio is not available. Use the full text audio instead.')}
                      title="Audio not available for individual words"
                    >
                      <Volume2 className="h-4 w-4 opacity-50" />
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

      return <span key={index}>{word}</span>;
    });
  };

  return (
    <div className="leading-relaxed text-lg">
      {renderInteractiveText()}
    </div>
  );
};
