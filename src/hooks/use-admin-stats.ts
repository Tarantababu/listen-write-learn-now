
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminStats {
  totalUsers: number;
  subscribedUsers: number;
  subscribeButtonClicks: number;
}

export function useAdminStats() {
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);

  // Query admin stats from edge function
  const {
    data: stats,
    error,
    isLoading,
    refetch,
    isError
  } = useQuery({
    queryKey: ['admin-stats', refreshKey],
    queryFn: async (): Promise<AdminStats> => {
      try {
        console.log('Fetching admin stats from edge function...');
        const { data, error } = await supabase.functions.invoke('get-admin-stats');
        
        if (error) {
          console.error('Error fetching admin stats:', error);
          throw error;
        }
        
        if (!data) {
          throw new Error('No data returned from admin stats function');
        }
        
        console.log('Admin stats received:', data);
        
        return {
          totalUsers: data.totalUsers || 0,
          subscribedUsers: data.subscribedUsers || 0,
          subscribeButtonClicks: data.subscribeButtonClicks || 0
        };
      } catch (err) {
        console.error('Error in admin stats hook:', err);
        throw err;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Fallback queries for direct database access if edge function fails
  const { data: totalUsers } = useQuery({
    queryKey: ['admin-total-users', refreshKey],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
    enabled: isError,
    staleTime: 5 * 60 * 1000
  });

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
    enabled: isError,
    staleTime: 5 * 60 * 1000
  });

  // Modified approach for button clicks - using RPC or a custom query approach
  const { data: buttonClicks } = useQuery({
    queryKey: ['admin-button-clicks', refreshKey],
    queryFn: async () => {
      try {
        // Using a safer approach to query data that might not exist in the schema
        // This avoids TypeScript errors about non-existent tables
        const { data: clicksData } = await supabase.rpc('get_button_clicks', { button_name: 'subscribe' });
        
        // If RPC returns data, use it
        if (clicksData !== null) {
          return clicksData || 0;
        }
        
        // Fallback: just return 0 if the function doesn't exist or returns no data
        return 0;
      } catch (e) {
        console.warn("Button clicks tracking not configured:", e);
        return 0; // Default value if tracking is not set up
      }
    },
    enabled: isError,
    staleTime: 5 * 60 * 1000
  });

  const refreshStats = () => {
    setRefreshKey(prev => prev + 1);
    refetch().then(() => {
      toast({
        title: "Statistics refreshed",
        description: "The latest data has been loaded."
      });
    }).catch(() => {
      toast({
        title: "Refresh failed",
        description: "Could not refresh the statistics. Using fallback data.",
        variant: "destructive"
      });
    });
  };

  // If edge function failed, use fallback data
  const finalStats: AdminStats = isError ? {
    totalUsers: totalUsers || 0,
    subscribedUsers: subscribedUsers || 0,
    subscribeButtonClicks: buttonClicks || 0
  } : (stats || { totalUsers: 0, subscribedUsers: 0, subscribeButtonClicks: 0 });

  return {
    stats: finalStats,
    isLoading,
    isError,
    refreshStats,
    error
  };
}

export default useAdminStats;
