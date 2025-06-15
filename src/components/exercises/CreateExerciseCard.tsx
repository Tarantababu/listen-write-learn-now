
import React from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface CreateExerciseCardProps {
  onClick: () => void;
}

const CreateExerciseCard: React.FC<CreateExerciseCardProps> = ({ onClick }) => {
  const isMobile = useIsMobile();
  return (
    <Card
      className={`
        border-dashed border-2 hover:border-primary/50 transition-all flex flex-col items-center justify-center
        h-full ${isMobile ? 'min-h-[160px] py-6 px-2' : 'min-h-[280px]'}
        hover:shadow-md cursor-pointer
        active:bg-primary/10
        touch-manipulation
      `}
      onClick={onClick}
      tabIndex={0}
      role="button"
      style={{ WebkitTapHighlightColor: "transparent", outline: 'none' }}
    >
      <CardContent className={`flex flex-col items-center justify-center h-full text-center ${isMobile?'p-2':'p-6'}`}>
        <div className={`bg-primary/10 rounded-full ${isMobile ? 'p-3 mb-2' : 'p-4 mb-4'}`}>
          <Plus className={isMobile ? "h-5 w-5 text-primary" : "h-6 w-6 text-primary"} />
        </div>
        <h3 className={`font-medium ${isMobile ? 'text-base mb-1' : 'text-lg mb-2'}`}>Create New Exercise</h3>
        <p className="text-xs text-muted-foreground mb-2">
          Add your own text and generate audio for practice
        </p>
        <Button
          className="mt-1 active:bg-primary/15 focus-visible:ring"
          variant="outline"
          size={isMobile ? "sm" : "default"}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Exercise
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreateExerciseCard;
