
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Language } from '@/types';
import { fetchDefaultExercises, deleteDefaultExercise } from '@/services/defaultExerciseService';
import { Pencil, Trash2, FileText, Languages } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface DefaultExerciseItem {
  id: string;
  title: string;
  text: string;
  language: Language;
  tags: string[];
  audio_url?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

const DefaultExercisesList: React.FC = () => {
  const [exercises, setExercises] = useState<DefaultExerciseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<DefaultExerciseItem | null>(null);

  const loadExercises = async () => {
    try {
      setIsLoading(true);
      const data = await fetchDefaultExercises();
      setExercises(data as DefaultExerciseItem[]);
    } catch (error) {
      console.error('Error fetching default exercises:', error);
      toast.error('Failed to load default exercises');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExercises();
  }, []);

  const handleDelete = async () => {
    if (!exerciseToDelete) return;
    
    try {
      await deleteDefaultExercise(exerciseToDelete.id);
      setExercises(exercises.filter(ex => ex.id !== exerciseToDelete.id));
      toast.success('Default exercise deleted successfully');
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting default exercise:', error);
      toast.error('Failed to delete default exercise');
    }
  };

  const confirmDelete = (exercise: DefaultExerciseItem) => {
    setExerciseToDelete(exercise);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : exercises.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No default exercises found. Create one to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exercises.map(exercise => (
            <Card key={exercise.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{exercise.title}</CardTitle>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => confirmDelete(exercise)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Languages className="h-4 w-4" />
                  <span className="capitalize">{exercise.language}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {exercise.text}
                </div>
                <div className="flex flex-wrap gap-2">
                  {exercise.tags?.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                  {(!exercise.tags || exercise.tags.length === 0) && (
                    <span className="text-xs text-muted-foreground">No tags</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-4">
                  Created: {new Date(exercise.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Default Exercise</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this default exercise? This action cannot be undone.</p>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DefaultExercisesList;
