
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const bannerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  promo_code: z.string().optional(),
  target_route: z.string().default('/dashboard/subscription'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  priority: z.number().min(1).max(10).default(1),
  is_active: z.boolean().default(true),
});

type BannerFormData = z.infer<typeof bannerSchema>;

interface PromotionalBannerFormProps {
  onSuccess?: () => void;
}

export function PromotionalBannerForm({ onSuccess }: PromotionalBannerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: '',
      content: '',
      promo_code: '',
      target_route: '/dashboard/subscription',
      priority: 1,
      is_active: true,
    },
  });

  const onSubmit = async (data: BannerFormData) => {
    setIsSubmitting(true);
    
    try {
      const bannerData = {
        title: data.title,
        content: data.content,
        promo_code: data.promo_code || null,
        target_route: data.target_route,
        priority: data.priority,
        is_active: data.is_active,
        start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
        end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
      };

      const { error } = await supabase
        .from('promotional_banners')
        .insert(bannerData);

      if (error) throw error;

      toast.success('Promotional banner created successfully');
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating banner:', error);
      toast.error('Failed to create promotional banner');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Promotional Banner</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Banner title" {...field} />
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
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Banner content" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="promo_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Promo Code (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., SAVE30" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target_route"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Route</FormLabel>
                  <FormControl>
                    <Input placeholder="/dashboard/subscription" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority (1-10)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="10" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormLabel>Active</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Creating...' : 'Create Banner'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
