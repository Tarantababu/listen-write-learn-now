import React, { useState, useEffect } from 'react';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useDirectoryContext } from '@/contexts/DirectoryContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Exercise, Language } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import PopoverHint from './PopoverHint';
import { useAudioProgress } from '@/hooks/useAudioProgress';
import { AudioProgressIndicator } from '@/components/AudioProgressIndicator';

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
  const { directories, currentDirectoryId } = useDirectoryContext();
  
  const [title, setTitle] = useState(initialValues?.title || '');
  const [text, setText] = useState(initialValues?.text || '');
  // Language is now set from user settings, but not shown in the form
  const language = initialValues?.language || settings.selectedLanguage;
  const [directoryId, setDirectoryId] = useState<string | null>(
    initialValues?.directoryId || currentDirectoryId
  );
  const [tags, setTags] = useState<string[]>(initialValues?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const {
    isGenerating: isGeneratingAudio,
    progress,
    estimatedTimeRemaining,
    stage,
    startProgress,
    completeProgress,
    resetProgress
  } = useAudioProgress();

  // Update directory when currentDirectoryId changes (for new exercises)
  useEffect(() => {
    if (!initialValues?.directoryId && currentDirectoryId !== directoryId) {
      setDirectoryId(currentDirectoryId);
    }
  }, [currentDirectoryId, initialValues?.directoryId, directoryId]);

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
      startProgress();
      toast.info(`Generating audio file...`);

      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text, 
          language
        }
      });

      if (error) {
        console.error('Error invoking text-to-speech function:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data received from text-to-speech function');
      }

      // Handle the correct response format: { audio_url: "..." }
      if (data.audio_url) {
        console.log('Audio generated successfully, URL:', data.audio_url);
        completeProgress();
        toast.success(`Audio file generated successfully`);
        return data.audio_url;
      }

      // Legacy fallback for old response format (backward compatibility)
      if (data.audioUrl) {
        console.log('Audio generated successfully (legacy format), URL:', data.audioUrl);
        toast.success(`Audio file generated successfully`);
        return data.audioUrl;
      }

      throw new Error('No audio URL received in response');
    } catch (error) {
      console.error('Error generating audio:', error);
      resetProgress();
      toast.error(`Failed to generate audio: ${error.message}`);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      // Generate audio - passing the current language for database association
      const audioUrl = await generateAudio(text, language);
      
      if (initialValues?.id) {
        // Update existing exercise
        await updateExercise(initialValues.id, {
          title,
          text,
          language,
          tags,
          directoryId,
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
          directoryId,
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

  // Build a directory path string for each directory
  const getDirectoryPath = (dirId: string | null): string => {
    if (!dirId) return "Root";
    
    let path = [];
    let currentId = dirId;
    
    while (currentId) {
      const dir = directories.find(d => d.id === currentId);
      if (!dir) break;
      
      path.unshift(dir.name);
      currentId = dir.parentId || null;
    }
    
    return path.join(" / ") || "Root";
  };

  // Language display names - keeping this for reference even though we don't show the dropdown anymore
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
      
      {/* Language selection div has been removed - language is now automatically set from user settings */}
      
      <div>
        <Label htmlFor="directory">Directory</Label>
        <Select 
          value={directoryId || "root"} 
          onValueChange={(value) => setDirectoryId(value === "root" ? null : value)}
          disabled={isSaving || isGeneratingAudio}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a directory" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="root">Root</SelectItem>
            {directories.map((dir) => (
              <SelectItem key={dir.id} value={dir.id}>
                {getDirectoryPath(dir.id)}
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
      
      {/* Audio Generation Progress */}
      {isGeneratingAudio && (
        <div className="p-4 bg-muted/30 rounded-lg">
          <AudioProgressIndicator
            isGenerating={isGeneratingAudio}
            progress={progress}
            estimatedTimeRemaining={estimatedTimeRemaining}
            stage={stage}
          />
        </div>
      )}
      
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
