
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

// Import the components we've just created
import FilterBar from '@/components/exercises/FilterBar';
import EmptyStateMessage from '@/components/exercises/EmptyStateMessage';
import ExerciseGrid from '@/components/exercises/ExerciseGrid';
import PaginationControls from '@/components/exercises/PaginationControls';
import ExerciseFormModal from '@/components/exercises/ExerciseFormModal';
import DeleteExerciseDialog from '@/components/exercises/DeleteExerciseDialog';
import PracticeModal from '@/components/exercises/PracticeModal';

const ExercisesPage: React.FC = () => {
  const { exercises, selectExercise, selectedExercise, deleteExercise, markProgress } = useExerciseContext();
  const { currentDirectoryId } = useDirectoryContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [key, setKey] = useState(Date.now()); // Add a key to force re-rendering
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  
  // Selected exercise state
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const [exerciseToPractice, setExerciseToPractice] = useState<Exercise | null>(null);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompleted, setFilterCompleted] = useState<boolean | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  
  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCompleted, selectedTag, currentDirectoryId]);
  
  // Get all unique tags from exercises
  const allTags = Array.from(
    new Set(exercises.flatMap(exercise => exercise.tags))
  );
  
  // Get all unique languages from exercises
  const allLanguages = Array.from(
    new Set(exercises.map(exercise => exercise.language))
  );
  
  // First filter exercises by directory if a directory is selected
  const directoryExercises = currentDirectoryId 
    ? exercises.filter(ex => ex.directoryId === currentDirectoryId)
    : exercises;
  
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
    setExerciseToEdit(exercise);
    setIsEditModalOpen(true);
  };
  
  const handleDelete = (exercise: Exercise) => {
    setExerciseToDelete(exercise);
    setIsDeleteDialogOpen(true);
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
    
    // Also refetch the exercises data through your context if needed
    // This could be done using a method from useExerciseContext if available
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
  
  return (
    <DirectoryProvider>
      <div className="container mx-auto px-4 py-8" key={key}>
        {/* The key prop here will force a re-render when changed */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Exercise Library</h1>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Exercise
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Directory Browser */}
          <div className="md:col-span-1 border rounded-lg p-4">
            <h2 className="text-lg font-medium mb-4">Folders</h2>
            <DirectoryBrowser />
          </div>
          
          {/* Exercise Content */}
          <div className="md:col-span-3">
            {/* Search and filters */}
            <FilterBar 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
              allTags={allTags}
              allLanguages={allLanguages}
            />
            
            {filteredExercises.length === 0 ? (
              <EmptyStateMessage onCreateExercise={() => setIsAddModalOpen(true)} />
            ) : (
              <>
                {/* Grid of exercises */}
                <ExerciseGrid 
                  paginatedExercises={paginatedExercises}
                  exercisesPerPage={exercisesPerPage}
                  onPractice={handlePractice}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onCreateClick={() => setIsAddModalOpen(true)}
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
      </div>
    </DirectoryProvider>
  );
};

export default ExercisesPage;
