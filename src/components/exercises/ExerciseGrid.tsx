
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

const ExerciseGrid: React.FC<ExerciseGridProps> = ({
  paginatedExercises,
  exercisesPerPage,
  onPractice,
  onEdit,
  onDelete,
  onMove,
  onCreateClick,
  canEdit
}) => {
  // Fill array to maintain grid layout
  const fillerCount = Math.max(0, exercisesPerPage - paginatedExercises.length - 1);
  const fillers = Array(fillerCount).fill(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {paginatedExercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onPractice={() => onPractice(exercise)}
          onEdit={() => onEdit(exercise)}
          onDelete={() => onDelete(exercise)}
          onMove={() => onMove(exercise)} // Moving is now available for all users
          canEdit={canEdit}
          canMove={true} // Allow moving for all users
        />
      ))}
      
      <CreateExerciseCard onClick={onCreateClick} />
      
      {fillers.map((_, index) => (
        <div 
          key={`filler-${index}`} 
          className="border border-dashed rounded-md h-60 border-transparent" 
        />
      ))}
    </div>
  );
};

export default ExerciseGrid;
