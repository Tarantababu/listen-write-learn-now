
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminMessage {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  user_count?: number;
  read_count?: number;
}

export function AdminMessagesList({ onRefresh }: { onRefresh?: () => void }) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get user count and read count for each message
      const messagesWithStats = await Promise.all((data || []).map(async (message) => {
        // Only attempt to get stats if we have a message ID
        if (message && typeof message === 'object' && 'id' in message) {
          const messageId = message.id as string;
          
          // Get total user count
          const { count: userCount, error: userCountError } = await supabase
            .from('user_messages')
            .select('*', { count: 'exact', head: true })
            .eq('message_id', messageId);
          
          // Get read count
          const { count: readCount, error: readCountError } = await supabase
            .from('user_messages')
            .select('*', { count: 'exact', head: true })
            .eq('message_id', messageId)
            .eq('is_read', true);
          
          return {
            ...message as any,
            user_count: userCount || 0,
            read_count: readCount || 0
          } as AdminMessage;
        }
        
        // If the message object doesn't have an ID, cast it to unknown then to AdminMessage
        return message as unknown as AdminMessage;
      }));
      
      return messagesWithStats as AdminMessage[];
    }
  });

  const handleToggleActive = async (message: AdminMessage) => {
    try {
      const { error } = await supabase
        .from('admin_messages')
        .update({ is_active: !message.is_active } as any)
        .eq('id', message.id);
      
      if (error) throw error;
      
      toast({
        title: "Message updated",
        description: `Message ${message.is_active ? 'deactivated' : 'activated'}`,
      });
      
      refetch();
      
    } catch (error: any) {
      console.error('Error toggling active:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update message",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (message: AdminMessage) => {
    setSelectedMessage(message);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedMessage) return;
    
    setIsDeleting(true);
    try {
      // Delete the message
      const { error } = await supabase
        .from('admin_messages')
        .delete()
        .eq('id', selectedMessage.id);
      
      if (error) throw error;
      
      toast({
        title: "Message deleted",
        description: "Message has been permanently deleted.",
      });
      
      setDeleteDialogOpen(false);
      refetch();
      if (onRefresh) onRefresh();
      
    } catch (error: any) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete message",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Admin Messages</h2>
      
      {isLoading ? (
        <p>Loading messages...</p>
      ) : messages.length === 0 ? (
        <div className="py-6 text-center text-muted-foreground">
          <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>No messages yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{message.title}</CardTitle>
                  <Badge variant={message.is_active ? 'default' : 'secondary'}>
                    {message.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription>
                  Sent on {format(new Date(message.created_at), 'MMMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>{message.content}</p>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  {message.user_count !== undefined && message.read_count !== undefined && (
                    <>
                      <p>{message.read_count} of {message.user_count} users read</p>
                      {message.read_count === message.user_count ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                    </>
                  )}
                </div>
              </CardContent>
              <CardContent className="flex justify-end space-x-2">
                <Checkbox 
                  id={`active-${message.id}`}
                  checked={message.is_active}
                  onCheckedChange={() => handleToggleActive(message)}
                />
                <label
                  htmlFor={`active-${message.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Active
                </label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDelete(message)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
