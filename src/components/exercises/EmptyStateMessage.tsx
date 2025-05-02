
import React from 'react';
import { Button } from '@/components/ui/button';

interface EmptyStateMessageProps {
  onCreateExercise: () => void;
}

const EmptyStateMessage: React.FC<EmptyStateMessageProps> = ({ onCreateExercise }) => {
  return (
    <div className="text-center py-12 border rounded-lg">
      <p className="text-muted-foreground mb-4">No exercises found</p>
      <Button onClick={onCreateExercise}>
        Create your first exercise
      </Button>
    </div>
  );
};

export default EmptyStateMessage;
