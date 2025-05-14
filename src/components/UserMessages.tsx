
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Archive, CheckCircle, MessageSquareText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { asUUID, asBoolean, asInsertObject, asUpdateObject } from '@/utils/supabaseHelpers';

interface UserMessage {
  id: string;
  message: {
    id: string;
    title: string;
    content: string;
    created_at: string;
  };
  is_read: boolean;
  is_archived: boolean;
}

export function UserMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAll, setShowAll] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('unread');
  const [isOpen, setIsOpen] = React.useState(false);

  const { data: messages = [], isLoading, isError } = useQuery({
    queryKey: ['user-messages'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_messages')
        .select(`
          id,
          is_read,
          is_archived,
          message:message_id (
            id,
            title,
            content,
            created_at
          )
        `)
        .eq('user_id', asUUID(user.id))
        .order('is_read', { ascending: true })
        .order('created_at', { foreignTable: 'message', ascending: false });
        
      if (error) throw error;
      return (data as unknown as UserMessage[]) || [];
    },
    enabled: !!user
  });

  const unreadMessages = messages.filter(msg => !msg.is_read);
  const archivedMessages = messages.filter(msg => msg.is_archived);
  const activeMessages = messages.filter(msg => !msg.is_archived);

  const markAsRead = useMutation({
    mutationFn: async (messageId: string) => {
      const updateData = asUpdateObject<'user_messages'>({
        is_read: true, 
        updated_at: new Date().toISOString() 
      });
      
      const { error } = await supabase
        .from('user_messages')
        .update(updateData)
        .eq('id', asUUID(messageId));
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-messages'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to mark message as read: ${error.message}`);
    }
  });

  const archiveMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const updateData = asUpdateObject<'user_messages'>({
        is_archived: true, 
        is_read: true, 
        updated_at: new Date().toISOString()
      });
      
      const { error } = await supabase
        .from('user_messages')
        .update(updateData)
        .eq('id', asUUID(messageId));
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-messages'] });
      toast.success('Message archived');
    },
    onError: (error: any) => {
      toast.error(`Failed to archive message: ${error.message}`);
    }
  });

  const markAllAsRead = async () => {
    if (!user || unreadMessages.length === 0) return;
    
    try {
      const updateData = asUpdateObject<'user_messages'>({
        is_read: true, 
        updated_at: new Date().toISOString()
      });
      
      const { error } = await supabase
        .from('user_messages')
        .update(updateData)
        .eq('user_id', asUUID(user.id))
        .eq('is_read', asBoolean(false));
        
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['user-messages'] });
      toast.success('All messages marked as read');
    } catch (error: any) {
      toast.error(`Failed to mark all messages as read: ${error.message}`);
    }
  };

  // When the sheet is opened, update the filter to show all messages
  const handleSheetOpen = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setShowAll(true);
    }
  };

  // Filter messages based on active tab
  const displayMessages = activeTab === 'archived' ? archivedMessages : 
                          activeTab === 'all' ? messages :
                          unreadMessages;

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="relative p-0 h-9 w-9">
          <MessageSquareText className="h-5 w-5" />
          {unreadMessages.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] p-0 flex items-center justify-center">
              {unreadMessages.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md md:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            App Messages 
            {unreadMessages.length > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                Mark All Read
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="unread" className="flex-1">
                Unread
                {unreadMessages.length > 0 && (
                  <Badge className="ml-2 bg-primary">{unreadMessages.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              <TabsTrigger value="archived" className="flex-1">Archived</TabsTrigger>
            </TabsList>
            
            <TabsContent value="unread" className="space-y-4">
              {isLoading ? (
                <div className="py-4 text-center">Loading messages...</div>
              ) : unreadMessages.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <CheckCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No unread messages</p>
                </div>
              ) : (
                renderMessagesList(unreadMessages)
              )}
            </TabsContent>
            
            <TabsContent value="all" className="space-y-4">
              {isLoading ? (
                <div className="py-4 text-center">Loading messages...</div>
              ) : activeMessages.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <MessageSquareText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No messages</p>
                </div>
              ) : (
                renderMessagesList(activeMessages)
              )}
            </TabsContent>
            
            <TabsContent value="archived" className="space-y-4">
              {isLoading ? (
                <div className="py-4 text-center">Loading messages...</div>
              ) : archivedMessages.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <Archive className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No archived messages</p>
                </div>
              ) : (
                renderMessagesList(archivedMessages)
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
  
  function renderMessagesList(messagesList: UserMessage[]) {
    return messagesList.map(msg => (
      <div 
        key={msg.id} 
        className={cn(
          "border rounded-lg p-4",
          !msg.is_read && "bg-muted/50 border-primary/50"
        )}
      >
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-medium">{msg.message.title}</h3>
          <div className="flex space-x-1">
            {!msg.is_archived && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={() => archiveMessage.mutate(msg.id)}
              >
                <Archive className="h-4 w-4" />
              </Button>
            )}
            {!msg.is_read && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={() => markAsRead.mutate(msg.id)}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          {format(new Date(msg.message.created_at), 'MMMM d, yyyy')}
        </p>
        <p className="text-sm whitespace-pre-wrap">{msg.message.content}</p>
      </div>
    ));
  }
}
