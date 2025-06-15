
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
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useEnhancedAudioProgress } from '@/hooks/useEnhancedAudioProgress';
import { EnhancedAudioProgressIndicator } from '@/components/EnhancedAudioProgressIndicator';
import { enhancedAudioService } from '@/services/enhancedAudioService';

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
  const language = initialValues?.language || settings.selectedLanguage;
  const [directoryId, setDirectoryId] = useState<string | null>(
    initialValues?.directoryId || currentDirectoryId
  );
  const [tags, setTags] = useState<string[]>(initialValues?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const audioState = useEnhancedAudioProgress();

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
      audioState.startProgress(enhancedAudioService['estimateGenerationTime'](text.length));
      
      const result = await enhancedAudioService.generateSingleAudio(text, language, {
        quality: 'standard',
        priority: 'high'
      });

      if (result.success) {
        audioState.completeProgress();
        return result.audioUrl || null;
      } else {
        audioState.setError(result.error || 'Audio generation failed');
        return null;
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      audioState.setError(error.message || 'Audio generation failed');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      // Generate audio with enhanced service
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

  const handleRetryAudio = () => {
    audioState.resetProgress();
    generateAudio(text, language);
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

  const isFormDisabled = isSaving || audioState.isGenerating;

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
          disabled={isFormDisabled}
        />
        {errors.title && (
          <p className="text-xs text-destructive mt-1">{errors.title}</p>
        )}
      </div>
      
      <div>
        <Label htmlFor="directory">Directory</Label>
        <Select 
          value={directoryId || "root"} 
          onValueChange={(value) => setDirectoryId(value === "root" ? null : value)}
          disabled={isFormDisabled}
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
          disabled={isFormDisabled}
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
            disabled={isFormDisabled}
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleAddTag}
            disabled={isFormDisabled}
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
                  disabled={isFormDisabled}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Enhanced Audio Generation Progress */}
      {(audioState.isGenerating || audioState.error || audioState.stage === 'complete') && (
        <EnhancedAudioProgressIndicator
          state={audioState}
          onCancel={audioState.cancelProgress}
          onRetry={handleRetryAudio}
        />
      )}
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isFormDisabled}>
          {isFormDisabled && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {initialValues?.id 
            ? audioState.isGenerating 
              ? 'Generating Audio...' 
              : isSaving 
                ? 'Updating...' 
                : 'Update Exercise'
            : audioState.isGenerating 
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
