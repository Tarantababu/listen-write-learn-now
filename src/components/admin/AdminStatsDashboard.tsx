
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, CreditCard, MousePointerClick, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import StatsCard from '@/components/StatsCard';
import { UserStats } from './UserStats';

export function AdminStatsDashboard() {
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);

  // Query for admin statistics from edge function
  const { 
    data: adminStats, 
    isLoading: loadingAdminStats,
    error: adminStatsError,
    refetch: refetchAdminStats
  } = useQuery({
    queryKey: ['admin-stats', refreshKey],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-admin-stats');
      
      if (error) {
        console.error('Error fetching admin stats:', error);
        throw error;
      }
      
      return data || { totalUsers: 0, subscribedUsers: 0, subscribeButtonClicks: 0 };
    },
    retry: 1
  });

  // Query for total registered accounts as fallback
  const { data: totalAccounts } = useQuery({
    queryKey: ['admin-total-accounts', refreshKey],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!adminStatsError
  });

  // Query for total users with subscriptions as fallback
  const { data: subscribedUsers } = useQuery({
    queryKey: ['admin-subscribed-users', refreshKey],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('subscribed', true);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!adminStatsError
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetchAdminStats();
    toast({
      title: "Refreshing data",
      description: "Getting the latest statistics...",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Admin Statistics Dashboard</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          className="flex gap-2 items-center"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {adminStatsError && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex gap-2 items-center text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load data from admin statistics service. Showing fallback data.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Users"
          value={adminStatsError ? totalAccounts : (adminStats?.totalUsers || 0)}
          icon={<Users className="h-4 w-4" />}
          description="Total registered users"
          isLoading={loadingAdminStats && !adminStatsError}
        />
        
        <StatsCard
          title="Subscribed Users"
          value={adminStatsError ? subscribedUsers : (adminStats?.subscribedUsers || 0)}
          icon={<CreditCard className="h-4 w-4" />}
          description="Users with active subscriptions"
          isLoading={loadingAdminStats && !adminStatsError}
        />
        
        <StatsCard
          title="Subscribe Button Clicks"
          value={adminStats?.subscribeButtonClicks || 0}
          icon={<MousePointerClick className="h-4 w-4" />}
          description="Number of times users clicked Subscribe"
          isLoading={loadingAdminStats}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User Acquisition Statistics</CardTitle>
          <CardDescription>
            Detailed statistics about user engagement and activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserStats />
        </CardContent>
      </Card>
    </div>
  );
}
