
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import ExerciseForm from '@/components/ExerciseForm';
import { Exercise } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import UpgradePrompt from '@/components/UpgradePrompt';
import { useIsMobile } from '@/hooks/use-mobile';

interface ExerciseFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Exercise;
  mode: 'create' | 'edit';
}

const ExerciseFormModal: React.FC<ExerciseFormModalProps> = ({
  isOpen,
  onOpenChange,
  initialValues,
  mode
}) => {
  const isMobile = useIsMobile();
  // For now, assume users can create and edit (we can add subscription checks later)
  const canPerformAction = true;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={isMobile ? "w-screen h-screen max-w-full max-h-full m-0 rounded-none overflow-y-auto" : "max-w-md"}>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Exercise' : 'Edit Exercise'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Add a new exercise for dictation practice'
              : 'Update your exercise details'
            }
          </DialogDescription>
        </DialogHeader>
        <ExerciseForm 
          initialValues={initialValues}
          onSuccess={() => {
            onOpenChange(false);
            toast({
              title: mode === 'create' ? "Exercise created" : "Exercise updated"
            });
          }} 
        />
      </DialogContent>
    </Dialog>
  );
};

export { ExerciseFormModal };
