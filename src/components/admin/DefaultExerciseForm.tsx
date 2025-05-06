
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  'norwegian'
];

const DefaultExerciseForm: React.FC = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [language, setLanguage] = useState<Language>('english');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) return;

    try {
      setIsLoading(true);

      await createDefaultExercise(user.id, {
        title,
        text,
        language,
        tags,
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
          disabled={isLoading}
        />
        {errors.title && (
          <p className="text-xs text-destructive mt-1">{errors.title}</p>
        )}
      </div>
      
      <div>
        <Label htmlFor="language">Language</Label>
        <Select
          value={language}
          onValueChange={(value) => setLanguage(value as Language)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
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
          disabled={isLoading}
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
            disabled={isLoading}
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleAddTag}
            disabled={isLoading}
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
                  disabled={isLoading}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Default Exercise
        </Button>
      </div>
    </form>
  );
};

export default DefaultExerciseForm;
