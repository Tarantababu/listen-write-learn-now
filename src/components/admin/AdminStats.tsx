
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

export function AdminStats() {
  const { user } = useAuth();
  
  // Use React Query to fetch admin stats from the edge function
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      if (!user) return null;
      
      // Get the current session for the auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      
      // Call the edge function with the auth token
      const { data, error } = await supabase.functions.invoke('get-admin-stats', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) {
        console.error('Error fetching admin stats:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user // Only run the query if the user is logged in
  });

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
            <div className="text-2xl font-bold">{statsData?.totalUsers ?? 'N/A'}</div>
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
            <div className="text-2xl font-bold">{statsData?.subscribedUsers ?? 'N/A'}</div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Premium subscribers</p>
        </CardContent>
      </Card>
    </div>
  );
}
