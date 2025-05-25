import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, ChevronDown, Folder, FolderOpen, BookOpen, Trophy, Clock } from 'lucide-react';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useDirectoryContext } from '@/contexts/DirectoryContext';
import { DirectoryProvider } from '@/contexts/DirectoryContext';
import { Button } from '@/components/ui/button';
import DirectoryBrowser from '@/components/DirectoryBrowser';
import { Exercise } from '@/types';
import { toast } from 'sonner';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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
    canEdit,
    copyDefaultExercise,
    refreshExercises
  } = useExerciseContext();
  const { currentDirectoryId } = useDirectoryContext();
  const { settings } = useUserSettingsContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [key, setKey] = useState(Date.now());
  const { subscription } = useSubscription();
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  
  // Directory browser state
  const [isDirectoryCollapsed, setIsDirectoryCollapsed] = useState(false);
  
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

  // Handle URL parameters for default exercises
  useEffect(() => {
    const handleDefaultExerciseFromURL = async () => {
      const defaultExerciseId = searchParams.get('defaultExerciseId');
      const action = searchParams.get('action');
      
      if (defaultExerciseId) {
        try {
          console.log('Processing default exercise from URL:', defaultExerciseId, action);
          
          // Find if we already have this exercise copied
          const existingExercise = exercises.find(ex => ex.default_exercise_id === defaultExerciseId);
          
          if (existingExercise) {
            console.log('Exercise already exists in user exercises:', existingExercise.id);
            
            if (action === 'practice') {
              // Use existing copy to practice
              setExerciseToPractice(existingExercise);
              setIsPracticeModalOpen(true);
            }
          } else {
            // Copy the exercise first, then practice
            console.log('Copying exercise from default:', defaultExerciseId);
            const newExercise = await copyDefaultExercise(defaultExerciseId);
            
            if (action === 'practice') {
              setExerciseToPractice(newExercise);
              setIsPracticeModalOpen(true);
            }
            
            toast.success('Exercise added to your list');
          }
          
          // Clear the URL parameters after processing
          navigate('/dashboard/exercises', { replace: true });
          
          // Refresh to ensure the lists are updated
          refreshExercises();
        } catch (error) {
          console.error('Error processing default exercise:', error);
          toast.error('Failed to process the exercise');
        }
      }
    };
    
    handleDefaultExerciseFromURL();
  }, [searchParams, copyDefaultExercise, exercises, navigate, refreshExercises]);
  
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
    setKey(Date.now());
    refreshExercises();
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
      }, 300);
    }
  };

  const handlePracticeModalClose = (open: boolean) => {
    setIsPracticeModalOpen(open);
    if (!open) {
      setTimeout(() => {
        setExerciseToPractice(null);
        refreshPage();
      }, 300);
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
      }, 300);
    }
  };

  // Enhanced Directory Browser Component
  const EnhancedDirectoryBrowser = () => {
    const { directories } = useDirectoryContext();
    
    // Calculate exercise counts for each directory
    const getExerciseCount = (directoryId: string | null) => {
      return languageExercises.filter(ex => ex.directoryId === directoryId).length;
    };

    const completedCount = directoryExercises.filter(ex => ex.isCompleted).length;
    const inProgressCount = directoryExercises.filter(ex => !ex.isCompleted && ex.completionCount > 0).length;
    const newCount = directoryExercises.filter(ex => ex.completionCount === 0).length;

    return (
      <div className={`transition-all duration-300 ease-in-out ${isDirectoryCollapsed ? 'w-12' : 'min-w-80'}`}>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-fit">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
            <div className="flex items-center justify-between">
              {!isDirectoryCollapsed && (
                <div className="flex items-center space-x-2">
                  <Folder className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Folders</h2>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDirectoryCollapsed(!isDirectoryCollapsed)}
                className="h-8 w-8 p-0 hover:bg-white/50"
              >
                {isDirectoryCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {!isDirectoryCollapsed && currentDirectoryId && (
              <div className="mt-3 pt-3 border-t border-white/30">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-white/60 rounded-lg p-2 text-center">
                    <div className="font-semibold text-emerald-600">{completedCount}</div>
                    <div className="text-gray-600">Mastered</div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2 text-center">
                    <div className="font-semibold text-amber-600">{inProgressCount}</div>
                    <div className="text-gray-600">Learning</div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2 text-center">
                    <div className="font-semibold text-blue-600">{newCount}</div>
                    <div className="text-gray-600">New</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isDirectoryCollapsed && (
            <div className="p-4">
              <DirectoryBrowser 
                onExerciseClick={handlePractice} 
                showExercises={true}
                filterByLanguage={settings.selectedLanguage}
                renderDirectoryItem={(directory, isSelected, onClick) => (
                  <div
                    key={directory.id}
                    onClick={onClick}
                    className={`
                      flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200
                      ${isSelected 
                        ? 'bg-blue-100 border border-blue-200 shadow-sm' 
                        : 'hover:bg-gray-50 border border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      {isSelected ? (
                        <FolderOpen className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Folder className="h-4 w-4 text-gray-500" />
                      )}
                      <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                        {directory.name}
                      </span>
                    </div>
                    <div className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${isSelected 
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      {getExerciseCount(directory.id)}
                    </div>
                  </div>
                )}
                renderAllExercisesItem={(isSelected, onClick) => (
                  <div
                    onClick={onClick}
                    className={`
                      flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200
                      ${isSelected 
                        ? 'bg-blue-100 border border-blue-200 shadow-sm' 
                        : 'hover:bg-gray-50 border border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <BookOpen className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                      <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                        All Exercises
                      </span>
                    </div>
                    <div className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${isSelected 
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      {getExerciseCount(null)}
                    </div>
                  </div>
                )}
              />
              
              {/* Subscription Upgrade Card */}
              {!subscription.isSubscribed && (
                <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-purple-900">Unlock Premium</h3>
                      <p className="text-xs text-purple-700 mt-1">
                        Create unlimited exercises and edit them anytime.
                      </p>
                      <Button 
                        size="sm" 
                        className="mt-3 bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => navigate('/dashboard/subscription')}
                      >
                        Upgrade Now
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <DirectoryProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30" key={key}>
        <div className="container mx-auto px-4 py-8">
          {/* Enhanced Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {settings.selectedLanguage.charAt(0).toUpperCase() + settings.selectedLanguage.slice(1)} Exercises
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{directoryExercises.length} exercises</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Trophy className="h-4 w-4 text-emerald-500" />
                    <span>{directoryExercises.filter(ex => ex.isCompleted).length} mastered</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span>{directoryExercises.filter(ex => !ex.isCompleted && ex.completionCount > 0).length} in progress</span>
                  </div>
                  {currentDirectoryId && (
                    <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      In selected folder
                    </div>
                  )}
                </div>
              </div>
              <Button 
                onClick={() => setIsAddModalOpen(true)} 
                disabled={!canCreateMore}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500"
              >
                <Plus className="h-5 w-5 mr-2" /> 
                Create Exercise
              </Button>
            </div>
            
            {/* Enhanced Subscription Status Alert */}
            {!subscription.isSubscribed && (
              <Alert className="mt-6 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <AlertDescription className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-amber-800">
                      <strong>Free Plan:</strong> Limited to {exerciseLimit} exercises
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-amber-200 rounded-full h-2">
                        <div 
                          className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((exercises.length / exerciseLimit) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-amber-700">
                        {exercises.length}/{exerciseLimit}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100"
                    onClick={() => navigate('/dashboard/subscription')}
                  >
                    <Sparkles className="h-3 w-3 mr-1" /> Upgrade
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <div className="flex gap-6">
            {/* Enhanced Directory Browser */}
            <EnhancedDirectoryBrowser />
            
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Default exercises section - only show when not in a directory */}
              {!currentDirectoryId && (
                <div className="mb-8">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                      <DefaultExercisesSection />
                    </div>
                  </div>
                </div>
              )}
            
              {/* Enhanced Search and filters */}
              <div className="mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <FilterBar 
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedTag={selectedTag}
                    setSelectedTag={setSelectedTag}
                    allTags={allTags}
                  />
                </div>
              </div>
              
              {filteredExercises.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <EmptyStateMessage onCreateExercise={() => canCreateMore ? setIsAddModalOpen(true) : null} />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Enhanced Exercise Grid */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                  </div>
                  
                  {/* Enhanced Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
                        <PaginationControls 
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={setCurrentPage}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
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