
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ExerciseContentProps {
  exercise: {
    title: string;
    text: string;
    audio_url?: string;
  };
  onComplete?: () => void;
  isLoading?: boolean;
  isCompleted?: boolean;
}

const ExerciseContent: React.FC<ExerciseContentProps> = ({
  exercise,
  onComplete,
  isLoading = false,
  isCompleted = false
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{exercise.title}</CardTitle>
        <CardDescription>Complete this exercise to progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="prose dark:prose-invert max-w-none">
          <p>{exercise.text}</p>
        </div>
        
        {exercise.audio_url && (
          <div className="mt-4">
            <audio controls className="w-full">
              <source src={exercise.audio_url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={onComplete} 
          disabled={isLoading || isCompleted}
          variant={isCompleted ? "outline" : "default"}
        >
          {isCompleted ? "Completed" : "Mark as Complete"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExerciseContent;
