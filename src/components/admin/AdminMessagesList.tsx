
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Trash2, Edit, MessageSquare, Users, Clock, Check } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { asUpdateObject, asString, safeDataAccess, asTypedArray } from '@/utils/supabaseHelpers';

interface AdminMessage {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_active: boolean;
  created_by: string;
}

interface MessageStats {
  total: number;
  read: number;
  readPercentage: number;
}

interface MessageWithStats extends AdminMessage {
  stats: MessageStats;
}

export function AdminMessagesList() {
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<MessageWithStats | null>(null);
  const [isViewMessageOpen, setIsViewMessageOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('messages');

  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return asTypedArray<AdminMessage>(data);
    },
  });

  const handleViewMessageDetails = async (messageId: string) => {
    try {
      // Get message details
      const { data: message, error: messageError } = await supabase
        .from('admin_messages')
        .select('*')
        .eq('id', asString(messageId))
        .single();

      if (messageError) throw messageError;
      if (!message) throw new Error('Message not found');

      // Get read statistics
      const { data: userMessagesTotal, error: statsError } = await supabase
        .from('user_messages')
        .select('*', { count: 'exact' })
        .eq('message_id', asString(messageId));

      if (statsError) throw statsError;

      const { data: userMessagesRead, error: readStatsError } = await supabase
        .from('user_messages')
        .select('*', { count: 'exact' })
        .eq('message_id', asString(messageId))
        .eq('is_read', true);

      if (readStatsError) throw readStatsError;

      const totalCount = userMessagesTotal?.length || 0;
      const readCount = userMessagesRead?.length || 0;

      const messageWithStats: MessageWithStats = {
        ...message as AdminMessage,
        stats: {
          total: totalCount,
          read: readCount,
          readPercentage: totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0,
        }
      };

      setSelectedMessage(messageWithStats);
      setIsViewMessageOpen(true);
      setActiveTab('messages');
    } catch (error: any) {
      console.error('Error fetching message details:', error);
      toast.error(`Failed to load message details: ${error.message}`);
    }
  };

  const handleDeleteMessage = async () => {
    if (!deleteMessageId) return;

    try {
      const { error } = await supabase
        .from('admin_messages')
        .update(asUpdateObject<'admin_messages'>({ is_active: false }))
        .eq('id', asString(deleteMessageId));

      if (error) throw error;

      toast.success('Message deleted successfully');
      refetch();
    } catch (error: any) {
      toast.error(`Failed to delete message: ${error.message}`);
    } finally {
      setDeleteMessageId(null);
      setIsConfirmDeleteOpen(false);
    }
  };

  const handleToggleActiveStatus = async (messageId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_messages')
        .update(asUpdateObject<'admin_messages'>({ is_active: !currentStatus }))
        .eq('id', asString(messageId));

      if (error) throw error;

      toast.success(`Message ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      refetch();
    } catch (error: any) {
      toast.error(`Failed to update message status: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Message Management</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-6">
          <p>Loading messages...</p>
        </div>
      ) : (
        <div className="bg-card rounded-md border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    No messages found. Create your first message to get started.
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>
                      <div className="font-medium">{message.title}</div>
                    </TableCell>
                    <TableCell>
                      {message.is_active ? (
                        <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(message.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewMessageDetails(message.id)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActiveStatus(message.id, message.is_active)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setDeleteMessageId(message.id);
                          setIsConfirmDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Message View Dialog */}
      <AlertDialog open={isViewMessageOpen} onOpenChange={setIsViewMessageOpen}>
        <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          {selectedMessage && (
            <>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <AlertDialogHeader>
                  <div className="flex justify-between items-center">
                    <AlertDialogTitle>{selectedMessage.title}</AlertDialogTitle>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {format(new Date(selectedMessage.created_at), 'MMMM d, yyyy')}
                    </div>
                  </div>
                  <AlertDialogDescription>
                    Message ID: {selectedMessage.id}
                  </AlertDialogDescription>
                  <TabsList className="w-full mt-2">
                    <TabsTrigger value="messages">Message Content</TabsTrigger>
                    <TabsTrigger value="stats">Read Statistics</TabsTrigger>
                  </TabsList>
                </AlertDialogHeader>

                <TabsContent value="messages" className="pt-2">
                  <div className="whitespace-pre-wrap text-foreground">
                    {selectedMessage.content}
                  </div>
                </TabsContent>

                <TabsContent value="stats" className="pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">Total Recipients</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold flex items-center">
                          <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                          {selectedMessage.stats.total}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">Read Count</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold flex items-center">
                          <Check className="h-5 w-5 mr-2 text-green-500" />
                          {selectedMessage.stats.read}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">Read Percentage</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex items-end">
                          <span className="text-2xl font-bold">
                            {selectedMessage.stats.readPercentage}%
                          </span>
                          <div className="ml-2 h-6 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{
                                width: `${selectedMessage.stats.readPercentage}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>

              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel>Close</AlertDialogCancel>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the message for all users. It cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMessage}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AdminMessagesList;
