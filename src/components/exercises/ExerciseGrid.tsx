
import React from 'react';

// Define the component props interface
export interface ExerciseGridProps {
  limit?: number;
  showHeader?: boolean;
}

const ExerciseGrid: React.FC<ExerciseGridProps> = ({ limit, showHeader = true }) => {
  // Just creating a stub component to ensure type compatibility
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {showHeader && <h3>Exercise Grid</h3>}
      {/* Exercise content would go here */}
      <div>Exercise Card (Limit: {limit || 'unlimited'})</div>
    </div>
  );
};

export default ExerciseGrid;
