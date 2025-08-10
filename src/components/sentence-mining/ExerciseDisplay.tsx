
import React from 'react';
import { SentenceMiningExercise } from '@/types/sentence-mining';

interface ExerciseDisplayProps {
  exercise: SentenceMiningExercise;
}

export const ExerciseDisplay: React.FC<ExerciseDisplayProps> = ({ exercise }) => {
  return (
    <div className="space-y-4">
      <div className="text-lg font-medium">
        {exercise.clozeSentence}
      </div>
      {exercise.translation && (
        <div className="text-sm text-muted-foreground italic">
          {exercise.translation}
        </div>
      )}
      {exercise.context && (
        <div className="text-sm bg-muted/50 p-3 rounded-lg">
          <span className="font-medium">Context: </span>
          {exercise.context}
        </div>
      )}
      {exercise.hints && exercise.hints.length > 0 && (
        <div className="text-sm text-blue-600">
          <span className="font-medium">Hint: </span>
          {exercise.hints[0]}
        </div>
      )}
    </div>
  );
};
