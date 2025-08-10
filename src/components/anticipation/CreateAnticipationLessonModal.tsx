
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { CreateLessonRequest, DifficultyLevel, AnticipationLesson } from '@/types/anticipation';
import { AnticipationService } from '@/services/anticipationService';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { toast } from 'sonner';

interface CreateAnticipationLessonModalProps {
  onClose: () => void;
  onLessonCreated: (lesson: AnticipationLesson) => void;
}

const difficultyLevels: DifficultyLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const conversationThemes = [
  'Family and Relationships',
  'Food and Dining',
  'Travel and Transportation',
  'Work and Career',
  'Health and Wellness',
  'Education and Learning',
  'Shopping and Money',
  'Weather and Seasons',
  'Hobbies and Entertainment',
  'Technology and Communication',
  'Culture and Traditions',
  'Sports and Fitness',
  'Environment and Nature',
  'Daily Routines',
  'Social Events and Celebrations'
];

export const CreateAnticipationLessonModal: React.FC<CreateAnticipationLessonModalProps> = ({
  onClose,
  onLessonCreated
}) => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  
  const [conversationTheme, setConversationTheme] = useState('');
  const [customTheme, setCustomTheme] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>('A1');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to create lessons');
      return;
    }

    const finalTheme = conversationTheme === 'custom' ? customTheme : conversationTheme;
    
    if (!finalTheme.trim()) {
      toast.error('Please select or enter a conversation theme');
      return;
    }

    setIsCreating(true);

    try {
      const request: CreateLessonRequest = {
        targetLanguage: settings.selectedLanguage,
        conversationTheme: finalTheme,
        difficultyLevel
      };

      const newLesson = await AnticipationService.createLesson(request, user.id);
      onLessonCreated(newLesson);
    } catch (error) {
      console.error('Failed to create lesson:', error);
      toast.error('Failed to create lesson. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Anticipation Lesson</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select value={difficultyLevel} onValueChange={(value: DifficultyLevel) => setDifficultyLevel(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty level" />
              </SelectTrigger>
              <SelectContent>
                {difficultyLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level} - {level === 'A1' ? 'Beginner' : 
                          level === 'A2' ? 'Elementary' :
                          level === 'B1' ? 'Intermediate' :
                          level === 'B2' ? 'Upper Intermediate' :
                          level === 'C1' ? 'Advanced' : 'Proficiency'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="theme">Conversation Theme</Label>
            <Select value={conversationTheme} onValueChange={setConversationTheme}>
              <SelectTrigger>
                <SelectValue placeholder="Select a conversation theme" />
              </SelectTrigger>
              <SelectContent>
                {conversationThemes.map((theme) => (
                  <SelectItem key={theme} value={theme}>
                    {theme}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom Theme...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {conversationTheme === 'custom' && (
            <div>
              <Label htmlFor="customTheme">Custom Theme</Label>
              <Input
                id="customTheme"
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                placeholder="Enter your custom conversation theme"
                required
              />
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p><strong>Target Language:</strong> {settings.selectedLanguage.charAt(0).toUpperCase() + settings.selectedLanguage.slice(1)}</p>
            <p className="mt-1">The lesson will be created for this language based on your settings.</p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !conversationTheme}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreating ? 'Creating...' : 'Create Lesson'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
