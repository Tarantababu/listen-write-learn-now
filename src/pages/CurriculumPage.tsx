import React from 'react';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import CurriculumProgressSummary from '@/components/curriculum/CurriculumProgressSummary';
import CurriculumTagGroup from '@/components/curriculum/CurriculumTagGroup';
import { useCurriculumExercises } from '@/hooks/use-curriculum-exercises';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const CurriculumPage: React.FC = () => {
  const { copyDefaultExercise } = useExerciseContext();
  const { 
    exercisesByTag, 
    stats, 
    loading, 
    selectedLanguage,
    refreshData
  } = useCurriculumExercises();
  const navigate = useNavigate();
  
  // Refresh data when the component mounts
  React.useEffect(() => {
    console.log("CurriculumPage: Refreshing data on mount");
    refreshData();
  }, [refreshData]);
  
  const handlePracticeExercise = async (id: string) => {
    console.log(`Opening practice for exercise with ID: ${id}`);
    // Navigate to exercises page with the exercise ID as a parameter
    navigate(`/dashboard/exercises?defaultExerciseId=${id}&action=practice`);
  };
  
  const handleAddExercise = async (id: string) => {
    try {
      await copyDefaultExercise(id);
      // After adding, refresh the data to update the exercise status
      refreshData();
      toast.success('Exercise added to your list');
    } catch (error) {
      console.error('Error copying exercise:', error);
      toast.error('Failed to add exercise to your list');
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div>
        </div>
      </div>
    );
  }
  
  if (Object.keys(exercisesByTag).length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">
            No curriculum exercises available for {selectedLanguage}.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* Progress Summary */}
        <CurriculumProgressSummary
          totalExercises={stats.total}
          completedExercises={stats.completed}
          inProgressExercises={stats.inProgress}
          language={selectedLanguage}
        />
        
        {/* Tag Groups */}
        <div className="space-y-4">
          {Object.entries(exercisesByTag).map(([tag, exercises]) => (
            <CurriculumTagGroup
              key={tag}
              tag={tag}
              exercises={exercises || []}
              defaultOpen={false} // Add this prop to control the default state
              onPracticeExercise={handlePracticeExercise}
              onAddExercise={handleAddExercise}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CurriculumPage;