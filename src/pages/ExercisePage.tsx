
import React from 'react';
import { useParams } from 'react-router-dom';
import ExerciseContent from '@/components/ExerciseContent';

const ExercisePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <ExerciseContent exerciseId={id || ''} />
    </div>
  );
};

export default ExercisePage;
