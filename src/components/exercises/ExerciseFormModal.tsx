
import React from 'react';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PersistentDialog } from '@/components/ui/persistent-dialog';
import ExerciseForm from '@/components/ExerciseForm';
import { Exercise } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import UpgradePrompt from '@/components/UpgradePrompt';

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

  // Generate a unique persistence key
  const getPersistenceKey = () => {
    return initialValues ? `exercise_form_${initialValues.id}` : 'exercise_form_new';
  };

  // Check if user can perform the action based on subscription
  const canPerformAction = mode === 'create' ? canCreateMore : canEdit;

  if (!canPerformAction) {
    // Show upgrade prompt instead of form
    return (
      <PersistentDialog 
        persistenceKey={`upgrade_${mode}`}
        initialOpen={isOpen} 
        onOpenChange={onOpenChange}
      >
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
      </PersistentDialog>
    );
  }

  return (
    <PersistentDialog 
      persistenceKey={getPersistenceKey()}
      initialOpen={isOpen} 
      onOpenChange={onOpenChange}
      persistenceTtl={30 * 60 * 1000} // 30 minutes TTL for forms
    >
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
            toast({
              title: mode === 'create' ? "Exercise created" : "Exercise updated"
            });
          }} 
        />
      </DialogContent>
    </PersistentDialog>
  );
};

export default ExerciseFormModal;
