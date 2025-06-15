
import React from 'react';
import { Exercise } from '@/types';
import { ExerciseCard } from '@/components/ExerciseCard';
import LearningOptionsMenu from '@/components/exercises/LearningOptionsMenu';
import CreateExerciseCard from '@/components/exercises/CreateExerciseCard';
import EmptyStateMessage from '@/components/exercises/EmptyStateMessage';

interface ExerciseGridProps {
  paginatedExercises: Exercise[];
  exercisesPerPage: number;
  onPractice: (exercise: Exercise) => void;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
  onMove: (exercise: Exercise) => void;
  onCreateClick: () => void;
  canEdit: boolean;
  audioProgress?: {
    isGenerating: boolean;
    progress: number;
    estimatedTimeRemaining: number;
    stage: 'initializing' | 'processing' | 'uploading' | 'finalizing' | 'complete';
    startProgress: () => void;
    completeProgress: () => void;
    resetProgress: () => void;
  };
}

const ExerciseGrid: React.FC<ExerciseGridProps> = ({
  paginatedExercises,
  exercisesPerPage,
  onPractice,
  onEdit,
  onDelete,
  onMove,
  onCreateClick,
  canEdit,
  audioProgress
}) => {
  const shouldShowCreateCard = paginatedExercises.length < exercisesPerPage;

  if (paginatedExercises.length === 0) {
    return <EmptyStateMessage onCreateClick={onCreateClick} />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {paginatedExercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onPractice={onPractice}
          onEdit={canEdit ? onEdit : undefined}
          onDelete={canEdit ? onDelete : undefined}
          onMove={canEdit ? onMove : undefined}
          audioProgress={audioProgress}
        />
      ))}
      
      {shouldShowCreateCard && canEdit && (
        <CreateExerciseCard onClick={onCreateClick} />
      )}
    </div>
  );
};

export default ExerciseGrid;
