
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
import { useExerciseContext } from '@/contexts/ExerciseContext';
import UpgradePrompt from '@/components/UpgradePrompt';
import { useModalState } from '@/hooks/useModalState';

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
  const { canCreateMore, canEdit, exerciseLimit } = useExerciseContext();
  
  // Use our persistent modal state
  const [isModalOpen, setModalOpen, handleModalOpenChange] = 
    useModalState(`exercise-form-${initialValues?.id || mode}`, isOpen);
    
  // Sync parent state with our URL-based state
  React.useEffect(() => {
    if (isOpen !== isModalOpen) {
      setModalOpen(isOpen);
    }
  }, [isOpen, isModalOpen, setModalOpen]);
  
  React.useEffect(() => {
    if (onOpenChange && isModalOpen !== isOpen) {
      onOpenChange(isModalOpen);
    }
  }, [isModalOpen, isOpen, onOpenChange]);

  // Check if user can perform the action based on subscription
  const canPerformAction = mode === 'create' ? canCreateMore : canEdit;

  // Handle modal open state change
  const handleOpenChange = (open: boolean) => {
    handleModalOpenChange(open);
  };

  if (!canPerformAction) {
    // Show upgrade prompt instead of form
    return (
      <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Premium Subscription Required' : 'Upgrade to Edit'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create' 
                ? `You've reached the limit of ${exerciseLimit} exercises.`
                : 'Editing exercises is a premium feature.'}
            </DialogDescription>
          </DialogHeader>
          <UpgradePrompt
            message={mode === 'create'
              ? "Upgrade to premium for unlimited exercises and full editing capabilities."
              : "Premium subscribers can edit their exercises anytime. Upgrade now to unlock this feature."}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
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
            handleOpenChange(false);
            toast.success(mode === 'create' ? 'Exercise created' : 'Exercise updated');
          }} 
        />
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseFormModal;
