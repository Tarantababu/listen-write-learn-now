
import React from 'react';
import { Exercise } from '@/types';
import ExerciseCard from '@/components/ExerciseCard';
import CreateExerciseCard from '@/components/exercises/CreateExerciseCard';
import { useExerciseContext } from '@/contexts/ExerciseContext';

interface ExerciseGridProps {
  paginatedExercises: Exercise[];
  exercisesPerPage: number;
  onPractice: (exercise: Exercise) => void;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
  onCreateClick: () => void;
  canEdit?: boolean;
}

const ExerciseGrid = ({
  paginatedExercises,
  exercisesPerPage,
  onPractice,
  onEdit,
  onDelete,
  onCreateClick,
  canEdit = true
}: ExerciseGridProps) => {
  const { canCreateMore } = useExerciseContext();
  
  // Calculate empty slots for grid layout
  const emptySlots = exercisesPerPage - paginatedExercises.length - (canCreateMore ? 1 : 0);
  const emptySlotArray = emptySlots > 0 ? Array(emptySlots).fill(null) : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-6">
      {paginatedExercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onPractice={() => onPractice(exercise)}
          onEdit={() => onEdit(exercise)}
          onDelete={() => onDelete(exercise)}
          disableEdit={!canEdit}
        />
      ))}
      
      {/* Only show the create card if the user can create more */}
      {canCreateMore && (
        <CreateExerciseCard onClick={onCreateClick} />
      )}
      
      {/* Empty slots for grid layout */}
      {emptySlotArray.map((_, index) => (
        <div key={`empty-${index}`} className="border border-dashed rounded-lg p-6 h-full invisible"></div>
      ))}
    </div>
  );
};

export default ExerciseGrid;
