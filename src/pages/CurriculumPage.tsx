
import React, { useEffect } from 'react';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useCurriculumExercises } from '@/hooks/use-curriculum-exercises';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import UnitAccordion from '@/components/curriculum/UnitAccordion';
import CurriculumSidebar from '@/components/curriculum/CurriculumSidebar';

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
  useEffect(() => {
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
  
  // Calculate total lessons and completed lessons across all units
  const totalLessons = stats.total;
  const completedLessons = stats.completed;
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Greeting Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your {selectedLanguage} Learning Plan</h1>
        <p className="text-muted-foreground">
          Follow the structured curriculum to build your {selectedLanguage} skills step by step.
        </p>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="learning-plan" className="mb-8">
        <TabsList>
          <TabsTrigger value="learning-plan">Learning plan</TabsTrigger>
          <TabsTrigger value="skills" disabled>Skills</TabsTrigger>
          <TabsTrigger value="achievements" disabled>Achievements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="learning-plan" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Units and Lessons */}
            <div className="lg:col-span-2 space-y-8">
              {/* Units */}
              {Object.entries(exercisesByTag).map(([tag, exercises], index) => (
                <UnitAccordion
                  key={tag}
                  unitNumber={index + 1}
                  title={tag}
                  lessons={exercises}
                  onPracticeExercise={handlePracticeExercise}
                  onAddExercise={handleAddExercise}
                />
              ))}
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <CurriculumSidebar
                totalLessons={totalLessons}
                completedLessons={completedLessons}
                language={selectedLanguage}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CurriculumPage;
