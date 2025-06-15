
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
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileExerciseFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Exercise;
  mode: 'create' | 'edit';
}

export const MobileExerciseFormModal: React.FC<MobileExerciseFormModalProps> = ({
  isOpen,
  onOpenChange,
  initialValues,
  mode
}) => {
  const isMobile = useIsMobile();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={`
        ${isMobile 
          ? 'w-full h-full max-w-full max-h-full m-0 rounded-none p-4' 
          : 'max-w-md'
        }
      `}>
        <DialogHeader className={isMobile ? 'mb-4' : ''}>
          <DialogTitle className={isMobile ? 'text-xl' : 'text-lg'}>
            {mode === 'create' ? 'Create New Exercise' : 'Edit Exercise'}
          </DialogTitle>
          <DialogDescription className={isMobile ? 'text-base' : ''}>
            {mode === 'create' 
              ? 'Add a new exercise for dictation practice'
              : 'Update your exercise details'
            }
          </DialogDescription>
        </DialogHeader>
        <div className={isMobile ? 'flex-1 overflow-auto' : ''}>
          <ExerciseForm 
            initialValues={initialValues}
            onSuccess={() => {
              onOpenChange(false);
              toast({
                title: mode === 'create' ? "Exercise created" : "Exercise updated"
              });
            }} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
