
import React from 'react';
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { PersistentDialog } from '@/components/ui/persistent-dialog';

interface DeleteExerciseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  exerciseId?: string;
}

const DeleteExerciseDialog: React.FC<DeleteExerciseDialogProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  exerciseId
}) => {
  const handleConfirm = () => {
    onConfirm();
    toast("Exercise archived");
  };

  // Generate persistence key
  const getPersistenceKey = () => {
    return exerciseId ? `delete_exercise_${exerciseId}` : 'delete_exercise';
  };

  return (
    <PersistentDialog 
      persistenceKey={getPersistenceKey()} 
      initialOpen={isOpen}
      onOpenChange={onOpenChange}
      persistenceTtl={10 * 60 * 1000} // 10 minutes TTL for delete dialogues
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will archive the exercise and hide it from your dashboard. The exercise will remain in the database to preserve associated data but will no longer be visible to you.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive hover:bg-destructive/90">Archive</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </PersistentDialog>
  );
};

export default DeleteExerciseDialog;
