
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { BidirectionalService } from '@/services/bidirectionalService';
import { useToast } from '@/hooks/use-toast';
import { LanguageSelectWithFlag } from './LanguageSelectWithFlag';

interface BidirectionalCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseCreated: () => void;
}

export const BidirectionalCreateModal: React.FC<BidirectionalCreateModalProps> = ({
  isOpen,
  onClose,
  onExerciseCreated
}) => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  const { subscription } = useSubscription();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    original_sentence: '',
    target_language: settings.selectedLanguage || 'Spanish',
    support_language: 'English'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !formData.original_sentence.trim()) return;

    try {
      setIsLoading(true);

      // Check if user can create more exercises
      const { canCreate, currentCount, limit } = await BidirectionalService.canCreateExercise(
        user.id,
        formData.target_language,
        subscription.isSubscribed
      );

      if (!canCreate) {
        toast({
          title: "Exercise Limit Reached",
          description: `You have reached your limit of ${limit} exercises for ${formData.target_language}. Upgrade to premium for unlimited exercises.`,
          variant: "destructive"
        });
        return;
      }

      await BidirectionalService.createExercise(formData);
      
      toast({
        title: "Success",
        description: "Exercise created successfully!"
      });

      setFormData({
        original_sentence: '',
        target_language: settings.selectedLanguage || 'Spanish',
        support_language: 'English'
      });

      onExerciseCreated();
    } catch (error) {
      console.error('Error creating exercise:', error);
      toast({
        title: "Error",
        description: "Failed to create exercise. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Exercise</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target_language">Target Language</Label>
            <LanguageSelectWithFlag
              value={formData.target_language}
              onValueChange={(value) => setFormData(prev => ({ ...prev, target_language: value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support_language">Support Language</Label>
            <LanguageSelectWithFlag
              value={formData.support_language}
              onValueChange={(value) => setFormData(prev => ({ ...prev, support_language: value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="original_sentence">Original Sentence</Label>
            <Textarea
              id="original_sentence"
              value={formData.original_sentence}
              onChange={(e) => setFormData(prev => ({ ...prev, original_sentence: e.target.value }))}
              placeholder={`Enter a sentence in ${formData.target_language}...`}
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.original_sentence.trim()}>
              {isLoading ? 'Creating...' : 'Create Exercise'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
