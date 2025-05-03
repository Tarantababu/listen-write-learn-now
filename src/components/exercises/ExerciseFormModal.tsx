
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import ExerciseForm from '@/components/ExerciseForm';
import { Exercise } from '@/types';
import { toast } from 'sonner';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

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
  const { exercises } = useExerciseContext();
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  
  const isPremium = subscription.isSubscribed && subscription.subscriptionTier === 'premium';
  const reachedLimit = !isPremium && exercises.length >= 3 && mode === 'create';
  
  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/dashboard/subscription');
  };

  if (reachedLimit) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Subscription Required</DialogTitle>
            <DialogDescription>
              You've reached the maximum of 3 exercises for free accounts. Upgrade to premium for unlimited exercises.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpgrade} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
              Upgrade to Premium
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

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
