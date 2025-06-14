
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, Volume2, Brain } from 'lucide-react';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { readingExerciseService } from '@/services/readingExerciseService';
import { toast } from 'sonner';

interface ReadingExerciseModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ReadingExerciseModal: React.FC<ReadingExerciseModalProps> = ({
  isOpen,
  onOpenChange,
  onSuccess
}) => {
  const { settings } = useUserSettingsContext();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    difficulty_level: 'beginner' as const,
    target_length: 100,
    grammar_focus: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await readingExerciseService.createReadingExercise({
        ...formData,
        language: settings.selectedLanguage
      });
      
      toast.success('Reading exercise created successfully!');
      onSuccess();
      onOpenChange(false);
      setFormData({
        title: '',
        topic: '',
        difficulty_level: 'beginner',
        target_length: 100,
        grammar_focus: ''
      });
    } catch (error) {
      console.error('Error creating reading exercise:', error);
      toast.error('Failed to create reading exercise. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Create Reading & Listening Exercise
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Feature highlights */}
          <div className="grid gap-3 md:grid-cols-3">
            <Card className="p-4">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  AI-Generated Content
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <CardDescription className="text-xs">
                  Custom reading passages tailored to your level and interests
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Audio Support
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <CardDescription className="text-xs">
                  Listen to native pronunciation for each sentence
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Deep Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <CardDescription className="text-xs">
                  Word definitions, grammar explanations, and translations
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Exercise Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Daily Routines in Paris"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={formData.difficulty_level}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, difficulty_level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner (A1-A2)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (B1-B2)</SelectItem>
                    <SelectItem value="advanced">Advanced (C1-C2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic or Theme</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="e.g., traveling, food culture, environmental issues"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="length">Target Length (words)</Label>
                <Select
                  value={formData.target_length.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, target_length: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="80">Short (80 words)</SelectItem>
                    <SelectItem value="120">Medium (120 words)</SelectItem>
                    <SelectItem value="200">Long (200 words)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grammar">Grammar Focus (Optional)</Label>
                <Input
                  id="grammar"
                  value={formData.grammar_focus}
                  onChange={(e) => setFormData(prev => ({ ...prev, grammar_focus: e.target.value }))}
                  placeholder="e.g., past tense, conditionals"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Exercise'
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
