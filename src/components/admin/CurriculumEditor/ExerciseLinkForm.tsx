
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { linkExerciseToNode } from '@/services/curriculumService';

// Define the form schema
const formSchema = z.object({
  exercise_id: z.string().min(1, 'Exercise is required'),
  sequence_order: z.coerce.number().int().positive(),
});

interface ExerciseLinkFormProps {
  nodeId: string;
  existingExercises: string[];
  language: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const ExerciseLinkForm: React.FC<ExerciseLinkFormProps> = ({
  nodeId,
  existingExercises,
  language,
  onSuccess,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exercises, setExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      exercise_id: '',
      sequence_order: 1,
    },
  });

  // Fetch available exercises
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('default_exercises')
          .select('id, title, language')
          .eq('language', language)
          .order('title');

        if (error) throw error;

        // Filter out exercises already linked
        const filteredExercises = data?.filter(
          (ex) => !existingExercises.includes(ex.id)
        ) || [];
        
        setExercises(filteredExercises);
      } catch (error) {
        console.error('Error fetching exercises:', error);
        toast({
          title: 'Error',
          description: 'Failed to load exercises',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchExercises();
  }, [language, existingExercises]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      await linkExerciseToNode({
        node_id: nodeId,
        exercise_id: values.exercise_id,
        sequence_order: values.sequence_order,
      });

      toast({ title: 'Exercise linked to node' });
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
          name="exercise_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exercise</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an exercise" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoading ? (
                    <div className="flex justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : exercises.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      No exercises available
                    </div>
                  ) : (
                    exercises.map((exercise) => (
                      <SelectItem key={exercise.id} value={exercise.id}>
                        {exercise.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sequence_order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sequence Order</FormLabel>
              <FormControl>
                <Input type="number" min={1} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isSubmitting || exercises.length === 0}
          >
            {isSubmitting ? 'Linking...' : 'Link Exercise'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
