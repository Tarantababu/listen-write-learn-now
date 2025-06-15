import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Plus, Archive, Move, Edit, Trash2, Play, ArrowLeftRight, Mic, BookOpen } from 'lucide-react';
import { ExerciseFormModal } from '@/components/exercises/ExerciseFormModal';
import PracticeModal from '@/components/exercises/PracticeModal';
import MoveExerciseModal from '@/components/MoveExerciseModal';
import DeleteExerciseDialog from '@/components/exercises/DeleteExerciseDialog';
import PaginationControls from '@/components/exercises/PaginationControls';
import FilterBar from '@/components/exercises/FilterBar';
import ExerciseGrid from '@/components/exercises/ExerciseGrid';
import CreateExerciseCard from '@/components/exercises/CreateExerciseCard';
import BidirectionalPage from './BidirectionalPage';
import { ReadingExercisesSection } from '@/components/reading/ReadingExercisesSection';
import PopoverHint from '@/components/PopoverHint';

// Memoized components to prevent unnecessary re-renders
const MemoizedExerciseGrid = React.memo(ExerciseGrid);
const MemoizedBidirectionalPage = React.memo(BidirectionalPage);
const MemoizedFilterBar = React.memo(FilterBar);
const MemoizedPaginationControls = React.memo(PaginationControls);
const ExercisesPage: React.FC = () => {
  const {
    user
  } = useAuth();
  const {
    exercises,
    addExercise,
    updateExercise,
    deleteExercise,
    markProgress,
    refreshExercises,
    loading
  } = useExerciseContext();
  const {
    directories
  } = useDirectoryContext();
  const {
    settings
  } = useUserSettingsContext();
  const {
    dueReviewsCount
  } = useBidirectionalReviews();
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

  // Memoize filtered exercises to prevent unnecessary recalculations
  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      const matchesLanguage = exercise.language === settings.selectedLanguage;
      const matchesSearch = exercise.title.toLowerCase().includes(searchTerm.toLowerCase()) || exercise.text.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = !selectedTag || exercise.tags.includes(selectedTag);
      return matchesLanguage && matchesSearch && matchesTag;
    });
  }, [exercises, settings.selectedLanguage, searchTerm, selectedTag]);

  // Memoize unique tags to prevent unnecessary recalculations
  const allTags = useMemo(() => {
    return [...new Set(exercises.filter(exercise => exercise.language === settings.selectedLanguage).flatMap(exercise => exercise.tags))];
  }, [exercises, settings.selectedLanguage]);

  // Memoize pagination calculations
  const {
    totalPages,
    paginatedExercises
  } = useMemo(() => {
    const total = Math.ceil(filteredExercises.length / exercisesPerPage);
    const paginated = filteredExercises.slice((currentPage - 1) * exercisesPerPage, currentPage * exercisesPerPage);
    return {
      totalPages: total,
      paginatedExercises: paginated
    };
  }, [filteredExercises, currentPage, exercisesPerPage]);

  // Memoized event handlers to prevent unnecessary re-renders
  const onCreateExercise = useCallback(() => {
    setIsCreating(true);
  }, []);
  const onSaveExercise = useCallback(async exerciseToSave => {
    if (exerciseToSave.id) {
      await updateExercise(exerciseToSave.id, exerciseToSave);
    } else {
      await addExercise(exerciseToSave);
    }
  }, [updateExercise, addExercise]);
  const handleDeleteExercise = useCallback(exercise => {
    setDeleteExerciseId(exercise.id);
  }, []);
  const confirmDeleteExercise = useCallback(async () => {
    if (deleteExerciseId) {
      await deleteExercise(deleteExerciseId);
      setDeleteExerciseId(null);
    }
  }, [deleteExerciseId, deleteExercise]);
  const handleToggleArchive = useCallback(async exercise => {
    await updateExercise(exercise.id, {
      archived: !exercise.archived
    });
  }, [updateExercise]);
  const handleMoveExercise = useCallback(exercise => {
    setMoveExerciseData(exercise);
  }, []);
  const confirmMoveExercise = useCallback(async directoryId => {
    if (moveExerciseData) {
      await updateExercise(moveExerciseData.id, {
        directoryId
      });
      setMoveExerciseData(null);
    }
  }, [moveExerciseData, updateExercise]);
  const handlePractice = useCallback(exercise => {
    setPracticeExercise(exercise);
  }, []);
  const onCompleteExercise = useCallback(async accuracy => {
    if (practiceExercise) {
      await markProgress(practiceExercise.id, accuracy);
      // Don't close the modal here - let the user close it manually
      // The modal will stay open to show results
    }
  }, [practiceExercise, markProgress]);

  // Memoized modal handlers
  const handleModalClose = useCallback((modalType: string) => {
    switch (modalType) {
      case 'create':
        setIsCreating(false);
        setEditingExercise(null);
        break;
      case 'practice':
        setPracticeExercise(null);
        break;
      case 'move':
        setMoveExerciseData(null);
        break;
      case 'delete':
        setDeleteExerciseId(null);
        break;
    }
  }, []);
  return <div className="container mx-auto px-4 py-8">
      {/* Unified Header for better alignment */}
      <div className="mb-8 text-center space-y-2">
        <h1 className="text-3xl font-bold">Exercises</h1>
        <p className="text-muted-foreground text-base">
          Practice your language skills with different exercise types and progress methods.
        </p>
      </div>

      <Tabs defaultValue="dictation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto md:h-12 mb-4 rounded-lg shadow-sm">
          <TabsTrigger value="dictation" className="flex items-center gap-2 md:justify-center px-4 py-3 md:py-0 rounded-none data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900">
            <Mic className="h-4 w-4" />
            <span className="hidden md:inline">Dictation Method</span>
            <span className="md:hidden">Dictation</span>
          </TabsTrigger>
          <TabsTrigger value="reading" className="flex items-center gap-2 md:justify-center px-4 py-3 md:py-0 rounded-none data-[state=active]:bg-green-100 data-[state=active]:text-green-900">
            <BookOpen className="h-4 w-4" />
            <span className="hidden md:inline">Reading & Listening</span>
            <span className="md:hidden">Reading</span>
          </TabsTrigger>
          <TabsTrigger value="bidirectional" className="flex items-center gap-2 md:justify-center px-4 py-3 md:py-0 rounded-none data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 relative">
            <ArrowLeftRight className="h-4 w-4" />
            <span className="hidden md:inline">Bidirectional Method</span>
            <span className="md:hidden">Bidirectional</span>
            {dueReviewsCount > 0 && <Badge variant="destructive" className="ml-2 h-5 min-w-5 text-xs">
                {dueReviewsCount}
              </Badge>}
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

        {/* Dictation Tab */}
        <TabsContent value="dictation" className="space-y-8">
          

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <CreateExerciseCard onClick={onCreateExercise} />
            {/* Add more exercise type cards here as needed */}
          </div>

          {/* Search and Filter in unified box */}
          <div className="flex flex-col md:flex-row gap-4 md:items-center shadow-sm bg-background border border-muted px-4 py-3 rounded-lg mb-4">
            <MemoizedFilterBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedTag={selectedTag} setSelectedTag={setSelectedTag} allTags={allTags} />
            {/* Could add more search options if needed */}
          </div>

          {/* Aligned Grid */}
          <MemoizedExerciseGrid paginatedExercises={paginatedExercises} exercisesPerPage={exercisesPerPage} onPractice={handlePractice} onEdit={setEditingExercise} onDelete={handleDeleteExercise} onMove={handleMoveExercise} onCreateClick={onCreateExercise} canEdit={true} />

          {/* Pagination, consistent gap on all */}
          <div className="mt-6 flex justify-center">
            <MemoizedPaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </TabsContent>

        {/* Reading Tab */}
        <TabsContent value="reading" className="space-y-8">
          <div className="mb-3 text-center">
            <h2 className="text-xl font-semibold flex justify-center items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" /> Reading & Listening Practice
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Strengthen comprehension and listening skills with curated and AI-generated reading.
            </p>
          </div>
          {/* The section is already very visually consistent with new grid/card system */}
          <div>
            <ReadingExercisesSection />
          </div>
        </TabsContent>

        {/* Bidirectional Tab */}
        <TabsContent value="bidirectional" className="space-y-8">
          <div className="mb-3 text-center">
            <h2 className="text-xl font-semibold flex justify-center items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-purple-700" /> Bidirectional Method
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Test your translation skills in both directions for maximum retention.
            </p>
          </div>
          <div>
            <MemoizedBidirectionalPage />
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals for Dictation Method */}
      <ExerciseFormModal isOpen={isCreating || !!editingExercise} onOpenChange={open => !open && handleModalClose('create')} initialValues={editingExercise} mode={editingExercise ? 'edit' : 'create'} />

      <PracticeModal exercise={practiceExercise} isOpen={!!practiceExercise} onOpenChange={open => !open && handleModalClose('practice')} onComplete={onCompleteExercise} />

      <MoveExerciseModal exercise={moveExerciseData} isOpen={!!moveExerciseData} onOpenChange={open => !open && handleModalClose('move')} onSuccess={() => setMoveExerciseData(null)} />

      <DeleteExerciseDialog isOpen={!!deleteExerciseId} onOpenChange={open => !open && handleModalClose('delete')} onConfirm={confirmDeleteExercise} />
    </div>;
};
export default ExercisesPage;