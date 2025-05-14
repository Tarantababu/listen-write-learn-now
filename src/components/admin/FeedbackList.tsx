
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Inbox, CheckCircle, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { asUUID, asUpdateObject } from '@/utils/supabaseHelpers';

interface Feedback {
  id: string;
  created_at: string;
  name: string;
  email: string | null;
  message: string;
  read: boolean;
}

export function FeedbackList() {
  // Fetch feedback from database
  const { data: feedback, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as Feedback[];
    }
  });

  // Handle marking feedback as read
  const markAsRead = async (id: string) => {
    try {
      const updateData = asUpdateObject<'feedback'>({
        read: true
      });
      
      const { error } = await supabase
        .from('feedback')
        .update(updateData)
        .eq('id', asUUID(id));
      
      if (error) throw error;
      
      toast.success('Feedback marked as read');
      refetch();
    } catch (error) {
      console.error('Error marking feedback as read:', error);
      toast.error('Failed to update feedback status');
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500 py-4">
            Failed to load feedback entries. You may not have permission to view this data.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">User Feedback</CardTitle>
        <Inbox className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : feedback && feedback.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Date</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedback.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {format(new Date(item.created_at), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div>{item.name}</div>
                    {item.email && (
                      <div className="text-xs text-muted-foreground">{item.email}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-h-24 overflow-y-auto">{item.message}</div>
                  </TableCell>
                  <TableCell>
                    {item.read ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                        <CheckCircle className="mr-1 h-3 w-3" /> Read
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                        <Mail className="mr-1 h-3 w-3" /> New
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!item.read && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => markAsRead(item.id)}
                      >
                        Mark Read
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No feedback entries found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
