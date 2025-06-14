
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Volume2, BookOpen, Plus, Sparkles } from 'lucide-react';
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

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': 
        return 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300';
      case 'medium': 
        return 'text-yellow-700 bg-yellow-50 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300';
      case 'hard': 
        return 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300';
      default: 
        return 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300';
    }
  };

  const getDifficultyIcon = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return '●';
      case 'medium': return '●●';
      case 'hard': return '●●●';
      default: return '○';
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
                className={`inline-flex items-center gap-1 h-auto p-1 font-normal rounded-md border transition-all duration-200 ${getDifficultyColor(wordInfo.difficulty)} text-base leading-relaxed`}
                onMouseEnter={() => setHoveredWord(word)}
                onMouseLeave={() => setHoveredWord(null)}
                onClick={() => onWordClick?.(word)}
              >
                {word}
                {hoveredWord === word && (
                  <span className="ml-1 text-xs opacity-70 font-medium">
                    {getDifficultyIcon(wordInfo.difficulty)}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-xl border-gray-200" side="top" sideOffset={8}>
              <Card className="border-0 shadow-none">
                <div className="p-5 space-y-4">
                  {/* Header with word and controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-lg text-gray-900">{wordInfo.word}</h4>
                      {wordInfo.difficulty && (
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium ${getDifficultyColor(wordInfo.difficulty)}`}
                        >
                          {wordInfo.difficulty}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => playWordAudio(wordInfo.word)}
                        disabled={playingWord === wordInfo.word}
                        className="h-8 w-8 p-0 hover:bg-blue-100 transition-colors duration-200"
                      >
                        <Volume2 className={`h-4 w-4 ${playingWord === wordInfo.word ? 'text-blue-600' : 'text-gray-600'}`} />
                      </Button>
                      {enableBidirectionalCreation && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => createBidirectionalExercise(wordInfo.word, wordInfo.definition)}
                          title="Create translation exercise"
                          className="h-8 w-8 p-0 hover:bg-purple-100 transition-colors duration-200"
                        >
                          <Plus className="h-4 w-4 text-purple-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Part of speech */}
                  {wordInfo.partOfSpeech && (
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 italic font-medium">{wordInfo.partOfSpeech}</span>
                    </div>
                  )}
                  
                  {/* Definition */}
                  {wordInfo.definition && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-sm text-gray-800 leading-relaxed">
                        <strong className="text-gray-900">Definition:</strong> {wordInfo.definition}
                      </p>
                    </div>
                  )}
                  
                  {/* Difficulty info */}
                  {wordInfo.difficulty && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Difficulty:</span>
                        <span className={`font-medium ${
                          wordInfo.difficulty === 'easy' ? 'text-green-600' :
                          wordInfo.difficulty === 'medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {wordInfo.difficulty === 'easy' && 'Common word'}
                          {wordInfo.difficulty === 'medium' && 'Intermediate vocabulary'}
                          {wordInfo.difficulty === 'hard' && 'Advanced vocabulary'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Footer info */}
                  <div className="pt-3 border-t border-gray-100">
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

      return <span key={index} className="text-base leading-relaxed">{word}</span>;
    });
  };

  return (
    <div className="leading-relaxed text-lg text-gray-800">
      {renderInteractiveText()}
    </div>
  );
};
