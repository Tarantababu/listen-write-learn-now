
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Language } from '@/types';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { createDefaultExercise } from '@/services/defaultExerciseService';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PopoverHint from '@/components/PopoverHint';

const languages: Language[] = [
  'english',
  'german',
  'spanish',
  'french',
  'portuguese',
  'italian',
  'turkish',
  'swedish',
  'dutch',
  'norwegian',
  'russian',
  'polish',
  'chinese',
  'japanese',
  'korean',
  'arabic'
];

// Language display names
const languageDisplayNames: Record<Language, string> = {
  'english': 'English',
  'german': 'German (Deutsch)',
  'french': 'French (Français)',
  'spanish': 'Spanish (Español)',
  'portuguese': 'Portuguese (Português)',
  'italian': 'Italian (Italiano)',
  'dutch': 'Dutch (Nederlands)',
  'turkish': 'Turkish (Türkçe)',
  'swedish': 'Swedish (Svenska)',
  'norwegian': 'Norwegian (Norsk)',
  'russian': 'Russian (Русский)',
  'polish': 'Polish (Polski)',
  'chinese': 'Chinese (中文)',
  'japanese': 'Japanese (日本語)',
  'korean': 'Korean (한국어)',
  'arabic': 'Arabic (العربية)'
};

const DefaultExerciseForm: React.FC = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [language, setLanguage] = useState<Language>('english');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

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
      toast.info(`Generating audio file...`);

      // Note: We pass the selected language here for database association,
      // but the TTS function will use English voices internally
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
      
      const fileName = `default_exercise_${Date.now()}.mp3`;
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

      toast.success(`Audio file generated successfully`);
      return publicUrl;
    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error(`Failed to generate audio for the exercise`);
      return null;
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) return;

    try {
      setIsLoading(true);

      // Generate audio - passing the selected language for database association
      // but TTS function will use English voice regardless
      const audioUrl = await generateAudio(text, language);
      
      await createDefaultExercise(user.id, {
        title,
        text,
        language,
        tags,
        audioUrl
      });
      
      toast.success('Default exercise created successfully');
      
      // Reset form
      setTitle('');
      setText('');
      setLanguage('english');
      setTags([]);
      setTagInput('');
    } catch (error: any) {
      console.error('Error creating default exercise:', error);
      toast.error('Failed to create default exercise: ' + error.message);
    } finally {
      setIsLoading(false);
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
          placeholder="Enter a title for the default exercise"
          className={errors.title ? "border-destructive" : ""}
          disabled={isLoading || isGeneratingAudio}
        />
        {errors.title && (
          <p className="text-xs text-destructive mt-1">{errors.title}</p>
        )}
      </div>
      
      <div>
        <div className="flex items-center gap-2">
          <Label htmlFor="language">Language</Label>
          <PopoverHint side="top" align="start" className="w-80">
            <p className="text-sm">
              Select the language for this exercise. This is used for categorizing the exercise in the database.
              <strong> Audio will always be generated using English voices for optimal quality</strong>,
              regardless of the language selected here.
            </p>
          </PopoverHint>
        </div>
        <Select
          value={language}
          onValueChange={(value) => setLanguage(value as Language)}
          disabled={isLoading || isGeneratingAudio}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {languageDisplayNames[lang] || lang.charAt(0).toUpperCase() + lang.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="text">Exercise Text</Label>
        <Textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter the text for dictation practice"
          className={`min-h-32 ${errors.text ? "border-destructive" : ""}`}
          disabled={isLoading || isGeneratingAudio}
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
            placeholder="Add tags (e.g., beginner, grammar)"
            disabled={isLoading || isGeneratingAudio}
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleAddTag}
            disabled={isLoading || isGeneratingAudio}
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
                  disabled={isLoading || isGeneratingAudio}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || isGeneratingAudio}>
          {(isLoading || isGeneratingAudio) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isGeneratingAudio 
            ? 'Generating Audio...' 
            : isLoading 
              ? 'Creating...' 
              : 'Create Default Exercise'
          }
        </Button>
      </div>
    </form>
  );
};

export default DefaultExerciseForm;
