
import React, { useState } from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { DirectoryProvider } from '@/contexts/DirectoryContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ExerciseForm from '@/components/ExerciseForm';
import ExerciseCard from '@/components/ExerciseCard';
import DictationPractice from '@/components/DictationPractice';
import DirectoryBrowser from '@/components/DirectoryBrowser';
import { Exercise } from '@/types';
import { toast } from 'sonner';
import VocabularyHighlighter from '@/components/VocabularyHighlighter';

const ExercisesPage: React.FC = () => {
  const { exercises, selectExercise, selectedExercise, deleteExercise, markProgress } = useExerciseContext();
  const { settings } = useUserSettingsContext();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const [exerciseToPractice, setExerciseToPractice] = useState<Exercise | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompleted, setFilterCompleted] = useState<boolean | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Get all unique tags from exercises
  const allTags = Array.from(
    new Set(exercises.flatMap(exercise => exercise.tags))
  );
  
  // Get all unique languages from exercises
  const allLanguages = Array.from(
    new Set(exercises.map(exercise => exercise.language))
  );
  
  // Filter exercises based on current language and search/filters
  const filteredExercises = exercises
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
  
  const handlePractice = (exercise: Exercise) => {
    setExerciseToPractice(exercise);
    setIsPracticeModalOpen(true);
    setShowResults(false);
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
    setShowResults(true);
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setFilterCompleted(null);
    setSelectedTag(null);
  };

  // Pagination
  const exercisesPerPage = 6;
  const totalPages = Math.ceil(filteredExercises.length / exercisesPerPage);
  const paginatedExercises = filteredExercises.slice(
    (currentPage - 1) * exercisesPerPage,
    currentPage * exercisesPerPage
  );
  
  return (
    <DirectoryProvider>
      <div className="container mx-auto px-4 py-8">
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
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search exercises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="w-full md:w-48">
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value="all-languages"
                  onChange={() => {}}
                >
                  <option value="all-languages">All Languages</option>
                  {allLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
                  ))}
                </select>
              </div>
              
              <div className="w-full md:w-48">
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedTag || ''}
                  onChange={(e) => setSelectedTag(e.target.value || null)}
                >
                  <option value="">All Tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {filteredExercises.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <p className="text-muted-foreground mb-4">No exercises found</p>
                <Button onClick={() => setIsAddModalOpen(true)}>
                  Create your first exercise
                </Button>
              </div>
            ) : (
              <>
                {/* Grid of exercises */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {paginatedExercises.map(exercise => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      onPractice={() => handlePractice(exercise)}
                      onEdit={() => handleEdit(exercise)}
                      onDelete={() => handleDelete(exercise)}
                    />
                  ))}
                  
                  {/* Create New Exercise Card */}
                  {paginatedExercises.length < exercisesPerPage && (
                    <Card className="border-dashed border-2 hover:border-primary/50 transition-colors flex flex-col items-center justify-center h-full min-h-[280px] cursor-pointer" onClick={() => setIsAddModalOpen(true)}>
                      <CardContent className="flex flex-col items-center justify-center h-full text-center p-6">
                        <div className="bg-gray-50 rounded-full p-4 mb-4">
                          <Plus className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-medium text-lg mb-2">Create New Exercise</h3>
                        <p className="text-sm text-muted-foreground">
                          Add your own text and generate audio for practice
                        </p>
                        <Button className="mt-4" onClick={() => setIsAddModalOpen(true)}>
                          Create Exercise
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <Button
                          key={i}
                          variant={currentPage === i + 1 ? "default" : "outline"}
                          size="sm"
                          className="min-w-[40px]"
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </Button>
                      ))}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Add Exercise Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Exercise</DialogTitle>
              <DialogDescription>
                Add a new exercise for dictation practice
              </DialogDescription>
            </DialogHeader>
            <ExerciseForm onSuccess={() => {
              setIsAddModalOpen(false);
              toast.success('Exercise created');
            }} />
          </DialogContent>
        </Dialog>
        
        {/* Edit Exercise Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Exercise</DialogTitle>
              <DialogDescription>
                Update your exercise details
              </DialogDescription>
            </DialogHeader>
            {exerciseToEdit && (
              <ExerciseForm 
                initialValues={exerciseToEdit}
                onSuccess={() => {
                  setIsEditModalOpen(false);
                  setExerciseToEdit(null);
                  toast.success('Exercise updated');
                }} 
              />
            )}
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the exercise.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setExerciseToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Practice Modal */}
        <Dialog 
          open={isPracticeModalOpen} 
          onOpenChange={(open) => {
            setIsPracticeModalOpen(open);
            if (!open) setExerciseToPractice(null);
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{exerciseToPractice?.title}</DialogTitle>
              <DialogDescription>
                Practice dictation by listening and typing what you hear
              </DialogDescription>
            </DialogHeader>
            {exerciseToPractice && (
              <>
                <DictationPractice
                  exercise={exerciseToPractice}
                  onComplete={handlePracticeComplete}
                />
                {showResults && (
                  <VocabularyHighlighter exercise={exerciseToPractice} />
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DirectoryProvider>
  );
};

export default ExercisesPage;
