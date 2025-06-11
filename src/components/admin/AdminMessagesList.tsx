
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Eye, MessageSquare, Trash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { AdminSecurityWrapper } from './AdminSecurityWrapper';
import { useSecurityLogging } from './EnhancedSecurityHooks';

interface AdminMessage {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_active: boolean;
  read_count: number;
  total_users: number;
}

export default function AdminMessagesList() {
  const { logSecurityEvent } = useSecurityLogging();

  const { data: messages, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      try {
        // Get all admin messages using the enhanced RLS policies
        const { data: adminMessages, error } = await supabase
          .from('admin_messages')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // For each message, get the count of users who have read it
        const messagesWithStats = await Promise.all(
          adminMessages.map(async (message) => {
            const { count: readCount, error: readError } = await supabase
              .from('user_messages')
              .select('*', { count: 'exact', head: true })
              .eq('message_id', message.id)
              .eq('is_read', true);
              
            if (readError) {
              console.warn('Error fetching read count:', readError);
            }
            
            const { count: totalUsers, error: userError } = await supabase
              .from('user_messages')
              .select('*', { count: 'exact', head: true })
              .eq('message_id', message.id);
              
            if (userError) {
              console.warn('Error fetching total users:', userError);
            }
            
            return {
              ...message,
              read_count: readCount || 0,
              total_users: totalUsers || 0
            };
          })
        );
        
        return messagesWithStats as AdminMessage[];
      } catch (error) {
        console.error('Error fetching admin messages:', error);
        throw error;
      }
    }
  });

  const toggleMessageStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_messages')
        .update({ is_active: !currentStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      // Log the security event
      await logSecurityEvent('admin_action', {
        action: 'toggle_message_status',
        message_id: id,
        new_status: !currentStatus
      });
      
      toast.success(`Message ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      refetch();
    } catch (error: any) {
      console.error('Failed to update message status:', error);
      toast.error(`Failed to update message status: ${error.message}`);
    }
  };

  return (
    <AdminSecurityWrapper>
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500">
              Failed to load messages. Error: {error.message}
            </div>
          ) : messages && messages.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Read By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell className="font-medium">{message.title}</TableCell>
                    <TableCell>{format(new Date(message.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={message.is_active}
                          onCheckedChange={() => toggleMessageStatus(message.id, message.is_active)}
                        />
                        <span className={message.is_active ? "text-green-600" : "text-gray-500"}>
                          {message.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                        {message.read_count} / {message.total_users} users
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>No messages have been sent yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminSecurityWrapper>
  );
}
