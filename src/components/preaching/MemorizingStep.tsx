
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import type { Noun } from '@/types/preaching';

interface MemorizingStepProps {
  nouns: Noun[];
  onComplete: () => void;
}

const MemorizingStep: React.FC<MemorizingStepProps> = ({ nouns, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

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
      utterance.lang = 'de-DE';
      speechSynthesis.speak(utterance);
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

  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Study These Nouns</h3>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('cards')}
            >
              Card View
            </Button>
            <Button onClick={onComplete}>
              Continue to Testing
            </Button>
          </div>
        </div>

        <div className="grid gap-3">
          {nouns.map((noun, index) => (
            <Card key={noun.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Study These Nouns</h3>
        <div className="space-x-2">
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
