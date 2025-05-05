
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminStats() {
  const { data: totalAccounts, isLoading: loadingAccounts } = useQuery({
    queryKey: ['admin-total-accounts'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: false });
      
      if (error) {
        console.error('Error fetching total accounts:', error);
        return null;
      }
      
      return count || 0;
    }
  });

  const { data: subscribedCount, isLoading: loadingSubscribed } = useQuery({
    queryKey: ['admin-subscribed-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: false })
        .eq('subscribed', true);
      
      if (error) {
        console.error('Error fetching subscribed users:', error);
        return null;
      }
      
      return count || 0;
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loadingAccounts ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{totalAccounts ?? 'N/A'}</div>
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
          {loadingSubscribed ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{subscribedCount ?? 'N/A'}</div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Premium subscribers</p>
        </CardContent>
      </Card>
    </div>
  );
}
