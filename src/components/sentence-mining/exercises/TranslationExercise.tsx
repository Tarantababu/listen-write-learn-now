
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX, Play, CheckCircle, XCircle, Eye } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';

interface TranslationExerciseProps {
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
  showTranslation: boolean;
  onToggleTranslation: () => void;
}

export const TranslationExercise: React.FC<TranslationExerciseProps> = ({
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
  showTranslation,
  onToggleTranslation,
}) => {
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
        <div className="text-gray-500 text-sm">
          Exercise #15515 Sentence #297
        </div>
      </div>

      {/* Main Content */}
      <Card className="border-0 shadow-none">
        <CardContent className="p-8">
          <div className="space-y-8">
            {/* Exercise Title */}
            <h2 className="text-2xl font-normal text-gray-800">
              Translate into German:
            </h2>

            {/* Sentence */}
            <div className="text-center">
              <p className="text-4xl font-normal text-black leading-relaxed">
                "{exercise.sentence}"
              </p>
              <div className="mt-4 border-b-4 border-dotted border-yellow-400 w-full"></div>
            </div>

            {/* Instructions */}
            <p className="text-gray-600 text-lg">
              Click a part of the sentence to get help translating it.
            </p>

            {/* Translation Input Area */}
            <div className="bg-blue-50 rounded-lg p-6 min-h-32">
              <Textarea
                value={userResponse}
                onChange={(e) => onResponseChange(e.target.value)}
                placeholder=""
                disabled={showResult || loading}
                className="w-full border-0 bg-transparent text-xl resize-none focus:ring-0 focus:outline-none min-h-24"
              />
            </div>

            {/* Result Feedback */}
            {showResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                  <span className="text-lg font-medium">
                    {isCorrect ? 'Great translation!' : 'Try again next time'}
                  </span>
                </div>

                {exercise.explanation && (
                  <div className="text-gray-700">
                    <p className="font-medium mb-2">Grammar Note:</p>
                    <p>{exercise.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between">
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

        {/* Action Button */}
        <div>
          {!showResult ? (
            <Button
              onClick={onSubmit}
              disabled={!userResponse.trim() || loading}
              className="bg-blue-800 hover:bg-blue-900 text-white px-8 py-4 text-lg font-medium rounded-lg"
            >
              {loading ? 'Checking...' : 'Submit'}
            </Button>
          ) : (
            <Button
              onClick={onNext}
              className="bg-blue-800 hover:bg-blue-900 text-white px-8 py-4 text-lg font-medium rounded-lg"
            >
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
