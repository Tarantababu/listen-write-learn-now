
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export interface EnhancedAdminStats {
  totalUsers: number;
  subscribedUsers: number;
  subscribeButtonClicks: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  conversionRate: number;
  averageSessionLength: number;
  retentionRate: number;
  churnRate: number;
  dataSource?: string;
}

export interface TimeSeriesData {
  date: string;
  users: number;
  subscribers: number;
  buttonClicks: number;
}

export interface ButtonAnalytics {
  totalClicks: number;
  uniqueClickers: number;
  conversionRate: number;
  clicksByPage: Array<{ page: string; clicks: number }>;
}

export interface TrendData {
  value: number;
  percentage: number;
  isPositive: boolean;
}

export function useEnhancedAdminStats(timeRange: string = '7d') {
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);

  // Calculate date range based on timeRange parameter
  const getDateRange = () => {
    const now = new Date();
    let days = 7;
    
    switch (timeRange) {
      case '1d': days = 1; break;
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      default: days = 7;
    }
    
    return {
      start: subDays(now, days).toISOString(),
      end: now.toISOString()
    };
  };

  // Enhanced stats query with improved error handling and data source tracking
  const {
    data: stats,
    error,
    isLoading,
    refetch,
    isError
  } = useQuery({
    queryKey: ['enhanced-admin-stats', timeRange, refreshKey],
    queryFn: async (): Promise<EnhancedAdminStats> => {
      try {
        console.log('Fetching enhanced admin stats with improved subscriber data...');
        
        // Try edge function first - this now includes direct Stripe querying
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke('get-admin-stats');
        
        let baseStats = { 
          totalUsers: 0, 
          subscribedUsers: 0, 
          subscribeButtonClicks: 0,
          dataSource: 'unknown'
        };
        
        if (!edgeError && edgeData) {
          baseStats = {
            totalUsers: edgeData.totalUsers || 0,
            subscribedUsers: edgeData.subscribedUsers || 0,
            subscribeButtonClicks: edgeData.subscribeButtonClicks || 0,
            dataSource: edgeData.dataSource || 'edge_function'
          };
          console.log('Edge function data retrieved:', baseStats);
        } else {
          console.warn('Edge function failed, using fallback queries');
          // Fallback to direct database queries
          const [usersResult, subscribersResult] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('subscribed', true)
          ]);
          
          baseStats = {
            totalUsers: usersResult.count || 0,
            subscribedUsers: subscribersResult.count || 0,
            subscribeButtonClicks: 0,
            dataSource: 'database_fallback'
          };
        }

        // Enhanced metrics calculations
        const { start, end } = getDateRange();
        
        // Active users (users with activity in timeframe)
        const { count: activeUsers } = await supabase
          .from('user_daily_activities')
          .select('*', { count: 'exact', head: true })
          .gte('activity_date', start)
          .lte('activity_date', end);

        // New users today
        const todayStart = startOfDay(new Date()).toISOString();
        const { count: newUsersToday } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart);

        // New users this week
        const weekStart = subDays(new Date(), 7).toISOString();
        const { count: newUsersThisWeek } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekStart);

        // Calculate derived metrics
        const conversionRate = baseStats.totalUsers > 0 
          ? (baseStats.subscribedUsers / baseStats.totalUsers) * 100 
          : 0;

        return {
          totalUsers: baseStats.totalUsers,
          subscribedUsers: baseStats.subscribedUsers,
          subscribeButtonClicks: baseStats.subscribeButtonClicks,
          activeUsers: activeUsers || 0,
          newUsersToday: newUsersToday || 0,
          newUsersThisWeek: newUsersThisWeek || 0,
          conversionRate: Math.round(conversionRate * 100) / 100,
          averageSessionLength: 0, // Placeholder for future implementation
          retentionRate: 0, // Placeholder for future implementation
          churnRate: 0, // Placeholder for future implementation
          dataSource: baseStats.dataSource
        };
      } catch (err) {
        console.error('Error in enhanced admin stats hook:', err);
        throw err;
      }
    },
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false
  });

  // Time series data query
  const { data: timeSeriesData } = useQuery({
    queryKey: ['admin-time-series', timeRange, refreshKey],
    queryFn: async (): Promise<TimeSeriesData[]> => {
      const { start } = getDateRange();
      const days = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      
      const timeSeriesData: TimeSeriesData[] = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayStart = startOfDay(date).toISOString();
        const dayEnd = endOfDay(date).toISOString();
        
        const [usersResult, subscribersResult, clicksResult] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true })
            .gte('created_at', dayStart).lte('created_at', dayEnd),
          supabase.from('subscribers').select('*', { count: 'exact', head: true })
            .eq('subscribed', true).gte('created_at', dayStart).lte('created_at', dayEnd),
          supabase.from('visitors').select('*', { count: 'exact', head: true })
            .like('page', 'button_click:%').gte('created_at', dayStart).lte('created_at', dayEnd)
        ]);
        
        timeSeriesData.push({
          date: dateStr,
          users: usersResult.count || 0,
          subscribers: subscribersResult.count || 0,
          buttonClicks: clicksResult.count || 0
        });
      }
      
      return timeSeriesData;
    },
    enabled: !!stats,
    staleTime: 5 * 60 * 1000
  });

  // Button analytics query
  const { data: buttonAnalytics } = useQuery({
    queryKey: ['button-analytics', timeRange, refreshKey],
    queryFn: async (): Promise<ButtonAnalytics> => {
      const { start } = getDateRange();
      
      const { data: clickData } = await supabase
        .from('visitors')
        .select('page, visitor_id')
        .like('page', 'button_click:%')
        .gte('created_at', start);

      const totalClicks = clickData?.length || 0;
      const uniqueClickers = new Set(clickData?.map(d => d.visitor_id)).size;
      
      // Group clicks by page
      const clicksByPage = (clickData || []).reduce((acc: Record<string, number>, click) => {
        const page = click.page.replace('button_click:', '');
        acc[page] = (acc[page] || 0) + 1;
        return acc;
      }, {});
      
      const clicksByPageArray = Object.entries(clicksByPage)
        .map(([page, clicks]) => ({ page, clicks }))
        .sort((a, b) => b.clicks - a.clicks);

      return {
        totalClicks,
        uniqueClickers,
        conversionRate: uniqueClickers > 0 ? (stats?.subscribedUsers || 0) / uniqueClickers * 100 : 0,
        clicksByPage: clicksByPageArray
      };
    },
    enabled: !!stats,
    staleTime: 5 * 60 * 1000
  });

  const refreshStats = () => {
    setRefreshKey(prev => prev + 1);
    refetch().then(() => {
      toast({
        title: "Statistics refreshed",
        description: `The latest data has been loaded from ${stats?.dataSource || 'database'}.`
      });
    }).catch(() => {
      toast({
        title: "Refresh failed",
        description: "Could not refresh the statistics. Please try again.",
        variant: "destructive"
      });
    });
  };

  return {
    stats: stats || {
      totalUsers: 0,
      subscribedUsers: 0,
      subscribeButtonClicks: 0,
      activeUsers: 0,
      newUsersToday: 0,
      newUsersThisWeek: 0,
      conversionRate: 0,
      averageSessionLength: 0,
      retentionRate: 0,
      churnRate: 0
    },
    timeSeriesData: [], // Keep existing implementation
    buttonAnalytics: { // Keep existing implementation
      totalClicks: 0,
      uniqueClickers: 0,
      conversionRate: 0,
      clicksByPage: []
    },
    isLoading,
    isError,
    refreshStats,
    error
  };
}
