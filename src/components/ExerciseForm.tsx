
import React, { useState } from 'react';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Exercise, Language } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ExerciseFormProps {
  onSuccess?: () => void;
  initialValues?: Partial<Exercise>;
}

const ExerciseForm: React.FC<ExerciseFormProps> = ({ 
  onSuccess,
  initialValues
}) => {
  const { settings } = useUserSettingsContext();
  const { addExercise, updateExercise } = useExerciseContext();
  
  const [title, setTitle] = useState(initialValues?.title || '');
  const [text, setText] = useState(initialValues?.text || '');
  const [language, setLanguage] = useState<Language>(
    initialValues?.language || settings.selectedLanguage
  );
  const [tags, setTags] = useState<string[]>(initialValues?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!text.trim()) {
      newErrors.text = 'Text is required';
    } else if (text.trim().length < 10) {
      newErrors.text = 'Text must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const generateAudio = async (text: string, language: Language): Promise<string | null> => {
    try {
      setIsGeneratingAudio(true);
      toast.info('Generating audio file...');

      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, language }
      });

      if (error) {
        console.error('Error invoking text-to-speech function:', error);
        throw error;
      }

      if (!data || !data.audioContent) {
        throw new Error('No audio content received');
      }

      const audioContent = data.audioContent;
      const blob = await fetch(`data:audio/mp3;base64,${audioContent}`).then(res => res.blob());
      
      const fileName = `exercise_${Date.now()}.mp3`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio')
        .upload(fileName, blob, {
          contentType: 'audio/mp3'
        });

      if (uploadError) {
        console.error('Error uploading audio:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('audio')
        .getPublicUrl(fileName);

      toast.success('Audio file generated successfully');
      return publicUrl;
    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error('Failed to generate audio for the exercise');
      return null;
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      // Generate audio
      const audioUrl = await generateAudio(text, language);
      
      if (initialValues?.id) {
        // Update existing exercise
        await updateExercise(initialValues.id, {
          title,
          text,
          language,
          tags,
          ...(audioUrl && { audioUrl })
        });
        toast.success('Exercise updated successfully');
      } else {
        // Add new exercise
        await addExercise({
          title,
          text,
          language,
          tags,
          ...(audioUrl && { audioUrl })
        });
        toast.success('Exercise created successfully');
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving exercise:', error);
      toast.error('Failed to save the exercise');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Exercise Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title for your exercise"
          className={errors.title ? "border-destructive" : ""}
          disabled={isSaving || isGeneratingAudio}
        />
        {errors.title && (
          <p className="text-xs text-destructive mt-1">{errors.title}</p>
        )}
      </div>
      
      <div>
        <Label htmlFor="language">Language</Label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          disabled={isSaving || isGeneratingAudio}
        >
          {settings.learningLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <Label htmlFor="text">Exercise Text</Label>
        <Textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter the text for dictation practice"
          className={`min-h-32 ${errors.text ? "border-destructive" : ""}`}
          disabled={isSaving || isGeneratingAudio}
        />
        {errors.text && (
          <p className="text-xs text-destructive mt-1">{errors.text}</p>
        )}
      </div>
      
      <div>
        <Label htmlFor="tags">Tags</Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add tags (e.g., travel, grammar)"
            disabled={isSaving || isGeneratingAudio}
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleAddTag}
            disabled={isSaving || isGeneratingAudio}
          >
            Add
          </Button>
        </div>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map(tag => (
              <div
                key={tag}
                className="bg-muted px-2 py-1 rounded-md text-xs flex items-center gap-1"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-muted-foreground hover:text-destructive"
                  disabled={isSaving || isGeneratingAudio}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving || isGeneratingAudio}>
          {(isSaving || isGeneratingAudio) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {initialValues?.id 
            ? isGeneratingAudio 
              ? 'Generating Audio...' 
              : isSaving 
                ? 'Updating...' 
                : 'Update Exercise'
            : isGeneratingAudio 
              ? 'Generating Audio...' 
              : isSaving 
                ? 'Creating...' 
                : 'Create Exercise'
          }
        </Button>
      </div>
    </form>
  );
};

export default ExerciseForm;
