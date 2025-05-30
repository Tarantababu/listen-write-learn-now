import React, { useEffect, useState } from 'react';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useCurriculumExercises } from '@/hooks/use-curriculum-exercises';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import UnitAccordion from '@/components/curriculum/UnitAccordion';
import CurriculumSidebar from '@/components/curriculum/CurriculumSidebar';
import PracticeModal from '@/components/exercises/PracticeModal';
import { Exercise } from '@/types';
import { CurriculumExercise } from '@/components/curriculum/CurriculumTagGroup';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';

const CurriculumPage: React.FC = () => {
  const {
    copyDefaultExercise,
    markProgress
  } = useExerciseContext();
  const {
    exercisesByTag,
    stats,
    loading,
    selectedLanguage,
    refreshData
  } = useCurriculumExercises();
  const { settings } = useUserSettingsContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Practice modal state
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [exerciseToPractice, setExerciseToPractice] = useState<Exercise | null>(null);
  const [nextExerciseId, setNextExerciseId] = useState<string | null>(null);

  // Get URL parameters
  const tabParam = searchParams.get('tab') || 'learning-plan';
  const openTagParam = searchParams.get('openTag');
  const defaultExerciseId = searchParams.get('defaultExerciseId');
  const action = searchParams.get('action');
  const nextExerciseParam = searchParams.get('nextExerciseId');

  // Helper function to convert CurriculumExercise to Exercise
  const convertCurriculumExerciseToExercise = (curriculumExercise: CurriculumExercise): Exercise => {
    return {
      id: curriculumExercise.id,
      title: curriculumExercise.title,
      text: curriculumExercise.text,
      language: settings.selectedLanguage,
      tags: curriculumExercise.tags,
      directoryId: null,
      createdAt: new Date(curriculumExercise.createdAt),
      completionCount: curriculumExercise.completionCount,
      isCompleted: curriculumExercise.status === 'completed'
    };
  };

  // Refresh data when the component mounts
  useEffect(() => {
    console.log("CurriculumPage: Refreshing data on mount");
    refreshData();
  }, [refreshData]);

  // Handle URL parameters for practicing exercises
  useEffect(() => {
    const handleExerciseFromURL = async () => {
      if (defaultExerciseId && action === 'practice') {
        try {
          console.log(`Processing exercise from URL: ${defaultExerciseId}, next: ${nextExerciseParam}`);
          
          // Find the exercise in the exercises list
          const exerciseToOpen = Object.values(exercisesByTag)
            .flat()
            .find(ex => ex.id === defaultExerciseId);
          
          if (exerciseToOpen) {
            setExerciseToPractice(convertCurriculumExerciseToExercise(exerciseToOpen));
            setNextExerciseId(nextExerciseParam);
            setIsPracticeModalOpen(true);
            
            // Clear the URL parameters
            navigate('/dashboard/learning-plan', { replace: true });
          }
        } catch (error) {
          console.error('Error processing exercise from URL:', error);
          toast.error('Failed to open the exercise');
        }
      }
    };
    
    if (!loading && Object.keys(exercisesByTag).length > 0) {
      handleExerciseFromURL();
    }
  }, [defaultExerciseId, action, nextExerciseParam, exercisesByTag, loading, navigate, settings.selectedLanguage]);

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
    console.log(`Opening practice for exercise with ID: ${id}`);
    
    // Find the exercise
    const exercise = Object.values(exercisesByTag)
      .flat()
      .find(ex => ex.id === id);
    
    if (!exercise) {
      toast.error('Exercise not found');
      return;
    }

    // Find if there's a next exercise for navigation
    let nextExercise = null;
    if (tag) {
      nextExercise = findNextExercise(id, tag);
      // Only show next if it's not started
      if (nextExercise && nextExercise.status !== 'not-started') {
        nextExercise = null;
      }
    }
    
    setExerciseToPractice(convertCurriculumExerciseToExercise(exercise));
    setNextExerciseId(nextExercise?.id || null);
    setIsPracticeModalOpen(true);
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

  const handlePracticeComplete = (accuracy: number) => {
    if (!exerciseToPractice) return;
    markProgress(exerciseToPractice.id, accuracy);
    
    if (accuracy >= 95) {
      const updatedCompletionCount = exerciseToPractice.completionCount + 1;
      if (updatedCompletionCount >= 3 && !exerciseToPractice.isCompleted) {
        toast.success('Congratulations! You have mastered this exercise!');
      } else {
        toast.success(`Great job! ${3 - updatedCompletionCount} more successful attempts until mastery.`);
      }
    }
  };

  const handleNextExercise = () => {
    if (!nextExerciseId) return;
    
    // Find the next exercise
    const nextExercise = Object.values(exercisesByTag)
      .flat()
      .find(ex => ex.id === nextExerciseId);
    
    if (nextExercise) {
      // Find the tag for next exercise navigation
      const nextExerciseTag = Object.keys(exercisesByTag).find(tag => 
        exercisesByTag[tag].some(ex => ex.id === nextExerciseId)
      );
      
      // Find the next exercise after this one
      let nextNextExercise = null;
      if (nextExerciseTag) {
        nextNextExercise = findNextExercise(nextExerciseId, nextExerciseTag);
        if (nextNextExercise && nextNextExercise.status !== 'not-started') {
          nextNextExercise = null;
        }
      }
      
      setExerciseToPractice(convertCurriculumExerciseToExercise(nextExercise));
      setNextExerciseId(nextNextExercise?.id || null);
      // Keep the modal open for the next exercise
    }
  };

  const handlePracticeModalClose = (open: boolean) => {
    setIsPracticeModalOpen(open);
    if (!open) {
      setTimeout(() => {
        setExerciseToPractice(null);
        setNextExerciseId(null);
        refreshData();
        
        // Navigate to in-progress tab if exercise was completed from learning plan
        if (exerciseToPractice && exerciseToPractice.completionCount < 3) {
          setSearchParams({ tab: 'in-progress' });
        }
      }, 300);
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
  
  return <div className="container mx-auto px-4 py-8">
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
      
      {/* Practice Modal */}
      {exerciseToPractice && (
        <PracticeModal
          isOpen={isPracticeModalOpen}
          onOpenChange={handlePracticeModalClose}
          exercise={exerciseToPractice}
          onComplete={handlePracticeComplete}
          onNextExercise={nextExerciseId ? handleNextExercise : undefined}
          hasNextExercise={!!nextExerciseId}
          isFromLearningPlan={true}
        />
      )}
    </div>;
};

export default CurriculumPage;
