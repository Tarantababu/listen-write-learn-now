import React, { useEffect, useState } from 'react';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useCurriculumExercises } from '@/hooks/use-curriculum-exercises';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import UnitAccordion from '@/components/curriculum/UnitAccordion';
import CurriculumSidebar from '@/components/curriculum/CurriculumSidebar';
import PracticeModal from '@/components/exercises/PracticeModal';

const CurriculumPage: React.FC = () => {
  const {
    copyDefaultExercise,
    exercises,
    markProgress
  } = useExerciseContext();
  const {
    exercisesByTag,
    stats,
    loading,
    selectedLanguage,
    refreshData
  } = useCurriculumExercises();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [practiceExercise, setPracticeExercise] = useState(null);

  // Get URL parameters
  const tabParam = searchParams.get('tab') || 'learning-plan';
  const openTagParam = searchParams.get('openTag');

  // Refresh data when the component mounts
  useEffect(() => {
    console.log("CurriculumPage: Refreshing data on mount");
    refreshData();
  }, [refreshData]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', value);
    setSearchParams(newSearchParams);
  };

  // Function to find the next exercise in the same tag
  const findNextExercise = (currentExerciseId: string, currentTag: string) => {
    const exercisesInTag = exercisesByTag[currentTag] || [];
    const currentIndex = exercisesInTag.findIndex(ex => ex.id === currentExerciseId);
    
    if (currentIndex !== -1 && currentIndex < exercisesInTag.length - 1) {
      return exercisesInTag[currentIndex + 1];
    }
    
    return null;
  };

  const handlePracticeExercise = async (id: string, tag?: string) => {
    console.log(`Opening practice for default exercise with ID: ${id}`);
    
    // For curriculum exercises, we need to find the user's copy by default_exercise_id
    // The 'id' parameter here is actually the default exercise ID from the curriculum
    const userExercise = exercises.find(ex => ex.default_exercise_id === id);
    
    if (userExercise) {
      console.log('Found user exercise, opening practice modal:', userExercise.id);
      // Open the practice modal directly with the user's exercise
      setPracticeExercise(userExercise);
    } else {
      console.log('User exercise not found, redirecting to exercises page');
      // If exercise not found in user's exercises, navigate to exercises page as fallback
      const params = new URLSearchParams({
        defaultExerciseId: id,
        action: 'practice'
      });
      
      // Find if there's a next exercise for navigation
      if (tag) {
        const nextExercise = findNextExercise(id, tag);
        if (nextExercise && nextExercise.status === 'not-started') {
          params.set('nextExerciseId', nextExercise.id);
        }
      }
      
      navigate(`/dashboard/exercises?${params.toString()}`);
    }
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

  const onCompleteExercise = async (accuracy: number) => {
    if (practiceExercise) {
      await markProgress(practiceExercise.id, accuracy);
      // Don't close the modal here - let the user close it manually
      // Refresh data to update the curriculum progress
      refreshData();
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div>
        </div>
      </div>;
  }
  
  if (Object.keys(exercisesByTag).length === 0) {
    return <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">
            No learning plan exercises available for {selectedLanguage}.
          </p>
        </div>
      </div>;
  }

  // Calculate total lessons and completed lessons across all units
  const totalLessons = stats.total;
  const completedLessons = stats.completed;

  // Filter in-progress exercises
  const inProgressTagMap: Record<string, any[]> = {};
  Object.entries(exercisesByTag).forEach(([tag, exercises]) => {
    const inProgressExercises = exercises.filter(ex => ex.status === 'in-progress');
    if (inProgressExercises.length > 0) {
      inProgressTagMap[tag] = inProgressExercises;
    }
  });
  const hasInProgressExercises = Object.keys(inProgressTagMap).length > 0;
  
  return (
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Greeting Section */}
        
        
        {/* Tabs */}
        <Tabs value={tabParam} onValueChange={handleTabChange} className="mb-8">
          <TabsList>
            <TabsTrigger value="learning-plan">Learning plan</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
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
                    onPracticeExercise={(id) => handlePracticeExercise(id, tag)}
                    onAddExercise={handleAddExercise}
                    defaultOpen={openTagParam === tag}
                  />
                ))}
              </div>
              
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <CurriculumSidebar totalLessons={totalLessons} completedLessons={completedLessons} language={selectedLanguage} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="in-progress" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content - Units and Lessons */}
              <div className="lg:col-span-2 space-y-8">
                {hasInProgressExercises ?
              // Units with in-progress exercises
              Object.entries(inProgressTagMap).map(([tag, exercises], index) => (
                <UnitAccordion 
                  key={tag} 
                  unitNumber={index + 1} 
                  title={tag} 
                  lessons={exercises} 
                  onPracticeExercise={(id) => handlePracticeExercise(id, tag)}
                  onAddExercise={handleAddExercise}
                  defaultOpen={openTagParam === tag}
                />
              )) : <div className="text-center py-16">
                    <p className="text-lg text-muted-foreground">
                      You don't have any in-progress lessons yet.
                    </p>
                    <p className="text-muted-foreground mt-2">
                      Start a lesson from the Learning Plan to see it here.
                    </p>
                  </div>}
              </div>
              
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <CurriculumSidebar totalLessons={totalLessons} completedLessons={completedLessons} language={selectedLanguage} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Practice Modal */}
      <PracticeModal
        exercise={practiceExercise}
        isOpen={!!practiceExercise}
        onOpenChange={(open) => !open && setPracticeExercise(null)}
        onComplete={onCompleteExercise}
      />
    </>
  );
};

export default CurriculumPage;
