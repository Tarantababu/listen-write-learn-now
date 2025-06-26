
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';

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
  const renderClickableText = () => {
    const words = exercise.sentence.split(/(\s+)/);
    
    return words.map((token, index) => {
      const cleanToken = token.replace(/[.,!?;:]/g, '').toLowerCase();
      const isClickable = exercise.clickableWords?.some(cw => cw.word.toLowerCase() === cleanToken);
      const isSelected = selectedWords.includes(cleanToken);
      
      if (token.trim() === '') {
        return <span key={index}>{token}</span>;
      }
      
      if (isClickable) {
        return (
          <span
            key={index}
            className={`inline-block cursor-pointer px-1 py-0.5 rounded transition-colors ${
              isSelected
                ? 'bg-blue-500 text-white'
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge className="bg-blue-500 text-white px-4 py-2 text-base font-medium">
            147 words
          </Badge>
          <Badge variant="outline" className="px-4 py-2 text-base bg-gray-100 text-gray-600">
            Grammar Level: Advanced
          </Badge>
          <Button variant="ghost" className="text-gray-600">
            Change
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card className="border-0 shadow-none">
        <CardContent className="p-8">
          <div className="space-y-8">
            {/* Instructions */}
            <p className="text-lg text-gray-700 leading-relaxed">
              Read the sentence and click any word you don't understand. This marks them for later repetition. Then press continue.
            </p>

            {/* Clickable sentence */}
            <div className="text-center">
              <p className="text-4xl font-normal text-black leading-relaxed">
                {renderClickableText()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between">
        {/* Left side button */}
        <div>
          <Button
            variant="outline"
            className="bg-blue-500 text-white px-6 py-3 text-lg border-0 hover:bg-blue-600"
          >
            Translation
          </Button>
        </div>

        {/* Center button */}
        <div>
          <Button
            onClick={showResult ? onNext : onSubmit}
            className="bg-blue-800 hover:bg-blue-900 text-white px-8 py-4 text-lg font-medium rounded-lg"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Continue'}
          </Button>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={onPlayAudio}
            disabled={audioLoading}
            className="w-16 h-16 rounded-full bg-blue-500 text-white border-0 hover:bg-blue-600"
          >
            <Play className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-16 h-16 rounded-full bg-blue-500 text-white border-0 hover:bg-blue-600"
          >
            <VolumeX className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};
