
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';

interface EmptyStateMessageProps {
  onCreateExercise: () => void;
}

const EmptyStateMessage: React.FC<EmptyStateMessageProps> = ({ onCreateExercise }) => {
  return (
    <div className="text-center py-16 border rounded-lg flex flex-col items-center">
      <div className="bg-muted/30 p-4 rounded-full mb-4">
        <FileText className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No exercises found</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Create your first exercise to start improving your language skills
      </p>
      <Button onClick={onCreateExercise}>
        <Plus className="h-4 w-4 mr-2" />
        Create your first exercise
      </Button>
    </div>
  );
};

export default EmptyStateMessage;
