import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Exercise } from '@/types/exercise';

interface CurriculumTagGroupProps {
  tag: string;
  exercises: Exercise[];
  onPracticeExercise: (id: string) => void;
  onAddExercise: (id: string) => void;
}

const CurriculumTagGroup: React.FC<CurriculumTagGroupProps> = ({
  tag,
  exercises,
  onPracticeExercise,
  onAddExercise,
}) => {
  // Change this from true to false to make accordions closed by default
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border rounded-md">
      {/* Tag Header - Clickable to expand/collapse */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer bg-muted/50 hover:bg-muted"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <h3 className="font-medium">{tag}</h3>
          <span className="ml-2 text-sm text-muted-foreground">
            ({exercises.length} exercises)
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {exercises.filter(ex => ex.status === 'completed').length} completed
        </div>
      </div>

      {/* Exercises List - Shown when expanded */}
      {isOpen && (
        <div className="divide-y">
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/30"
            >
              <div className="flex items-center gap-2">
                {exercise.status === 'completed' ? (
                  <Check size={18} className="text-green-500" />
                ) : exercise.status === 'in-progress' ? (
                  <div className="h-4 w-4 rounded-full bg-amber-400" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-muted-foreground" />
                )}
                <span>{exercise.title}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPracticeExercise(exercise.id)}
                >
                  Practice
                </Button>
                {exercise.status !== 'completed' && exercise.status !== 'in-progress' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAddExercise(exercise.id)}
                  >
                    <Plus size={16} className="mr-1" />
                    Add
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CurriculumTagGroup;