
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { toast } from 'sonner';

interface CreateShadowingExerciseModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateExercise: (exerciseData: any) => Promise<void>;
}

export const CreateShadowingExerciseModal: React.FC<CreateShadowingExerciseModalProps> = ({
  isOpen,
  onOpenChange,
  onCreateExercise,
}) => {
  const { settings } = useUserSettingsContext();
  const [formData, setFormData] = useState({
    title: '',
    difficulty_level: 'beginner',
    source_type: 'custom_text',
    custom_text: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!formData.custom_text.trim()) {
      toast.error('Please enter some text');
      return;
    }

    setIsSubmitting(true);

    try {
      // Split text into sentences
      const sentences = formData.custom_text
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map((text, index) => ({
          index,
          text,
          audio_url: null,
        }));

      if (sentences.length === 0) {
        toast.error('No sentences found in the text');
        return;
      }

      const exerciseData = {
        title: formData.title,
        language: settings.selectedLanguage,
        difficulty_level: formData.difficulty_level,
        source_type: formData.source_type,
        custom_text: formData.custom_text,
        sentences,
        archived: false,
      };

      await onCreateExercise(exerciseData);
      
      // Reset form
      setFormData({
        title: '',
        difficulty_level: 'beginner',
        source_type: 'custom_text',
        custom_text: '',
      });
      
      toast.success('Shadowing exercise created successfully!');
    } catch (error) {
      console.error('Error creating exercise:', error);
      toast.error('Failed to create exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Shadowing Exercise</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Exercise Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter exercise title..."
              required
            />
          </div>

          <div>
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select
              value={formData.difficulty_level}
              onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="text">Text Content</Label>
            <Textarea
              id="text"
              value={formData.custom_text}
              onChange={(e) => setFormData({ ...formData, custom_text: e.target.value })}
              placeholder="Enter the text you want to practice shadowing. It will be automatically split into sentences..."
              rows={8}
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              Text will be automatically split into sentences for shadowing practice.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Exercise'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
