
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Mail, User } from 'lucide-react';
import { format } from 'date-fns';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { asUpdateObject } from '@/utils/supabaseHelpers';

export function FeedbackList() {
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: feedback = [], isLoading, refetch } = useQuery({
    queryKey: ['feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update(asUpdateObject<'feedback'>({ read: true }))
        .eq('id', id as any);

      if (error) throw error;
      
      toast.success('Feedback marked as read');
      refetch();
    } catch (error: any) {
      toast.error(`Error marking feedback as read: ${error.message}`);
    }
  };

  const handleViewFeedback = (item: any) => {
    setSelectedFeedback(item);
    setIsModalOpen(true);
    
    if (!item.read) {
      markAsRead(item.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">User Feedback</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-6">
          <p>Loading feedback...</p>
        </div>
      ) : (
        <div className="bg-card rounded-md border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Message Preview</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedback.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No feedback found.
                  </TableCell>
                </TableRow>
              ) : (
                feedback.map((item) => (
                  <TableRow key={item.id} className={!item.read ? "bg-muted/30" : ""}>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                      {item.email && (
                        <div className="text-sm text-muted-foreground flex items-center mt-1">
                          <Mail className="h-3 w-3 mr-1" /> {item.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.read ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          Read
                        </Badge>
                      ) : (
                        <Badge>New</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.created_at ? format(new Date(item.created_at), 'MMM d, yyyy') : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm truncate max-w-[300px]">{item.message}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewFeedback(item)}>
                        View Details
                      </Button>
                      {!item.read && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => markAsRead(item.id)}
                          className="ml-1"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
            <DialogDescription>
              Submitted on {selectedFeedback?.created_at ? format(new Date(selectedFeedback.created_at), 'MMMM d, yyyy') : 'Unknown date'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedFeedback && (
            <div className="space-y-4 mt-2">
              <div className="bg-muted p-3 rounded-md">
                <div className="flex items-center mb-2">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">{selectedFeedback.name}</span>
                </div>
                {selectedFeedback.email && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>{selectedFeedback.email}</span>
                  </div>
                )}
              </div>
              
              <div className="border p-4 rounded-md">
                <h3 className="text-sm font-medium mb-2 text-muted-foreground">Message:</h3>
                <div className="whitespace-pre-wrap">{selectedFeedback.message}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FeedbackList;
