
import React from 'react';
import { Card } from '@/components/ui/card';

interface ExerciseContentProps {
  exercise: any;
  showActions?: boolean;
}

const ExerciseContent: React.FC<ExerciseContentProps> = ({ 
  exercise,
  showActions = true
}) => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">{exercise?.title || 'Exercise Content'}</h2>
      
      {exercise?.text ? (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p>{exercise.text}</p>
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          <p>No content available for this exercise.</p>
        </div>
      )}
      
      {showActions && (
        <div className="flex justify-end mt-6 space-x-4">
          <p className="text-muted-foreground">Exercise actions would appear here</p>
        </div>
      )}
    </Card>
  );
};

export default ExerciseContent;
