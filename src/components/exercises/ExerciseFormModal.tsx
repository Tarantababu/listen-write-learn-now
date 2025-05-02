
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
import { toast } from 'sonner';

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
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
            toast.success(mode === 'create' ? 'Exercise created' : 'Exercise updated');
          }} 
        />
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseFormModal;
