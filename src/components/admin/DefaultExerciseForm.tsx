
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Language, LanguageLevel } from '@/types';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  text: z.string().min(1, 'Text is required'),
  language: z.enum(['english', 'spanish', 'french', 'german', 'italian', 'portuguese']),
  level: z.enum(['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  audio_url: z.string().optional(),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface DefaultExerciseFormProps {
  exerciseToEdit?: {
    id: string;
    title: string;
    text: string;
    language: Language;
    level?: LanguageLevel;
    audio_url?: string;
    tags?: string[];
  };
  onSuccess?: () => void;
}

const DefaultExerciseForm: React.FC<DefaultExerciseFormProps> = ({ exerciseToEdit, onSuccess }) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: exerciseToEdit?.title || '',
      text: exerciseToEdit?.text || '',
      language: exerciseToEdit?.language || 'english',
      level: exerciseToEdit?.level || 'A1',
      audio_url: exerciseToEdit?.audio_url || '',
      tags: exerciseToEdit?.tags ? exerciseToEdit.tags.join(', ') : '',
    }
  });
  
  const isEditMode = !!exerciseToEdit;
  
  const onSubmit = async (data: FormValues) => {
    try {
      const formattedData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
      };
      
      let result;
      
      if (isEditMode) {
        result = await supabase
          .from('default_exercises')
          .update(formattedData)
          .eq('id', exerciseToEdit.id);
      } else {
        result = await supabase
          .from('default_exercises')
          .insert(formattedData);
      }
      
      if (result.error) {
        throw result.error;
      }
      
      toast({
        title: isEditMode ? 'Exercise Updated' : 'Exercise Created',
        description: isEditMode 
          ? 'The exercise has been successfully updated.' 
          : 'The exercise has been successfully created.',
      });
      
      form.reset({
        title: '',
        text: '',
        language: 'english',
        level: 'A1',
        audio_url: '',
        tags: '',
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving exercise:', error);
      toast({
        title: 'Error',
        description: 'Failed to save the exercise. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Exercise title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Text Content</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Exercise text content" 
                  className="min-h-[150px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language</FormLabel>
                <FormControl>
                  <RadioGroup 
                    className="flex flex-wrap gap-4" 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="english" />
                      </FormControl>
                      <FormLabel className="font-normal">English</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="spanish" />
                      </FormControl>
                      <FormLabel className="font-normal">Spanish</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="french" />
                      </FormControl>
                      <FormLabel className="font-normal">French</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="german" />
                      </FormControl>
                      <FormLabel className="font-normal">German</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language Level</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="A0">A0 - Absolute Beginner</SelectItem>
                    <SelectItem value="A1">A1 - Beginner</SelectItem>
                    <SelectItem value="A2">A2 - Elementary</SelectItem>
                    <SelectItem value="B1">B1 - Intermediate</SelectItem>
                    <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
                    <SelectItem value="C1">C1 - Advanced</SelectItem>
                    <SelectItem value="C2">C2 - Mastery</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="audio_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Audio URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="URL to audio file" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags (Optional, comma-separated)</FormLabel>
              <FormControl>
                <Input placeholder="grammar, vocabulary, beginner" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full">
          {isEditMode ? 'Update Exercise' : 'Create Exercise'}
        </Button>
      </form>
    </Form>
  );
};

export default DefaultExerciseForm;
