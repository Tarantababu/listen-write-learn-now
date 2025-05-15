
import React, { useState } from 'react';
import { CurriculaList } from './CurriculaList';
import { CurriculumDetail } from './CurriculumDetail';

/**
 * CurriculumEditor component for managing curriculum paths and nodes in the admin dashboard
 */
export const CurriculumEditor: React.FC = () => {
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string | null>(null);

  const handleSelectCurriculum = (id: string) => {
    setSelectedCurriculumId(id);
  };

  const handleBackToCurricula = () => {
    setSelectedCurriculumId(null);
  };

  return (
    <div className="space-y-6">
      {selectedCurriculumId ? (
        <CurriculumDetail 
          curriculumId={selectedCurriculumId} 
          onBack={handleBackToCurricula} 
        />
      ) : (
        <CurriculaList onSelectCurriculum={handleSelectCurriculum} />
      )}
    </div>
  );
};

export default CurriculumEditor;
