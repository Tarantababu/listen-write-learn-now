
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function AdminStats() {
  const { user, session } = useAuth();
  
  // Use React Query to fetch admin stats from the edge function
  const { data: statsData, isLoading: isLoadingStats, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      if (!session?.access_token) {
        console.log('No access token available for admin stats');
        return null;
      }
      
      console.log('Fetching admin stats with token');
      
      // Call the edge function with the auth token
      const { data, error } = await supabase.functions.invoke('get-admin-stats', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) {
        console.error('Error fetching admin stats:', error);
        toast.error('Failed to load admin statistics');
        throw error;
      }
      
      console.log('Admin stats data received:', data);
      return data;
    },
    enabled: !!session?.access_token // Only run the query if we have an access token
  });

  // Display error message if there's an error
  if (error) {
    console.error('Error in admin stats query:', error);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoadingStats ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">
              {typeof statsData?.totalUsers === 'number' ? statsData.totalUsers : 'N/A'}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Registered users</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Subscribed Users</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoadingStats ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">
              {typeof statsData?.subscribedUsers === 'number' ? statsData.subscribedUsers : 'N/A'}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Premium subscribers</p>
        </CardContent>
      </Card>
    </div>
  );
}
