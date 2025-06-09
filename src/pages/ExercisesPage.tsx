import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useDirectoryContext } from '@/contexts/DirectoryContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Archive, Unarchive, Move, Edit, Trash2, Play } from 'lucide-react';
import { ExerciseFormModal } from '@/components/ExerciseFormModal';
import { PracticeModal } from '@/components/PracticeModal';
import { MoveExerciseModal } from '@/components/MoveExerciseModal';
import { DeleteExerciseDialog } from '@/components/DeleteExerciseDialog';
import { PaginationControls } from '@/components/PaginationControls';
import { FilterBar } from '@/components/FilterBar';
import { ExerciseGrid } from '@/components/ExerciseGrid';
import { CreateExerciseCard } from '@/components/exercises/CreateExerciseCard';
import BidirectionalMethodLink from '@/components/exercises/BidirectionalMethodLink';

const ExercisesPage: React.FC = () => {
  const { user } = useAuth();
  const {
    exercises,
    createExercise,
    updateExercise,
    deleteExercise,
    toggleArchiveExercise,
    moveExercise,
    startPractice,
    completeExercise,
    loadExercises,
  } = useExerciseContext();
  const { directories, loadDirectories } = useDirectoryContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedDirectory, setSelectedDirectory] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [practiceExercise, setPracticeExercise] = useState(null);
  const [moveExerciseData, setMoveExerciseData] = useState(null);
  const [deleteExerciseId, setDeleteExerciseId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const exercisesPerPage = 12;

  useEffect(() => {
    if (user) {
      loadExercises(user.id, searchTerm, selectedLanguage, selectedDirectory, showArchived);
      loadDirectories(user.id);
    }
  }, [user, loadExercises, loadDirectories, searchTerm, selectedLanguage, selectedDirectory, showArchived]);

  const availableLanguages = [...new Set(exercises.map(exercise => exercise.language))];

  const onCreateExercise = async (newExercise) => {
    if (user) {
      await createExercise({ ...newExercise, user_id: user.id });
    }
  };

  const onSaveExercise = async (exerciseToSave) => {
    await updateExercise(exerciseToSave);
  };

  const handleDeleteExercise = (exerciseId) => {
    setDeleteExerciseId(exerciseId);
  };

  const confirmDeleteExercise = async () => {
    if (deleteExerciseId) {
      await deleteExercise(deleteExerciseId);
      setDeleteExerciseId(null);
    }
  };

  const handleToggleArchive = async (exercise) => {
    await toggleArchiveExercise(exercise);
  };

  const handleMoveExercise = (exercise) => {
    setMoveExerciseData({ exercise });
  };

  const confirmMoveExercise = async (directoryId) => {
    if (moveExerciseData) {
      await moveExercise(moveExerciseData.exercise, directoryId);
      setMoveExerciseData(null);
    }
  };

  const handlePractice = (exercise) => {
    setPracticeExercise(exercise);
    startPractice(exercise);
  };

  const onCompleteExercise = async (exercise) => {
    await completeExercise(exercise);
    setPracticeExercise(null);
  };

  const totalPages = Math.ceil(exercises.length / exercisesPerPage);
  const paginatedExercises = exercises.slice(
    (currentPage - 1) * exercisesPerPage,
    currentPage * exercisesPerPage
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Exercises</h1>
        <p className="text-muted-foreground">
          Practice your language skills with different exercise types
        </p>
      </div>

      {/* Exercise Types */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <CreateExerciseCard />
        <BidirectionalMethodLink />
        {/* Add more exercise type cards here as needed */}
      </div>

      {/* Search and Filter Bar */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        selectedDirectory={selectedDirectory}
        onDirectoryChange={setSelectedDirectory}
        directories={directories}
        availableLanguages={availableLanguages}
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
      />

      {/* Default Exercises Section */}
      <CreateExerciseCard 
        onCreateExercise={onCreateExercise}
        selectedLanguage={selectedLanguage}
      />

      {/* Exercises Grid */}
      <ExerciseGrid
        exercises={paginatedExercises}
        onEdit={setEditingExercise}
        onDelete={handleDeleteExercise}
        onToggleArchive={handleToggleArchive}
        onMove={handleMoveExercise}
        onPractice={handlePractice}
        directories={directories}
      />

      {/* Pagination */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modals */}
      <ExerciseFormModal
        isOpen={!!editingExercise}
        onClose={() => setEditingExercise(null)}
        exercise={editingExercise}
        onSave={onSaveExercise}
        directories={directories}
      />

      <PracticeModal
        exercise={practiceExercise}
        isOpen={!!practiceExercise}
        onClose={() => setPracticeExercise(null)}
        onComplete={onCompleteExercise}
      />

      <MoveExerciseModal
        isOpen={!!moveExerciseData}
        onClose={() => setMoveExerciseData(null)}
        onMove={confirmMoveExercise}
        directories={directories}
        currentDirectoryId={moveExerciseData?.exercise.directory_id}
      />

      <DeleteExerciseDialog
        isOpen={!!deleteExerciseId}
        onClose={() => setDeleteExerciseId(null)}
        onConfirm={confirmDeleteExercise}
      />
    </div>
  );
};

export default ExercisesPage;
