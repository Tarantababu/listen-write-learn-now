import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useDirectoryContext } from '@/contexts/DirectoryContext';
import { DirectoryProvider } from '@/contexts/DirectoryContext';
import { Button } from '@/components/ui/button';
import DirectoryBrowser from '@/components/DirectoryBrowser';
import { Exercise } from '@/types';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import DefaultExercisesSection from '@/components/exercises/DefaultExercisesSection';

// Import the components we've just created
import FilterBar from '@/components/exercises/FilterBar';
import EmptyStateMessage from '@/components/exercises/EmptyStateMessage';
import ExerciseGrid from '@/components/exercises/ExerciseGrid';
import PaginationControls from '@/components/exercises/PaginationControls';
import ExerciseFormModal from '@/components/exercises/ExerciseFormModal';
import DeleteExerciseDialog from '@/components/exercises/DeleteExerciseDialog';
import PracticeModal from '@/components/exercises/PracticeModal';
import MoveExerciseModal from '@/components/MoveExerciseModal';
import UpgradePrompt from '@/components/UpgradePrompt';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles } from 'lucide-react';

const ExercisesPage: React.FC = () => {
  const { 
    exercises, 
    selectExercise, 
    selectedExercise, 
    deleteExercise, 
    markProgress, 
    canCreateMore, 
    exerciseLimit,
    canEdit 
  } = useExerciseContext();
  const { currentDirectoryId } = useDirectoryContext();
  const { settings } = useUserSettingsContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [key, setKey] = useState(Date.now()); // Add a key to force re-rendering
  const { subscription } = useSubscription();
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  
  // Selected exercise state
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const [exerciseToPractice, setExerciseToPractice] = useState<Exercise | null>(null);
  const [exerciseToMove, setExerciseToMove] = useState<Exercise | null>(null);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompleted, setFilterCompleted] = useState<boolean | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  
  // Reset pagination when filters change or when directory changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCompleted, selectedTag, currentDirectoryId]);
  
  // Debug the directory change
  useEffect(() => {
    console.log('Current directory changed:', currentDirectoryId);
  }, [currentDirectoryId]);
  
  // Get all unique tags from exercises that match the selected language
  const languageExercises = exercises.filter(ex => ex.language === settings.selectedLanguage && !ex.archived);
  
  const allTags = Array.from(
    new Set(languageExercises.flatMap(exercise => exercise.tags))
  );
  
  // First filter exercises by directory and selected language
  const directoryExercises = currentDirectoryId 
    ? languageExercises.filter(ex => ex.directoryId === currentDirectoryId)
    : languageExercises;
  
  // Then apply additional filters to the directory-filtered exercises
  const filteredExercises = directoryExercises
    .filter(ex => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          ex.title.toLowerCase().includes(searchLower) ||
          ex.text.toLowerCase().includes(searchLower) ||
          ex.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      return true;
    })
    .filter(ex => {
      // Completion status filter
      if (filterCompleted === null) return true;
      return filterCompleted ? ex.isCompleted : !ex.isCompleted;
    })
    .filter(ex => {
      // Tag filter
      if (!selectedTag) return true;
      return ex.tags.includes(selectedTag);
    });
  
  // Pagination
  const exercisesPerPage = 6;
  const totalPages = Math.ceil(filteredExercises.length / exercisesPerPage);
  const paginatedExercises = filteredExercises.slice(
    (currentPage - 1) * exercisesPerPage,
    currentPage * exercisesPerPage
  );
  
  // Event handlers
  const handlePractice = (exercise: Exercise) => {
    setExerciseToPractice(exercise);
    setIsPracticeModalOpen(true);
  };
  
  const handleEdit = (exercise: Exercise) => {
    if (!canEdit) {
      toast.error("Editing exercises requires a premium subscription");
      return;
    }
    setExerciseToEdit(exercise);
    setIsEditModalOpen(true);
  };
  
  const handleDelete = (exercise: Exercise) => {
    setExerciseToDelete(exercise);
    setIsDeleteDialogOpen(true);
  };
  
  const handleMove = (exercise: Exercise) => {
    setExerciseToMove(exercise);
    setIsMoveModalOpen(true);
  };
  
  const confirmDelete = () => {
    if (exerciseToDelete) {
      deleteExercise(exerciseToDelete.id);
      toast.success('Exercise deleted');
      setIsDeleteDialogOpen(false);
      setExerciseToDelete(null);
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

  // Function to refresh the page properly
  const refreshPage = () => {
    setKey(Date.now()); // This will force the component to re-render
  };

  // Clean up exercise states when modals close
  const handleAddModalClose = (open: boolean) => {
    setIsAddModalOpen(open);
    if (!open) {
      refreshPage();
    }
  };

  const handleEditModalClose = (open: boolean) => {
    setIsEditModalOpen(open);
    if (!open) {
      setTimeout(() => {
        setExerciseToEdit(null);
        refreshPage();
      }, 300); // Wait for animation to finish
    }
  };

  const handlePracticeModalClose = (open: boolean) => {
    setIsPracticeModalOpen(open);
    if (!open) {
      setTimeout(() => {
        setExerciseToPractice(null);
        refreshPage();
      }, 300); // Wait for animation to finish
    }
  };

  const handleDeleteDialogClose = (open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      setTimeout(() => {
        setExerciseToDelete(null);
        refreshPage();
      }, 300);
    }
  };

  const handleMoveModalClose = (open: boolean) => {
    setIsMoveModalOpen(open);
    if (!open) {
      setTimeout(() => {
        setExerciseToMove(null);
        refreshPage();
      }, 300); // Wait for animation to finish
    }
  };
  
  return (
    <DirectoryProvider>
      <div className="container mx-auto px-4 py-8" key={key}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Your {settings.selectedLanguage.charAt(0).toUpperCase() + settings.selectedLanguage.slice(1)} Exercises
            {currentDirectoryId && (
              <span className="ml-2 text-muted-foreground">
                (in selected folder)
              </span>
            )}
          </h1>
          <Button 
            onClick={() => setIsAddModalOpen(true)} 
            disabled={!canCreateMore}
          >
            <Plus className="h-4 w-4 mr-2" /> New Exercise
          </Button>
        </div>
        
        {/* Subscription Status Alert */}
        {!subscription.isSubscribed && (
          <Alert className="mb-6 bg-primary/5 border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Free users are limited to {exerciseLimit} exercises and cannot edit exercises. 
                <strong className="ml-1">
                  {exercises.length}/{exerciseLimit} exercises used.
                </strong>
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-4 border-primary text-primary"
                onClick={() => navigate('/dashboard/subscription')}
              >
                <Sparkles className="h-3 w-3 mr-1" /> Upgrade
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Directory Browser */}
          <div className="md:col-span-1 border rounded-lg p-4">
            <h2 className="text-lg font-medium mb-4">Folders</h2>
            <DirectoryBrowser 
              onExerciseClick={handlePractice} 
              showExercises={true}
              filterByLanguage={settings.selectedLanguage}
            />
            
            {/* Subscription Upgrade Card */}
            {!subscription.isSubscribed && (
              <div className="mt-6">
                <UpgradePrompt 
                  title="Unlock Full Features"
                  message="Premium subscribers can create unlimited exercises and edit them anytime."
                />
              </div>
            )}
          </div>
          
          {/* Exercise Content */}
          <div className="md:col-span-3">
            {/* Default exercises section - only show when not in a directory */}
            {!currentDirectoryId && (
              <div className="mb-6">
                <DefaultExercisesSection />
              </div>
            )}
          
            {/* Search and filters */}
            <FilterBar 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
              allTags={allTags}
            />
            
            {filteredExercises.length === 0 ? (
              <EmptyStateMessage onCreateExercise={() => canCreateMore ? setIsAddModalOpen(true) : null} />
            ) : (
              <>
                {/* Grid of exercises */}
                <ExerciseGrid 
                  paginatedExercises={paginatedExercises}
                  exercisesPerPage={exercisesPerPage}
                  onPractice={handlePractice}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onMove={handleMove}
                  onCreateClick={() => setIsAddModalOpen(true)}
                  canEdit={canEdit}
                />
                
                {/* Pagination */}
                <PaginationControls 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        </div>
        
        {/* Modals - Always render them but control visibility with open prop */}
        <ExerciseFormModal 
          isOpen={isAddModalOpen}
          onOpenChange={handleAddModalClose}
          mode="create"
        />
        
        {/* Only render edit modal when there's an exercise to edit */}
        <ExerciseFormModal
          isOpen={isEditModalOpen}
          onOpenChange={handleEditModalClose}
          initialValues={exerciseToEdit}
          mode="edit"
        />
        
        <DeleteExerciseDialog 
          isOpen={isDeleteDialogOpen}
          onOpenChange={handleDeleteDialogClose}
          onConfirm={confirmDelete}
        />
        
        {/* Only render practice modal when there's an exercise to practice */}
        {exerciseToPractice && (
          <PracticeModal
            isOpen={isPracticeModalOpen}
            onOpenChange={handlePracticeModalClose}
            exercise={exerciseToPractice}
            onComplete={handlePracticeComplete}
          />
        )}
        
        {/* Move exercise modal */}
        {exerciseToMove && (
          <MoveExerciseModal
            isOpen={isMoveModalOpen}
            onOpenChange={handleMoveModalClose}
            exercise={exerciseToMove}
            onSuccess={refreshPage}
          />
        )}
      </div>
    </DirectoryProvider>
  );
};

export default ExercisesPage;
