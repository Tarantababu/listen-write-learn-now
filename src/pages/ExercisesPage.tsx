
import React, { useState } from 'react';
import { Plus, Filter } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  
  // Get all unique tags from exercises
  const allTags = Array.from(
    new Set(exercises.flatMap(exercise => exercise.tags))
  );
  
  // Filter exercises based on current language and search/filters
  const filteredExercises = exercises
    .filter(ex => ex.language === settings.selectedLanguage)
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
  
  return (
    <DirectoryProvider>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Exercises</h1>
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
            <div className="mb-6">
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all" onClick={() => setFilterCompleted(null)}>
                    All
                  </TabsTrigger>
                  <TabsTrigger value="in-progress" onClick={() => setFilterCompleted(false)}>
                    In Progress
                  </TabsTrigger>
                  <TabsTrigger value="completed" onClick={() => setFilterCompleted(true)}>
                    Completed
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-grow">
                <Input
                  placeholder="Search exercises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="w-full md:w-64">
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
              
              <Button 
                variant="outline" 
                onClick={clearFilters}
                size="icon"
              >
                <Filter className="h-4 w-4" />
                <span className="sr-only">Clear filters</span>
              </Button>
            </div>
            
            {filteredExercises.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No exercises found</p>
                <Button onClick={() => setIsAddModalOpen(true)}>
                  Create your first exercise
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExercises.map(exercise => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onPractice={() => handlePractice(exercise)}
                    onEdit={() => handleEdit(exercise)}
                    onDelete={() => handleDelete(exercise)}
                  />
                ))}
              </div>
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
