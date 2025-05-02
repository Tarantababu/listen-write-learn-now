
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
  onCreateClick: () => void;
}

const ExerciseGrid: React.FC<ExerciseGridProps> = ({
  paginatedExercises,
  exercisesPerPage,
  onPractice,
  onEdit,
  onDelete,
  onCreateClick
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr mb-6">
      {paginatedExercises.map(exercise => (
        <div key={exercise.id} className="h-full">
          <ExerciseCard
            exercise={exercise}
            onPractice={() => onPractice(exercise)}
            onEdit={() => onEdit(exercise)}
            onDelete={() => onDelete(exercise)}
          />
        </div>
      ))}
      
      {/* Create New Exercise Card - only show if we have room for it */}
      {paginatedExercises.length < exercisesPerPage && (
        <CreateExerciseCard onClick={onCreateClick} />
      )}
    </div>
  );
};

export default ExerciseGrid;
