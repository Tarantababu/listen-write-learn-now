
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import DefaultExerciseForm from './DefaultExerciseForm';
import LevelBadge from '@/components/LevelBadge';
import { Language, LanguageLevel } from '@/types';

type DefaultExercise = {
  id: string;
  title: string;
  text: string;
  language: Language;
  level: LanguageLevel;
  audio_url?: string;
  tags?: string[];
};

const DefaultExercisesList: React.FC = () => {
  const [exercises, setExercises] = useState<DefaultExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editExercise, setEditExercise] = useState<DefaultExercise | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteExercise, setDeleteExercise] = useState<DefaultExercise | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('default_exercises')
        .select('*')
        .order('language')
        .order('level')
        .order('title');
        
      if (error) throw error;
      
      // Map Supabase data to our component structure
      const formattedExercises = data.map((exercise: any) => ({
        id: exercise.id,
        title: exercise.title,
        text: exercise.text,
        language: exercise.language,
        level: exercise.level || 'A1', // Default to A1 if level is not set
        audio_url: exercise.audio_url,
        tags: exercise.tags
      }));
      
      setExercises(formattedExercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch exercises',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchExercises();
  }, []);
  
  const handleEdit = (exercise: DefaultExercise) => {
    setEditExercise(exercise);
    setIsEditDialogOpen(true);
  };
  
  const handleDelete = (exercise: DefaultExercise) => {
    setDeleteExercise(exercise);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!deleteExercise) return;
    
    try {
      const { error } = await supabase
        .from('default_exercises')
        .delete()
        .eq('id', deleteExercise.id);
        
      if (error) throw error;
      
      toast({
        title: 'Exercise Deleted',
        description: 'The exercise has been successfully deleted.',
      });
      
      setIsDeleteDialogOpen(false);
      fetchExercises();
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the exercise',
        variant: 'destructive',
      });
    }
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    fetchExercises();
  };
  
  if (isLoading) {
    return <div className="text-center py-8">Loading exercises...</div>;
  }
  
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead className="hidden md:table-cell">Text</TableHead>
            <TableHead>Language</TableHead>
            <TableHead>Level</TableHead>
            <TableHead className="hidden md:table-cell">Tags</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exercises.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                No exercises found
              </TableCell>
            </TableRow>
          ) : (
            exercises.map((exercise) => (
              <TableRow key={exercise.id}>
                <TableCell className="font-medium">{exercise.title}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {truncateText(exercise.text)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {exercise.language.charAt(0).toUpperCase() + exercise.language.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <LevelBadge level={exercise.level} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {exercise.tags?.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(exercise)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(exercise)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Exercise</DialogTitle>
          </DialogHeader>
          {editExercise && (
            <DefaultExerciseForm 
              exerciseToEdit={editExercise} 
              onSuccess={handleEditSuccess} 
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-col items-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-2" />
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            Are you sure you want to delete <span className="font-semibold">{deleteExercise?.title}</span>? This action cannot be undone.
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DefaultExercisesList;
