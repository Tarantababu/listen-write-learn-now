
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Language, LanguageLevel } from '@/types';
import { createCurriculum, updateCurriculum } from '@/services/curriculumService';
import { languageLevels } from '@/utils/languageUtils';

// Define the form schema
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  language: z.string().min(1, 'Language is required'),
  level: z.string().min(1, 'Level is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional().default('active'),
});

interface CurriculumFormProps {
  curriculum?: any;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const CurriculumForm: React.FC<CurriculumFormProps> = ({
  curriculum,
  onSuccess,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: curriculum?.name || '',
      language: curriculum?.language || '',
      level: curriculum?.level || '',
      description: curriculum?.description || '',
      status: curriculum?.status || 'active',
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      if (curriculum?.id) {
        // Update existing curriculum
        await updateCurriculum(curriculum.id, {
          name: values.name,
          language: values.language as Language,
          level: values.level as LanguageLevel,
          description: values.description,
          status: values.status as 'active' | 'inactive',
        });
        toast({ title: 'Curriculum updated' });
      } else {
        // Create new curriculum
        await createCurriculum({
          name: values.name,
          language: values.language as Language,
          level: values.level as LanguageLevel,
          description: values.description,
        });
        toast({ title: 'Curriculum created' });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="A1 German Basics" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Language</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="german">German</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                  <SelectItem value="italian">Italian</SelectItem>
                  <SelectItem value="portuguese">Portuguese</SelectItem>
                  <SelectItem value="turkish">Turkish</SelectItem>
                  <SelectItem value="swedish">Swedish</SelectItem>
                  <SelectItem value="dutch">Dutch</SelectItem>
                  <SelectItem value="norwegian">Norwegian</SelectItem>
                  <SelectItem value="russian">Russian</SelectItem>
                  <SelectItem value="polish">Polish</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {languageLevels.map(level => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="A beginner course for learning basic vocabulary and grammar"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {curriculum?.id && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : curriculum?.id ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
