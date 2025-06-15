
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
import { MobileExerciseFormModal } from '@/components/exercises/MobileExerciseFormModal';
import PracticeModal from '@/components/exercises/PracticeModal';
import MoveExerciseModal from '@/components/MoveExerciseModal';
import DeleteExerciseDialog from '@/components/exercises/DeleteExerciseDialog';
import { MobilePaginationControls } from '@/components/exercises/MobilePaginationControls';
import { MobileFilterBar } from '@/components/exercises/MobileFilterBar';
import { MobileExerciseGrid } from '@/components/exercises/MobileExerciseGrid';
import { MobileCreateExerciseCard } from '@/components/exercises/MobileCreateExerciseCard';
import BidirectionalPage from './BidirectionalPage';
import { ReadingExercisesSection } from '@/components/reading/ReadingExercisesSection';
import PopoverHint from '@/components/PopoverHint';
import { useIsMobile } from '@/hooks/use-mobile';

// Memoized components to prevent unnecessary re-renders
const MemoizedMobileExerciseGrid = React.memo(MobileExerciseGrid);
const MemoizedBidirectionalPage = React.memo(BidirectionalPage);
const MemoizedMobileFilterBar = React.memo(MobileFilterBar);
const MemoizedMobilePaginationControls = React.memo(MobilePaginationControls);

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
  const isMobile = useIsMobile();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState(null);
  const [practiceExercise, setPracticeExercise] = useState(null);
  const [moveExerciseData, setMoveExerciseData] = useState(null);
  const [deleteExerciseId, setDeleteExerciseId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  
  // Mobile-optimized pagination
  const exercisesPerPage = isMobile ? 6 : 12;

  useEffect(() => {
    if (user) {
      refreshExercises();
    }
  }, [user, refreshExercises]);

  // Memoize filtered exercises to prevent unnecessary recalculations
  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      const matchesLanguage = exercise.language === settings.selectedLanguage;
      const matchesSearch = exercise.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           exercise.text.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = !selectedTag || exercise.tags.includes(selectedTag);
      return matchesLanguage && matchesSearch && matchesTag;
    });
  }, [exercises, settings.selectedLanguage, searchTerm, selectedTag]);

  // Memoize unique tags to prevent unnecessary recalculations
  const allTags = useMemo(() => {
    return [...new Set(
      exercises
        .filter(exercise => exercise.language === settings.selectedLanguage)
        .flatMap(exercise => exercise.tags)
    )];
  }, [exercises, settings.selectedLanguage]);

  // Memoize pagination calculations
  const { totalPages, paginatedExercises } = useMemo(() => {
    const total = Math.ceil(filteredExercises.length / exercisesPerPage);
    const paginated = filteredExercises.slice(
      (currentPage - 1) * exercisesPerPage,
      currentPage * exercisesPerPage
    );
    return { totalPages: total, paginatedExercises: paginated };
  }, [filteredExercises, currentPage, exercisesPerPage]);

  // Memoized event handlers to prevent unnecessary re-renders
  const onCreateExercise = useCallback(() => {
    setIsCreating(true);
  }, []);

  const onSaveExercise = useCallback(async (exerciseToSave) => {
    if (exerciseToSave.id) {
      await updateExercise(exerciseToSave.id, exerciseToSave);
    } else {
      await addExercise(exerciseToSave);
    }
  }, [updateExercise, addExercise]);

  const handleDeleteExercise = useCallback((exercise) => {
    setDeleteExerciseId(exercise.id);
  }, []);

  const confirmDeleteExercise = useCallback(async () => {
    if (deleteExerciseId) {
      await deleteExercise(deleteExerciseId);
      setDeleteExerciseId(null);
    }
  }, [deleteExerciseId, deleteExercise]);

  const handleToggleArchive = useCallback(async (exercise) => {
    await updateExercise(exercise.id, { archived: !exercise.archived });
  }, [updateExercise]);

  const handleMoveExercise = useCallback((exercise) => {
    setMoveExerciseData(exercise);
  }, []);

  const confirmMoveExercise = useCallback(async (directoryId) => {
    if (moveExerciseData) {
      await updateExercise(moveExerciseData.id, { directoryId });
      setMoveExerciseData(null);
    }
  }, [moveExerciseData, updateExercise]);

  const handlePractice = useCallback((exercise) => {
    setPracticeExercise(exercise);
  }, []);

  const onCompleteExercise = useCallback(async (accuracy) => {
    if (practiceExercise) {
      await markProgress(practiceExercise.id, accuracy);
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

  return (
    <div className={`container mx-auto py-8 ${isMobile ? 'px-0' : 'px-4'}`}>
      <div className={`mb-8 ${isMobile ? 'px-4' : ''}`}>
        <h1 className={`font-bold mb-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>Exercises</h1>
        <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
          Practice your language skills with different exercise types
        </p>
      </div>

      <Tabs defaultValue="dictation" className="space-y-6">
        <TabsList className={`
          ${isMobile 
            ? 'grid w-full grid-cols-1 h-auto p-1 mx-4' 
            : 'grid w-full grid-cols-3'
          }
        `}>
          <TabsTrigger 
            value="dictation" 
            className={`flex items-center gap-2 ${
              isMobile ? 'w-full justify-start px-4 py-3 mb-1 text-base' : ''
            }`}
          >
            <Mic className="h-4 w-4" />
            Dictation Method
          </TabsTrigger>
          <TabsTrigger 
            value="reading" 
            className={`flex items-center gap-2 ${
              isMobile ? 'w-full justify-start px-4 py-3 mb-1 text-base' : ''
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Reading & Listening
          </TabsTrigger>
          <TabsTrigger 
            value="bidirectional" 
            className={`flex items-center gap-2 relative ${
              isMobile ? 'w-full justify-start px-4 py-3 text-base' : ''
            }`}
          >
            <ArrowLeftRight className="h-4 w-4" />
            Bidirectional Method
            {dueReviewsCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-5 text-xs">
                {dueReviewsCount}
              </Badge>
            )}
            {!isMobile && (
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
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dictation" className="space-y-6">
          {/* Create Exercise Section */}
          <MobileCreateExerciseCard onClick={onCreateExercise} />

          {/* Search and Filter Bar */}
          <MemoizedMobileFilterBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
            allTags={allTags}
          />

          {/* Exercises Grid */}
          <MemoizedMobileExerciseGrid
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
          <MemoizedMobilePaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </TabsContent>

        <TabsContent value="reading">
          <ReadingExercisesSection />
        </TabsContent>

        <TabsContent value="bidirectional">
          <MemoizedBidirectionalPage />
        </TabsContent>
      </Tabs>

      {/* Modals for Dictation Method */}
      <MobileExerciseFormModal
        isOpen={isCreating || !!editingExercise}
        onOpenChange={(open) => !open && handleModalClose('create')}
        initialValues={editingExercise}
        mode={editingExercise ? 'edit' : 'create'}
      />

      <PracticeModal
        exercise={practiceExercise}
        isOpen={!!practiceExercise}
        onOpenChange={(open) => !open && handleModalClose('practice')}
        onComplete={onCompleteExercise}
      />

      <MoveExerciseModal
        exercise={moveExerciseData}
        isOpen={!!moveExerciseData}
        onOpenChange={(open) => !open && handleModalClose('move')}
        onSuccess={() => setMoveExerciseData(null)}
      />

      <DeleteExerciseDialog
        isOpen={!!deleteExerciseId}
        onOpenChange={(open) => !open && handleModalClose('delete')}
        onConfirm={confirmDeleteExercise}
      />
    </div>
  );
};

export default ExercisesPage;
