
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { createCurriculumNode, updateCurriculumNode } from '@/services/curriculumService';

// Define the form schema
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  sequence_order: z.coerce.number().int().positive(),
  min_completion_count: z.coerce.number().int().positive().default(3),
  min_accuracy_percentage: z.coerce.number().int().min(0).max(100).default(95),
});

interface NodeFormProps {
  curriculumId: string;
  node?: any;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const NodeForm: React.FC<NodeFormProps> = ({
  curriculumId,
  node,
  onSuccess,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: node?.name || '',
      description: node?.description || '',
      sequence_order: node?.sequence_order || 1,
      min_completion_count: node?.min_completion_count || 3,
      min_accuracy_percentage: node?.min_accuracy_percentage || 95,
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      if (node?.id) {
        // Update existing node
        await updateCurriculumNode(node.id, {
          name: values.name,
          description: values.description,
          sequence_order: values.sequence_order,
          min_completion_count: values.min_completion_count,
          min_accuracy_percentage: values.min_accuracy_percentage,
        });
        toast({ title: 'Node updated' });
      } else {
        // Create new node
        await createCurriculumNode({
          curriculum_id: curriculumId,
          name: values.name,
          description: values.description,
          sequence_order: values.sequence_order,
          min_completion_count: values.min_completion_count,
          min_accuracy_percentage: values.min_accuracy_percentage,
        });
        toast({ title: 'Node created' });
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
                <Input placeholder="Basic Greetings" {...field} />
              </FormControl>
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
                  placeholder="Learn common greeting phrases"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
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
                <Input 
                  type="number" 
                  min={1}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="min_completion_count"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Min. Completion Count</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={1}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="min_accuracy_percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Min. Accuracy Percentage</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={0}
                  max={100}
                  {...field}
                />
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : node?.id ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
