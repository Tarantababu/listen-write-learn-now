
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function UserStats() {
  // Query for total registered accounts
  const { data: totalAccounts, isLoading: loadingAccounts } = useQuery({
    queryKey: ['admin-total-accounts'],
    queryFn: async () => {
      // We can't directly query auth.users from the client, so we'll count profiles instead
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: false });
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Query for total users with subscriptions
  const { data: subscribedUsers, isLoading: loadingSubscriptions } = useQuery({
    queryKey: ['admin-subscribed-users'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: false })
        .eq('subscribed', true);
      
      if (error) throw error;
      return count || 0;
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loadingAccounts ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{totalAccounts}</div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Subscribed Users</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loadingSubscriptions ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{subscribedUsers}</div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Paying customers</p>
        </CardContent>
      </Card>
    </div>
  );
}
