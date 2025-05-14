
import React from 'react';
import { Exercise } from '@/types';
import ExerciseCard from '@/components/ExerciseCard';
import CreateExerciseCard from '@/components/exercises/CreateExerciseCard';

// Define the component props interface
export interface ExerciseGridProps {
  limit?: number;
  showHeader?: boolean;
  paginatedExercises?: Exercise[];
  exercisesPerPage?: number;
  onPractice?: (exercise: Exercise) => void;
  onEdit?: (exercise: Exercise) => void;
  onDelete?: (exercise: Exercise) => void;
  onMove?: (exercise: Exercise) => void;
  onCreateClick?: () => void;
  canEdit?: boolean;
}

const ExerciseGrid: React.FC<ExerciseGridProps> = ({ 
  limit, 
  showHeader = true,
  paginatedExercises,
  exercisesPerPage,
  onPractice,
  onEdit,
  onDelete,
  onMove,
  onCreateClick,
  canEdit
}) => {
  // Simple mode (for HomePage)
  if (!paginatedExercises) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {showHeader && <h3>Exercise Grid</h3>}
        {/* Exercise content would go here */}
        <div>Exercise Card (Limit: {limit || 'unlimited'})</div>
      </div>
    );
  }
  
  // Advanced mode (for ExercisesPage)
  // Fill array to maintain grid layout
  const fillerCount = Math.max(0, (exercisesPerPage || 0) - paginatedExercises.length - 1);
  const fillers = Array(fillerCount).fill(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {paginatedExercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onPractice={() => onPractice && onPractice(exercise)}
          onEdit={() => onEdit && onEdit(exercise)}
          onDelete={() => onDelete && onDelete(exercise)}
          onMove={() => onMove && onMove(exercise)}
          canEdit={!!canEdit}
          canMove={true} // Allow moving for all users
        />
      ))}
      
      {onCreateClick && <CreateExerciseCard onClick={onCreateClick} />}
      
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
