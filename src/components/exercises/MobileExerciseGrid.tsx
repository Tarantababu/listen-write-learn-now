
import React from 'react';
import { Exercise } from '@/types';
import ExerciseCard from '@/components/ExerciseCard';
import CreateExerciseCard from '@/components/exercises/CreateExerciseCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileExerciseGridProps {
  paginatedExercises: Exercise[];
  exercisesPerPage: number;
  onPractice: (exercise: Exercise) => void;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
  onMove: (exercise: Exercise) => void;
  onCreateClick: () => void;
  canEdit: boolean;
}

export const MobileExerciseGrid: React.FC<MobileExerciseGridProps> = React.memo(({
  paginatedExercises,
  exercisesPerPage,
  onPractice,
  onEdit,
  onDelete,
  onMove,
  onCreateClick,
  canEdit
}) => {
  const isMobile = useIsMobile();

  // For mobile, show fewer items per page and adjust grid
  const mobileExercisesPerPage = isMobile ? 6 : exercisesPerPage;
  const displayedExercises = isMobile 
    ? paginatedExercises.slice(0, mobileExercisesPerPage)
    : paginatedExercises;

  const fillerCount = React.useMemo(() => 
    Math.max(0, mobileExercisesPerPage - displayedExercises.length - 1), 
    [mobileExercisesPerPage, displayedExercises.length]
  );
  
  const fillers = React.useMemo(() => 
    Array(fillerCount).fill(null), 
    [fillerCount]
  );

  return (
    <div className={`
      grid gap-4 mb-6
      ${isMobile 
        ? 'grid-cols-1 px-2' 
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      }
    `}>
      {displayedExercises.map((exercise) => (
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
      
      {!isMobile && fillers.map((_, index) => (
        <div 
          key={`filler-${index}`} 
          className="border border-dashed rounded-md h-60 border-transparent" 
        />
      ))}
    </div>
  );
});

MobileExerciseGrid.displayName = 'MobileExerciseGrid';
