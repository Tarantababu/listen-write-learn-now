
import React from 'react';
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
import { useModalState } from '@/hooks/useModalState';

interface DeleteExerciseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const DeleteExerciseDialog: React.FC<DeleteExerciseDialogProps> = ({
  isOpen,
  onOpenChange,
  onConfirm
}) => {
  // Use our persistent modal state
  const [isDialogOpen, setDialogOpen, handleDialogOpenChange] = 
    useModalState('delete-exercise-dialog', isOpen);
    
  // Sync parent state with our URL-based state
  React.useEffect(() => {
    if (isOpen !== isDialogOpen) {
      setDialogOpen(isOpen);
    }
  }, [isOpen, isDialogOpen, setDialogOpen]);
  
  React.useEffect(() => {
    if (onOpenChange && isDialogOpen !== isOpen) {
      onOpenChange(isDialogOpen);
    }
  }, [isDialogOpen, isOpen, onOpenChange]);

  // Handle dialog open state change
  const handleOpenChange = (open: boolean) => {
    handleDialogOpenChange(open);
  };
  
  return (
    <AlertDialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will archive the exercise and hide it from your dashboard. The exercise will remain in the database to preserve associated data but will no longer be visible to you.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">Archive</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteExerciseDialog;
