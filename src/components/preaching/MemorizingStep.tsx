
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, Volume2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { preachingService } from '@/services/preachingService';
import LoadingVisualization from './LoadingVisualization';
import type { Noun, PreachingDifficulty } from '@/types/preaching';
import type { Language } from '@/types';

interface MemorizingStepProps {
  nouns: Noun[];
  difficulty: PreachingDifficulty;
  language: Language;
  onComplete: () => void;
  onNounsUpdate: (nouns: Noun[]) => void;
}

const MemorizingStep: React.FC<MemorizingStepProps> = ({ 
  nouns, 
  difficulty,
  language, 
  onComplete, 
  onNounsUpdate 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentNoun = nouns[currentIndex];

  const handleNext = () => {
    if (currentIndex < nouns.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      // Set language based on the selected language
      switch (language) {
        case 'german':
          utterance.lang = 'de-DE';
          break;
        case 'spanish':
          utterance.lang = 'es-ES';
          break;
        case 'french':
          utterance.lang = 'fr-FR';
          break;
        case 'italian':
          utterance.lang = 'it-IT';
          break;
        default:
          utterance.lang = 'de-DE';
      }
      speechSynthesis.speak(utterance);
    }
  };

  const handleWordSelection = (wordId: string, checked: boolean) => {
    const newSelectedWords = new Set(selectedWords);
    if (checked) {
      newSelectedWords.add(wordId);
    } else {
      newSelectedWords.delete(wordId);
    }
    setSelectedWords(newSelectedWords);
  };

  const handleRefreshWords = async () => {
    if (selectedWords.size === 0) {
      toast.error('Please select at least one word to refresh');
      return;
    }

    setIsRefreshing(true);
    try {
      // Generate new words to replace selected ones
      const newWordsCount = selectedWords.size;
      const newWords = await preachingService.generateNouns(difficulty, language, newWordsCount);
      
      // Create updated nouns array
      const updatedNouns = nouns.map(noun => {
        if (selectedWords.has(noun.id)) {
          // Replace with new word (find matching index)
          const replacementIndex = Array.from(selectedWords).indexOf(noun.id);
          return newWords[replacementIndex] || noun;
        }
        return noun;
      });

      onNounsUpdate(updatedNouns);
      setSelectedWords(new Set());
      toast.success(`Refreshed ${newWordsCount} word${newWordsCount > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Failed to refresh words:', error);
      toast.error('Failed to refresh words. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getArticleColor = (article: string) => {
    switch (article) {
      case 'der': return 'bg-blue-100 text-blue-800';
      case 'die': return 'bg-red-100 text-red-800';
      case 'das': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isRefreshing) {
    return <LoadingVisualization type="words" message="Generating fresh vocabulary..." />;
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Study These Nouns</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('cards')}
            >
              Card View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshWords}
              disabled={selectedWords.size === 0}
              className="flex items-center space-x-1"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Selected</span>
            </Button>
            <Button onClick={onComplete}>
              Continue to Testing
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          Select words you want to refresh with new vocabulary
        </div>

        <div className="grid gap-3">
          {nouns.map((noun, index) => (
            <Card key={noun.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Checkbox
                    id={`word-${noun.id}`}
                    checked={selectedWords.has(noun.id)}
                    onCheckedChange={(checked) => 
                      handleWordSelection(noun.id, checked as boolean)
                    }
                  />
                  <Badge className={getArticleColor(noun.article)}>
                    {noun.article}
                  </Badge>
                  <span className="text-lg font-medium">{noun.word}</span>
                  <span className="text-gray-600">({noun.meaning})</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => speakWord(`${noun.article} ${noun.word}`)}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {selectedWords.size > 0 && (
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              {selectedWords.size} word{selectedWords.size > 1 ? 's' : ''} selected for refresh
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Study These Nouns</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List View
          </Button>
          <Button onClick={onComplete}>
            Continue to Testing
          </Button>
        </div>
      </div>

      {/* Card View */}
      <div className="flex justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-6">
            <div className="space-y-2">
              <Badge className={`${getArticleColor(currentNoun.article)} text-xl px-4 py-2`}>
                {currentNoun.article}
              </Badge>
              <h2 className="text-3xl font-bold">{currentNoun.word}</h2>
              <p className="text-lg text-gray-600">({currentNoun.meaning})</p>
            </div>

            <Button
              variant="outline"
              onClick={() => speakWord(`${currentNoun.article} ${currentNoun.word}`)}
              className="w-full"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Listen
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <span className="text-sm text-gray-600">
          {currentIndex + 1} of {nouns.length}
        </span>

        <Button
          variant="outline"
          onClick={handleNext}
          disabled={currentIndex === nouns.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default MemorizingStep;
