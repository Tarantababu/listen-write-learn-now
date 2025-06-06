
import React from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CreateExerciseCardProps {
  onClick: () => void;
}

const CreateExerciseCard: React.FC<CreateExerciseCardProps> = ({ onClick }) => {
  return (
    <Card 
      className="border-dashed border-2 hover:border-primary/50 transition-all flex flex-col items-center justify-center h-full min-h-[280px] hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="bg-primary/10 rounded-full p-4 mb-4">
          <Plus className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-medium text-lg mb-2">Create New Exercise</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add your own text and generate audio for practice
        </p>
        <Button className="mt-2" onClick={onClick} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Create Exercise
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreateExerciseCard;
