
import React from 'react';
import { Exercise } from '@/types';
import ExerciseCard from '@/components/ExerciseCard';
import CreateExerciseCard from '@/components/exercises/CreateExerciseCard';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface ExerciseGridProps {
  paginatedExercises: Exercise[];
  exercisesPerPage: number;
  onPractice: (exercise: Exercise) => void;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
  onMove: (exercise: Exercise) => void;
  onCreateClick: () => void;
  canEdit?: boolean;
}

const ExerciseGrid = ({
  paginatedExercises,
  exercisesPerPage,
  onPractice,
  onEdit,
  onDelete,
  onMove,
  onCreateClick,
  canEdit = true
}: ExerciseGridProps) => {
  const { canCreateMore } = useExerciseContext();
  const isMobile = useIsMobile();
  
  // Calculate empty slots for grid layout - don't show on mobile
  const emptySlots = !isMobile ? exercisesPerPage - paginatedExercises.length - (canCreateMore ? 1 : 0) : 0;
  const emptySlotArray = emptySlots > 0 ? Array(emptySlots).fill(null) : [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 my-4 sm:my-6">
      {/* Show create card first on mobile */}
      {isMobile && canCreateMore && (
        <CreateExerciseCard onClick={onCreateClick} />
      )}
      
      {paginatedExercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onPractice={() => onPractice(exercise)}
          onEdit={() => onEdit(exercise)}
          onDelete={() => onDelete(exercise)}
          onMove={() => onMove(exercise)}
          disableEdit={!canEdit}
        />
      ))}
      
      {/* Show create card last on desktop */}
      {!isMobile && canCreateMore && (
        <CreateExerciseCard onClick={onCreateClick} />
      )}
      
      {/* Empty slots for grid layout - only on desktop */}
      {!isMobile && emptySlotArray.map((_, index) => (
        <div key={`empty-${index}`} className="border border-dashed rounded-lg p-6 h-full invisible"></div>
      ))}
    </div>
  );
};

export default ExerciseGrid;
