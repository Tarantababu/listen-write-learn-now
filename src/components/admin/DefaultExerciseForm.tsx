
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { defaultExerciseService } from '@/services/defaultExerciseService';
import { Language, LanguageLevel } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  text: z.string().min(10, 'Text must be at least 10 characters'),
  language: z.enum(['english', 'german', 'french', 'spanish', 'italian', 'portuguese', 'dutch', 'swedish', 'norwegian', 'turkish', 'russian', 'polish', 'chinese', 'japanese', 'korean', 'hindi', 'arabic']),
  level: z.enum(['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7']),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface DefaultExerciseFormProps {
  onSuccess: () => void;
}

const DefaultExerciseForm: React.FC<DefaultExerciseFormProps> = ({ onSuccess }) => {
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  
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
    'hindi': 'Hindi (हिन्दी)',
    'arabic': 'Arabic (العربية)'
  };

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsGeneratingAudio(true);
      toast('Generating audio file...');

      const { data: audioData, error: audioError } = await supabase.functions.invoke('text-to-speech', {
        body: { text: data.text, language: data.language }
      });

      if (audioError) {
        console.error('Error invoking text-to-speech function:', audioError);
        throw audioError;
      }

      if (!audioData || !audioData.audioContent) {
        throw new Error('No audio content received');
      }

      const audioContent = audioData.audioContent;
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

      toast('Audio file generated successfully');

      await defaultExerciseService.createDefaultExercise({
        title: data.title,
        text: data.text,
        language: data.language,
        level: data.level,
        tags: data.tags || '',
        audioUrl: publicUrl
      });

      toast('Default exercise created successfully');
      onSuccess();
    } catch (error) {
      console.error('Error creating default exercise:', error);
      toast('Failed to create the default exercise');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Exercise Title</Label>
        <Input
          id="title"
          placeholder="Enter a title for your exercise"
          {...register('title')}
          className={errors.title ? "border-destructive" : ""}
        />
        {errors.title && (
          <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="language">Language</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select a language" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(languageDisplayNames).map(([lang, displayName]) => (
              <SelectItem key={lang} value={lang as Language} {...register('language')}>
                {displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.language && (
          <p className="text-xs text-destructive mt-1">{errors.language.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="level">Level</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select a level" />
          </SelectTrigger>
          <SelectContent>
            {['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7'].map(level => (
              <SelectItem key={level} value={level} {...register('level')}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.level && (
          <p className="text-xs text-destructive mt-1">{errors.level.message}</p>
        )}
      </div>
      
      <div>
        <Label htmlFor="text">Exercise Text</Label>
        <Textarea
          id="text"
          placeholder="Enter the text for dictation practice"
          className={`min-h-32 ${errors.text ? "border-destructive" : ""}`}
          {...register('text')}
        />
        {errors.text && (
          <p className="text-xs text-destructive mt-1">{errors.text.message}</p>
        )}
      </div>
      
      <div>
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          placeholder="Add tags (e.g., travel, grammar)"
          {...register('tags')}
        />
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isGeneratingAudio}>
          {isGeneratingAudio && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isGeneratingAudio ? 'Generating Audio...' : 'Create Exercise'}
        </Button>
      </div>
    </form>
  );
};

export default DefaultExerciseForm;
