
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const messageSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
});

type MessageFormValues = z.infer<typeof messageSchema>;

export default function AdminMessagesForm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const onSubmit = async (values: MessageFormValues) => {
    try {
      if (!user) {
        toast.error('You must be logged in to send messages');
        return;
      }

      // No need to call set_admin_email function anymore since our RLS is more permissive
      // Just insert directly - the trigger will handle creating user_message entries
      const { error } = await supabase.from('admin_messages').insert({
        title: values.title,
        content: values.content,
        created_by: user.id,
      });

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      toast.success('Message sent to all users successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      form.reset();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter message title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter message content..." 
                      className="min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Sending...' : 'Send Message to All Users'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
