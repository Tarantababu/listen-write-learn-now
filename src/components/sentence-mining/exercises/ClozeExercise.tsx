
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Volume2, VolumeX, Play, CheckCircle, XCircle } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';

interface ClozeExerciseProps {
  exercise: SentenceMiningExercise;
  userResponse: string;
  onResponseChange: (response: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  showResult: boolean;
  isCorrect: boolean;
  loading: boolean;
  onPlayAudio?: () => void;
  audioLoading?: boolean;
}

export const ClozeExercise: React.FC<ClozeExerciseProps> = ({
  exercise,
  userResponse,
  onResponseChange,
  onSubmit,
  onNext,
  showResult,
  isCorrect,
  loading,
  onPlayAudio,
  audioLoading = false,
}) => {
  const renderSentenceWithBlank = (sentence: string, targetWord: string) => {
    const parts = sentence.split(new RegExp(`\\b${targetWord}\\b`, 'gi'));
    const result = [];
    
    parts.forEach((part, index) => {
      result.push(part);
      if (index < parts.length - 1) {
        result.push(
          <span key={index} className="relative inline-block mx-2">
            <div className="w-40 h-16 bg-blue-100 border-2 border-blue-300 rounded-lg flex items-center justify-center">
              {showResult ? (
                <span className={`text-lg font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {userResponse || exercise.targetWord}
                </span>
              ) : (
                <Input
                  value={userResponse}
                  onChange={(e) => onResponseChange(e.target.value)}
                  className="border-0 bg-transparent text-center text-lg font-medium focus:ring-0"
                  disabled={loading}
                />
              )}
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
              "my"
            </div>
          </span>
        );
      }
    });
    
    return result;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge className="bg-blue-500 text-white px-4 py-2 text-base font-medium">
            146 words
          </Badge>
          <Badge variant="outline" className="px-4 py-2 text-base bg-gray-100 text-gray-600">
            Grammar Level: Advanced
          </Badge>
          <Button variant="ghost" className="text-gray-600">
            Change
          </Button>
        </div>
        <div className="text-gray-500 text-sm">
          Exercise #15503 Sentence #10552
        </div>
      </div>

      {/* Main Content */}
      <Card className="border-0 shadow-none">
        <CardContent className="p-8">
          <div className="space-y-8">
            {/* Sentence with blank */}
            <div className="text-center">
              <p className="text-4xl font-normal text-black leading-relaxed">
                {renderSentenceWithBlank(exercise.sentence, exercise.targetWord)}
              </p>
            </div>

            {/* Instructions */}
            <p className="text-gray-600 text-lg text-center">
              Find the missing word. Click any words you don't know.
            </p>

            {/* Result Feedback */}
            {showResult && (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  {isCorrect ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                  <span className="text-2xl font-medium">
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>

                {!isCorrect && (
                  <div className="text-gray-700">
                    <p className="font-medium">Correct answer: {exercise.targetWord}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between">
        {/* Left side buttons */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="bg-blue-500 text-white px-6 py-3 text-lg border-0 hover:bg-blue-600"
          >
            Translate
          </Button>
          <Button
            variant="outline"
            className="bg-blue-500 text-white px-6 py-3 text-lg border-0 hover:bg-blue-600"
          >
            Reveal
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
