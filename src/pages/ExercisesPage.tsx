import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useDirectoryContext } from '@/contexts/DirectoryContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useBidirectionalReviews } from '@/hooks/use-bidirectional-reviews';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Archive, Move, Edit, Trash2, Play, ArrowLeftRight, Mic } from 'lucide-react';
import { ExerciseFormModal } from '@/components/exercises/ExerciseFormModal';
import PracticeModal from '@/components/exercises/PracticeModal';
import MoveExerciseModal from '@/components/MoveExerciseModal';
import DeleteExerciseDialog from '@/components/exercises/DeleteExerciseDialog';
import PaginationControls from '@/components/exercises/PaginationControls';
import FilterBar from '@/components/exercises/FilterBar';
import ExerciseGrid from '@/components/exercises/ExerciseGrid';
import CreateExerciseCard from '@/components/exercises/CreateExerciseCard';
import BidirectionalPage from './BidirectionalPage';
import PopoverHint from '@/components/PopoverHint';

const ExercisesPage: React.FC = () => {
  const { user } = useAuth();
  const {
    exercises,
    addExercise,
    updateExercise,
    deleteExercise,
    markProgress,
    refreshExercises,
    loading,
  } = useExerciseContext();
  const { directories } = useDirectoryContext();
  const { settings } = useUserSettingsContext();
  const { dueReviewsCount } = useBidirectionalReviews();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState(null);
  const [practiceExercise, setPracticeExercise] = useState(null);
  const [moveExerciseData, setMoveExerciseData] = useState(null);
  const [deleteExerciseId, setDeleteExerciseId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const exercisesPerPage = 12;

  useEffect(() => {
    if (user) {
      refreshExercises();
    }
  }, [user, refreshExercises]);

  // Filter exercises by selected language, search term and selected tag
  const filteredExercises = exercises.filter(exercise => {
    const matchesLanguage = exercise.language === settings.selectedLanguage;
    const matchesSearch = exercise.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || exercise.tags.includes(selectedTag);
    return matchesLanguage && matchesSearch && matchesTag;
  });

  // Get all unique tags from exercises of the selected language
  const allTags = [...new Set(
    exercises
      .filter(exercise => exercise.language === settings.selectedLanguage)
      .flatMap(exercise => exercise.tags)
  )];

  const onCreateExercise = () => {
    setIsCreating(true);
  };

  const onSaveExercise = async (exerciseToSave) => {
    if (exerciseToSave.id) {
      await updateExercise(exerciseToSave.id, exerciseToSave);
    } else {
      await addExercise(exerciseToSave);
    }
  };

  const handleDeleteExercise = (exercise) => {
    setDeleteExerciseId(exercise.id);
  };

  const confirmDeleteExercise = async () => {
    if (deleteExerciseId) {
      await deleteExercise(deleteExerciseId);
      setDeleteExerciseId(null);
    }
  };

  const handleToggleArchive = async (exercise) => {
    await updateExercise(exercise.id, { archived: !exercise.archived });
  };

  const handleMoveExercise = (exercise) => {
    setMoveExerciseData(exercise);
  };

  const confirmMoveExercise = async (directoryId) => {
    if (moveExerciseData) {
      await updateExercise(moveExerciseData.id, { directoryId });
      setMoveExerciseData(null);
    }
  };

  const handlePractice = (exercise) => {
    setPracticeExercise(exercise);
  };

  const onCompleteExercise = async (accuracy) => {
    if (practiceExercise) {
      await markProgress(practiceExercise.id, accuracy);
      // Don't close the modal here - let the user close it manually
      // The modal will stay open to show results
    }
  };

  const totalPages = Math.ceil(filteredExercises.length / exercisesPerPage);
  const paginatedExercises = filteredExercises.slice(
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

      <Tabs defaultValue="dictation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dictation" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Dictation Method
          </TabsTrigger>
          <TabsTrigger value="bidirectional" className="flex items-center gap-2 relative">
            <ArrowLeftRight className="h-4 w-4" />
            Bidirectional Method
            {dueReviewsCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-5 text-xs">
                {dueReviewsCount}
              </Badge>
            )}
            <PopoverHint className="ml-1" triggerClassName="text-muted-foreground/60 hover:text-muted-foreground">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">How the Bidirectional Method works:</h4>
                  <ul className="text-sm space-y-2 list-disc list-inside">
                    <li><strong>Forward practice:</strong> Translate from your native language to your target language</li>
                    <li><strong>Backward practice:</strong> Translate from your target language back to your native language</li>
                    <li><strong>Spaced repetition:</strong> Review sentences at optimal intervals for long-term retention</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Getting the most out of it:</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Practice daily for best results</li>
                    <li>Focus on accuracy over speed</li>
                    <li>Review difficult sentences more frequently</li>
                    <li>Use both literal and natural translations</li>
                  </ul>
                </div>
              </div>
            </PopoverHint>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dictation" className="space-y-6">
          {/* Exercise Types */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <CreateExerciseCard onClick={onCreateExercise} />
            {/* Add more exercise type cards here as needed */}
          </div>

          {/* Search and Filter Bar */}
          <FilterBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
            allTags={allTags}
          />

          {/* Exercises Grid */}
          <ExerciseGrid
            paginatedExercises={paginatedExercises}
            exercisesPerPage={exercisesPerPage}
            onPractice={handlePractice}
            onEdit={setEditingExercise}
            onDelete={handleDeleteExercise}
            onMove={handleMoveExercise}
            onCreateClick={onCreateExercise}
            canEdit={true}
          />

          {/* Pagination */}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </TabsContent>

        <TabsContent value="bidirectional">
          <BidirectionalPage />
        </TabsContent>
      </Tabs>

      {/* Modals for Dictation Method */}
      <ExerciseFormModal
        isOpen={isCreating || !!editingExercise}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setEditingExercise(null);
          }
        }}
        initialValues={editingExercise}
        mode={editingExercise ? 'edit' : 'create'}
      />

      <PracticeModal
        exercise={practiceExercise}
        isOpen={!!practiceExercise}
        onOpenChange={(open) => !open && setPracticeExercise(null)}
        onComplete={onCompleteExercise}
      />

      <MoveExerciseModal
        exercise={moveExerciseData}
        isOpen={!!moveExerciseData}
        onOpenChange={(open) => !open && setMoveExerciseData(null)}
        onSuccess={() => setMoveExerciseData(null)}
      />

      <DeleteExerciseDialog
        isOpen={!!deleteExerciseId}
        onOpenChange={(open) => !open && setDeleteExerciseId(null)}
        onConfirm={confirmDeleteExercise}
      />
    </div>
  );
};

export default ExercisesPage;
