
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExerciseGrid from '@/components/exercises/ExerciseGrid';
import FilterBar from '@/components/exercises/FilterBar';
import PaginationControls from '@/components/exercises/PaginationControls';
import { ExerciseFormModal } from '@/components/exercises/ExerciseFormModal';
import PracticeModal from '@/components/exercises/PracticeModal';
import DeleteExerciseDialog from '@/components/exercises/DeleteExerciseDialog';
import DefaultExercisesSection from '@/components/exercises/DefaultExercisesSection';
import { ReadingExercisesSection } from '@/components/reading/ReadingExercisesSection';
import { ShadowingExercisesSection } from '@/components/shadowing/ShadowingExercisesSection';
import BidirectionalExercises from '@/pages/BidirectionalExercises';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import ProtectedRoute from '@/components/ProtectedRoute';

const ExercisesPage: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  const [activeTab, setActiveTab] = useState('dictation');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterTags, setFilterTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    exercises,
    addExercise,
    updateExercise,
    deleteExercise,
  } = useExerciseContext();

  const handleCreateExercise = async (exerciseData: any) => {
    try {
      addExercise(exerciseData);
      setIsFormModalOpen(false);
    } catch (error) {
      console.error('Failed to create exercise:', error);
    }
  };

  const handleUpdateExercise = async (exerciseData: any) => {
    try {
      if (selectedExercise) {
        updateExercise(selectedExercise.id, exerciseData);
        setIsFormModalOpen(false);
        setSelectedExercise(null);
      }
    } catch (error) {
      console.error('Failed to update exercise:', error);
    }
  };

  const handleDeleteExercise = async () => {
    if (exerciseToDelete) {
      try {
        deleteExercise(exerciseToDelete.id);
        setExerciseToDelete(null);
      } catch (error) {
        console.error('Failed to delete exercise:', error);
      }
    }
  };

  const handleEditExercise = (exercise: any) => {
    setSelectedExercise(exercise);
    setIsFormModalOpen(true);
  };

  const handlePracticeExercise = (exercise: any) => {
    setSelectedExercise(exercise);
    setIsPracticeModalOpen(true);
  };

  const handlePracticeComplete = (accuracy: number) => {
    // Handle practice completion - you can add logic here if needed
    console.log('Practice completed with accuracy:', accuracy);
  };

  const filteredExercises = exercises.filter(exercise => 
    exercise.language === settings.selectedLanguage
  );

  // Simple pagination logic
  const exercisesPerPage = 12;
  const totalPages = Math.ceil(filteredExercises.length / exercisesPerPage);
  const startIndex = (currentPage - 1) * exercisesPerPage;
  const paginatedExercises = filteredExercises.slice(startIndex, startIndex + exercisesPerPage);

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Exercises</h1>
          <p className="text-muted-foreground">
            Practice and improve your language skills with various exercise types
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dictation">Dictation</TabsTrigger>
            <TabsTrigger value="reading">Reading</TabsTrigger>
            <TabsTrigger value="shadowing">Shadowing</TabsTrigger>
            <TabsTrigger value="bidirectional">Bidirectional</TabsTrigger>
            <TabsTrigger value="default">Browse</TabsTrigger>
          </TabsList>

          <TabsContent value="dictation" className="space-y-6">
            <FilterBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedTag={null}
              setSelectedTag={() => {}}
              allTags={[]}
            />

            <ExerciseGrid
              paginatedExercises={paginatedExercises}
              exercisesPerPage={exercisesPerPage}
              onPractice={handlePracticeExercise}
              onEdit={handleEditExercise}
              onDelete={setExerciseToDelete}
              onMove={() => {}}
              onCreateClick={() => setIsFormModalOpen(true)}
              canEdit={true}
            />

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </TabsContent>

          <TabsContent value="reading">
            <ReadingExercisesSection />
          </TabsContent>

          <TabsContent value="shadowing">
            <ShadowingExercisesSection />
          </TabsContent>

          <TabsContent value="bidirectional">
            <BidirectionalExercises />
          </TabsContent>

          <TabsContent value="default">
            <DefaultExercisesSection />
          </TabsContent>
        </Tabs>

        <ExerciseFormModal
          isOpen={isFormModalOpen}
          onOpenChange={setIsFormModalOpen}
          initialValues={selectedExercise}
          mode={selectedExercise ? 'edit' : 'create'}
        />

        <PracticeModal
          exercise={selectedExercise}
          isOpen={isPracticeModalOpen}
          onOpenChange={setIsPracticeModalOpen}
          onComplete={handlePracticeComplete}
        />

        <DeleteExerciseDialog
          isOpen={!!exerciseToDelete}
          onOpenChange={(open) => !open && setExerciseToDelete(null)}
          onConfirm={handleDeleteExercise}
        />
      </div>
    </ProtectedRoute>
  );
};

export default ExercisesPage;
