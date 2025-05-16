
import React from 'react';
import { useParams } from 'react-router-dom';

const ExercisePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Exercise Details</h1>
      <p>Exercise ID: {id}</p>
      {/* Exercise content will be implemented later */}
    </div>
  );
};

export default ExercisePage;
