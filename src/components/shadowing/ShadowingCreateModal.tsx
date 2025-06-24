
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';

interface ReadingExercise {
  id: string;
  title: string;
  content: any;
}

interface ShadowingCreateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ShadowingCreateModal: React.FC<ShadowingCreateModalProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  const [loading, setLoading] = useState(false);
  const [readingExercises, setReadingExercises] = useState<ReadingExercise[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    sourceType: 'custom' as 'custom' | 'reading',
    customText: '',
    selectedReadingExercise: '',
    difficultyLevel: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
  });

  useEffect(() => {
    if (isOpen) {
      fetchReadingExercises();
    }
  }, [isOpen]);

  const fetchReadingExercises = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reading_exercises')
        .select('id, title, content')
        .eq('user_id', user.id)
        .eq('language', settings.selectedLanguage)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReadingExercises(data || []);
    } catch (error) {
      console.error('Error fetching reading exercises:', error);
    }
  };

  const extractSentencesFromText = (text: string) => {
    return text
      .split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0)
      .map(sentence => ({ text: sentence + '.' }));
  };

  const extractSentencesFromReading = (readingExercise: ReadingExercise) => {
    try {
      const content = readingExercise.content;
      if (content && content.sentences) {
        return content.sentences.map((sentence: any) => ({
          text: sentence.text || sentence
        }));
      }
      
      // Fallback: extract from content text
      const text = content?.text || '';
      return extractSentencesFromText(text);
    } catch (error) {
      console.error('Error extracting sentences from reading exercise:', error);
      return [];
    }
  };

  const handleCreate = async () => {
    if (!user) return;

    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    let sentences = [];

    if (formData.sourceType === 'custom') {
      if (!formData.customText.trim()) {
        toast.error('Please enter custom text');
        return;
      }
      sentences = extractSentencesFromText(formData.customText);
    } else {
      if (!formData.selectedReadingExercise) {
        toast.error('Please select a reading exercise');
        return;
      }
      const selectedExercise = readingExercises.find(ex => ex.id === formData.selectedReadingExercise);
      if (selectedExercise) {
        sentences = extractSentencesFromReading(selectedExercise);
      }
    }

    if (sentences.length === 0) {
      toast.error('No sentences found in the text');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('shadowing_exercises')
        .insert({
          user_id: user.id,
          title: formData.title,
          language: settings.selectedLanguage,
          difficulty_level: formData.difficultyLevel,
          source_type: formData.sourceType,
          custom_text: formData.sourceType === 'custom' ? formData.customText : null,
          source_reading_exercise_id: formData.sourceType === 'reading' ? formData.selectedReadingExercise : null,
          sentences: sentences,
        });

      if (error) throw error;

      toast.success('Shadowing exercise created successfully!');
      onSuccess();
      
      // Reset form
      setFormData({
        title: '',
        sourceType: 'custom',
        customText: '',
        selectedReadingExercise: '',
        difficultyLevel: 'beginner',
      });
    } catch (error) {
      console.error('Error creating shadowing exercise:', error);
      toast.error('Failed to create shadowing exercise');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Shadowing Exercise</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Exercise Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter exercise title"
            />
          </div>

          {/* Difficulty Level */}
          <div className="space-y-2">
            <Label>Difficulty Level</Label>
            <Select
              value={formData.difficultyLevel}
              onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                setFormData(prev => ({ ...prev, difficultyLevel: value }))
              }
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

          {/* Source Selection */}
          <Accordion type="single" value={formData.sourceType} className="w-full">
            <AccordionItem value="custom">
              <AccordionTrigger 
                onClick={() => setFormData(prev => ({ ...prev, sourceType: 'custom' }))}
                className="hover:no-underline"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.sourceType === 'custom'}
                    onChange={() => setFormData(prev => ({ ...prev, sourceType: 'custom' }))}
                    className="mr-2"
                  />
                  Custom Text
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customText">Enter your text</Label>
                  <Textarea
                    id="customText"
                    value={formData.customText}
                    onChange={(e) => setFormData(prev => ({ ...prev, customText: e.target.value }))}
                    placeholder="Enter the text you want to practice shadowing..."
                    rows={6}
                  />
                  <p className="text-sm text-muted-foreground">
                    The text will be automatically split into sentences for shadowing practice.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="reading">
              <AccordionTrigger 
                onClick={() => setFormData(prev => ({ ...prev, sourceType: 'reading' }))}
                className="hover:no-underline"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.sourceType === 'reading'}
                    onChange={() => setFormData(prev => ({ ...prev, sourceType: 'reading' }))}
                    className="mr-2"
                  />
                  From Reading Exercise
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                {readingExercises.length > 0 ? (
                  <div className="space-y-2">
                    <Label>Select Reading Exercise</Label>
                    <Select
                      value={formData.selectedReadingExercise}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, selectedReadingExercise: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a reading exercise" />
                      </SelectTrigger>
                      <SelectContent>
                        {readingExercises.map((exercise) => (
                          <SelectItem key={exercise.id} value={exercise.id}>
                            {exercise.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">
                        No reading exercises found. Create a reading exercise first to use this option.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? 'Creating...' : 'Create Exercise'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShadowingCreateModal;
