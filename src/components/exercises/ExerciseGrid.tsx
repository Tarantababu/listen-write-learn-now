
import React from 'react';
import { Exercise } from '@/types';
import ExerciseCard from '@/components/ExerciseCard';
import CreateExerciseCard from '@/components/exercises/CreateExerciseCard';

interface ExerciseGridProps {
  paginatedExercises: Exercise[];
  exercisesPerPage: number;
  onPractice: (exercise: Exercise) => void;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
  onMove: (exercise: Exercise) => void;
  onCreateClick: () => void;
  canEdit: boolean;
}

// Memoized component to prevent unnecessary re-renders
const ExerciseGrid: React.FC<ExerciseGridProps> = React.memo(({
  paginatedExercises,
  exercisesPerPage,
  onPractice,
  onEdit,
  onDelete,
  onMove,
  onCreateClick,
  canEdit
}) => {
  // Memoize filler count calculation
  const fillerCount = React.useMemo(() => 
    Math.max(0, exercisesPerPage - paginatedExercises.length - 1), 
    [exercisesPerPage, paginatedExercises.length]
  );
  
  // Memoize fillers array
  const fillers = React.useMemo(() => 
    Array(fillerCount).fill(null), 
    [fillerCount]
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {paginatedExercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onPractice={() => onPractice(exercise)}
          onEdit={() => onEdit(exercise)}
          onDelete={() => onDelete(exercise)}
          onMove={() => onMove(exercise)}
          canEdit={canEdit}
          canMove={true}
        />
      ))}
      
      {fillers.map((_, index) => (
        <div 
          key={`filler-${index}`} 
          className="border border-dashed rounded-md h-60 border-transparent" 
        />
      ))}
    </div>
  );
});

ExerciseGrid.displayName = 'ExerciseGrid';

export default ExerciseGrid;
