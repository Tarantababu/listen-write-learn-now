
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SentenceMiningExercise } from '@/types/sentence-mining';
import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SentenceDisplayProps {
  exercise: SentenceMiningExercise;
  onPlayAudio?: () => void;
  audioLoading?: boolean;
}

export const SentenceDisplay: React.FC<SentenceDisplayProps> = ({
  exercise,
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
          <span key={index} className="inline-block border-b-2 border-primary border-dashed min-w-[100px] mx-1 text-center">
            ___
          </span>
        );
      }
    });
    
    return result;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Complete the Sentence</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {exercise.difficulty}
            </Badge>
            {onPlayAudio && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPlayAudio}
                disabled={audioLoading}
                className="flex items-center gap-1 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                <Volume2 className="h-4 w-4" />
                {audioLoading ? 'Loading...' : 'Listen'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-lg leading-relaxed">
              {renderSentenceWithBlank(exercise.sentence, exercise.targetWord)}
            </p>
          </div>
          
          {exercise.context && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                Context:
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {exercise.context}
              </p>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            <p>Fill in the blank with the missing word.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
