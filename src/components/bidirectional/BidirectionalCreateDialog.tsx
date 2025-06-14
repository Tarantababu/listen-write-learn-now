
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Crown, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useToast } from '@/hooks/use-toast';
import { LanguageSelectWithFlag } from './LanguageSelectWithFlag';
import { CreateExerciseProgress } from './CreateExerciseProgress';
import { useCreateExerciseProgress } from '@/hooks/use-create-exercise-progress';
import { BidirectionalService } from '@/services/bidirectionalService';
import { FlagIcon } from 'react-flag-kit';
import { getLanguageFlagCode } from '@/utils/languageUtils';

interface BidirectionalCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseCreated: () => void;
  exerciseLimit: {
    canCreate: boolean;
    currentCount: number;
    limit: number;
  };
  targetLanguage: string;
  supportedLanguages: Array<{ value: string; label: string }>;
  prefilledText?: string; // New prop for pre-filling the text
}

const CREATION_STEPS = [
  {
    id: 'validation',
    label: 'Validating Input',
    description: 'Checking sentence and language settings',
    estimatedTime: 1
  },
  {
    id: 'translation',
    label: 'Generating Translations',
    description: 'Creating normal and literal translations',
    estimatedTime: 8
  },
  {
    id: 'database',
    label: 'Saving Exercise',
    description: 'Storing exercise in database',
    estimatedTime: 2
  },
  {
    id: 'audio_original',
    label: 'Generating Original Audio',
    description: 'Creating audio for original sentence',
    estimatedTime: 5
  },
  {
    id: 'audio_translations',
    label: 'Generating Translation Audio',
    description: 'Creating audio for translations',
    estimatedTime: 8
  }
];

export const BidirectionalCreateDialog: React.FC<BidirectionalCreateDialogProps> = ({
  isOpen,
  onClose,
  onExerciseCreated,
  exerciseLimit,
  targetLanguage,
  supportedLanguages,
  prefilledText = ''
}) => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  const { subscription } = useSubscription();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    original_sentence: '',
    target_language: targetLanguage,
    support_language: 'english'
  });

  // Update form data when prefilledText or targetLanguage changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      original_sentence: prefilledText,
      target_language: targetLanguage
    }));
  }, [prefilledText, targetLanguage]);

  const {
    steps,
    currentStepIndex,
    isActive,
    elapsedTime,
    overallProgress,
    totalEstimatedTime,
    initializeSteps,
    startStep,
    completeStep,
    errorStep,
    completeAll,
    cancel,
    reset
  } = useCreateExerciseProgress({
    onComplete: () => {
      toast({
        title: "Success",
        description: "Translation exercise created successfully!"
      });
      handleClose();
      onExerciseCreated();
    },
    onError: (error, step) => {
      console.error(`Error in step ${step}:`, error);
      toast({
        title: "Error",
        description: `Failed during ${step}. Please try again.`,
        variant: "destructive"
      });
    },
    onCancel: () => {
      toast({
        title: "Cancelled",
        description: "Exercise creation was cancelled."
      });
      handleClose();
    }
  });

  const handleClose = () => {
    if (isActive) {
      cancel();
    } else {
      reset();
      setFormData({
        original_sentence: '',
        target_language: targetLanguage,
        support_language: 'english'
      });
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !formData.original_sentence.trim()) {
      toast({
        title: "Error",
        description: "Please enter a sentence to translate.",
        variant: "destructive"
      });
      return;
    }

    if (!exerciseLimit.canCreate && !subscription.isSubscribed) {
      toast({
        title: "Exercise Limit Reached",
        description: `You've reached the limit of ${exerciseLimit.limit} exercises. Upgrade to premium for unlimited exercises.`,
        variant: "destructive"
      });
      return;
    }

    try {
      // Initialize progress tracking
      initializeSteps(CREATION_STEPS);

      // Step 1: Validation
      startStep('validation');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate validation
      completeStep('validation');

      // Step 2: Create exercise with translations
      startStep('translation');
      const exercise = await BidirectionalService.createExercise(formData);
      completeStep('translation');

      // Step 3: Database operations
      startStep('database');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Database is already done, but show progress
      completeStep('database');

      // Step 4: Audio generation (original)
      startStep('audio_original');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Audio generation happens in createExercise
      completeStep('audio_original');

      // Step 5: Audio generation (translations)
      startStep('audio_translations');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Audio generation happens in createExercise
      completeStep('audio_translations');

      // Complete all steps
      completeAll();

    } catch (error) {
      const currentStep = steps[currentStepIndex]?.id || 'unknown';
      errorStep(currentStep, error as Error);
    }
  };

  const getLanguageLabel = (languageValue: string) => {
    const lang = supportedLanguages.find(l => l.value === languageValue);
    return lang ? lang.label : languageValue;
  };

  const cannotCreate = !subscription.isSubscribed && !exerciseLimit.canCreate;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {prefilledText ? 'Create Translation Exercise from Selection' : 'Create New Exercise'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={isActive}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {isActive ? (
          // Progress View
          <div className="space-y-4">
            <CreateExerciseProgress
              steps={steps}
              currentStepIndex={currentStepIndex}
              overallProgress={overallProgress}
              totalEstimatedTime={totalEstimatedTime}
              elapsedTime={elapsedTime}
              canCancel={true}
              onCancel={cancel}
            />
          </div>
        ) : (
          // Form View
          <div className="space-y-4">
            {prefilledText && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Selected Text
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 break-words">
                  "{prefilledText}"
                </p>
              </div>
            )}

            {cannotCreate && (
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <h4 className="font-medium text-orange-800 dark:text-orange-200">
                    Exercise Limit Reached
                  </h4>
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                  You've created {exerciseLimit.limit} exercises for {getLanguageLabel(targetLanguage)}. 
                  Upgrade to premium to create unlimited exercises.
                </p>
                <Button variant="outline" className="text-orange-600 border-orange-300 hover:bg-orange-50">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Premium
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Target Language (sentence language)</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <FlagIcon code={getLanguageFlagCode(targetLanguage)} size={16} />
                  <span className="text-sm font-medium">{getLanguageLabel(targetLanguage)}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    Set in account settings
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="support_language">Support Language (translation language)</Label>
                <LanguageSelectWithFlag
                  value={formData.support_language}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, support_language: value }))}
                  options={supportedLanguages}
                  disabled={cannotCreate}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="original_sentence">Original Sentence</Label>
                <Textarea
                  id="original_sentence"
                  value={formData.original_sentence}
                  onChange={(e) => setFormData(prev => ({ ...prev, original_sentence: e.target.value }))}
                  placeholder={`Enter a sentence in ${getLanguageLabel(targetLanguage)}...`}
                  rows={3}
                  required
                  disabled={cannotCreate}
                />
                {formData.original_sentence.trim() && (
                  <div className="text-xs text-muted-foreground">
                    Estimated creation time: ~{totalEstimatedTime}s
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={cannotCreate || !formData.original_sentence.trim()}
                >
                  Create Exercise
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
