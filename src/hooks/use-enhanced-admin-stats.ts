
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export interface EnhancedAdminStats {
  totalUsers: number;
  subscribedUsers: number;
  subscribeButtonClicks: number;
  activeUsers: number;
  totalVisitors: number;
  uniqueVisitors: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  conversionRate: number;
  averageSessionLength: number;
  retentionRate: number;
  churnRate: number;
  dataSource?: string;
  errors?: string[];
  lastUpdated?: string;
}

export interface TimeSeriesData {
  date: string;
  users: number;
  subscribers: number;
  buttonClicks: number;
  visitors: number;
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

  // Enhanced stats query with real-time updates and comprehensive error handling
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
        console.log('Fetching enhanced admin stats with improved error handling...');
        
        // Primary data source: enhanced edge function
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke('get-admin-stats');
        
        let baseStats: Partial<EnhancedAdminStats> = { 
          totalUsers: 0, 
          subscribedUsers: 0, 
          subscribeButtonClicks: 0,
          totalVisitors: 0,
          uniqueVisitors: 0,
          activeUsers: 0,
          dataSource: 'unknown',
          errors: [],
          lastUpdated: new Date().toISOString()
        };
        
        if (!edgeError && edgeData) {
          baseStats = {
            totalUsers: edgeData.totalUsers || 0,
            subscribedUsers: edgeData.subscribedUsers || 0,
            subscribeButtonClicks: edgeData.subscribeButtonClicks || 0,
            totalVisitors: edgeData.totalVisitors || 0,
            uniqueVisitors: edgeData.uniqueVisitors || 0,
            activeUsers: edgeData.activeUsers || 0,
            dataSource: edgeData.dataSource || 'edge_function',
            errors: edgeData.errors || [],
            lastUpdated: edgeData.timestamp || new Date().toISOString()
          };
          console.log('Enhanced edge function data retrieved:', baseStats);
        } else {
          console.warn('Enhanced edge function failed, using comprehensive fallback');
          
          // Comprehensive fallback with parallel queries
          try {
            const [
              usersResult,
              subscribersResult,
              visitorsResult,
              uniqueVisitorsResult,
              activeUsersResult,
              buttonClicksResult
            ] = await Promise.allSettled([
              supabase.from('profiles').select('*', { count: 'exact', head: true }),
              supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('subscribed', true),
              supabase.from('visitors').select('*', { count: 'exact', head: true }),
              supabase.from('visitors').select('visitor_id'),
              supabase.from('user_daily_activities').select('user_id', { count: 'exact', head: true })
                .gte('activity_date', subDays(new Date(), 30).toISOString().split('T')[0]),
              supabase.from('visitors').select('*', { count: 'exact', head: true })
                .like('page', 'button_click:%')
            ]);
            
            // Process results with error tracking
            const errors: string[] = [];
            
            baseStats.totalUsers = usersResult.status === 'fulfilled' ? 
              (usersResult.value.count || 0) : 0;
            if (usersResult.status === 'rejected') {
              errors.push(`Users count failed: ${usersResult.reason.message}`);
            }
            
            baseStats.subscribedUsers = subscribersResult.status === 'fulfilled' ? 
              (subscribersResult.value.count || 0) : 0;
            if (subscribersResult.status === 'rejected') {
              errors.push(`Subscribers count failed: ${subscribersResult.reason.message}`);
            }
            
            baseStats.totalVisitors = visitorsResult.status === 'fulfilled' ? 
              (visitorsResult.value.count || 0) : 0;
            if (visitorsResult.status === 'rejected') {
              errors.push(`Visitors count failed: ${visitorsResult.reason.message}`);
            }
            
            if (uniqueVisitorsResult.status === 'fulfilled' && uniqueVisitorsResult.value.data) {
              const uniqueIds = new Set(uniqueVisitorsResult.value.data.map(v => v.visitor_id));
              baseStats.uniqueVisitors = uniqueIds.size;
            } else if (uniqueVisitorsResult.status === 'rejected') {
              errors.push(`Unique visitors failed: ${uniqueVisitorsResult.reason.message}`);
            }
            
            baseStats.activeUsers = activeUsersResult.status === 'fulfilled' ? 
              (activeUsersResult.value.count || 0) : 0;
            if (activeUsersResult.status === 'rejected') {
              errors.push(`Active users failed: ${activeUsersResult.reason.message}`);
            }
            
            baseStats.subscribeButtonClicks = buttonClicksResult.status === 'fulfilled' ? 
              (buttonClicksResult.value.count || 0) : 0;
            if (buttonClicksResult.status === 'rejected') {
              errors.push(`Button clicks failed: ${buttonClicksResult.reason.message}`);
            }
            
            baseStats.dataSource = 'database_comprehensive_fallback';
            baseStats.errors = errors;
            
          } catch (fallbackError) {
            console.error('Comprehensive fallback failed:', fallbackError);
            baseStats.errors = [`Fallback failed: ${fallbackError.message}`];
            baseStats.dataSource = 'error_state';
          }
        }

        // Enhanced metrics calculations with error handling
        const { start } = getDateRange();
        
        // New users today and this week with fallback
        let newUsersToday = 0;
        let newUsersThisWeek = 0;
        
        try {
          const todayStart = startOfDay(new Date()).toISOString();
          const weekStart = subDays(new Date(), 7).toISOString();
          
          const [todayResult, weekResult] = await Promise.allSettled([
            supabase.from('profiles').select('*', { count: 'exact', head: true })
              .gte('created_at', todayStart),
            supabase.from('profiles').select('*', { count: 'exact', head: true })
              .gte('created_at', weekStart)
          ]);
          
          if (todayResult.status === 'fulfilled') {
            newUsersToday = todayResult.value.count || 0;
          }
          if (weekResult.status === 'fulfilled') {
            newUsersThisWeek = weekResult.value.count || 0;
          }
        } catch (newUsersError) {
          console.warn('New users calculation failed:', newUsersError);
          baseStats.errors?.push(`New users calculation failed: ${newUsersError.message}`);
        }

        // Calculate derived metrics with safety checks
        const conversionRate = baseStats.totalUsers && baseStats.totalUsers > 0 
          ? (baseStats.subscribedUsers! / baseStats.totalUsers) * 100 
          : 0;

        // Calculate visitor-to-user conversion if we have visitor data
        const visitorUserConversion = baseStats.uniqueVisitors && baseStats.uniqueVisitors > 0
          ? (baseStats.totalUsers! / baseStats.uniqueVisitors) * 100
          : 0;

        return {
          totalUsers: baseStats.totalUsers!,
          subscribedUsers: baseStats.subscribedUsers!,
          subscribeButtonClicks: baseStats.subscribeButtonClicks!,
          totalVisitors: baseStats.totalVisitors!,
          uniqueVisitors: baseStats.uniqueVisitors!,
          activeUsers: baseStats.activeUsers!,
          newUsersToday,
          newUsersThisWeek,
          conversionRate: Math.round(conversionRate * 100) / 100,
          averageSessionLength: 0, // Placeholder for future implementation
          retentionRate: visitorUserConversion > 0 ? Math.round(visitorUserConversion * 100) / 100 : 0,
          churnRate: 0, // Placeholder for future implementation
          dataSource: baseStats.dataSource!,
          errors: baseStats.errors,
          lastUpdated: baseStats.lastUpdated
        };
      } catch (err) {
        console.error('Critical error in enhanced admin stats hook:', err);
        throw err;
      }
    },
    retry: (failureCount, error) => {
      // Implement smart retry logic
      if (failureCount < 2) return true;
      console.log('Max retries reached for admin stats');
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });

  // Enhanced time series data with better error handling
  const { data: timeSeriesData } = useQuery({
    queryKey: ['admin-time-series', timeRange, refreshKey],
    queryFn: async (): Promise<TimeSeriesData[]> => {
      const days = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const timeSeriesData: TimeSeriesData[] = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayStart = startOfDay(date).toISOString();
        const dayEnd = endOfDay(date).toISOString();
        
        try {
          const [usersResult, subscribersResult, clicksResult, visitorsResult] = await Promise.allSettled([
            supabase.from('profiles').select('*', { count: 'exact', head: true })
              .gte('created_at', dayStart).lte('created_at', dayEnd),
            supabase.from('subscribers').select('*', { count: 'exact', head: true })
              .eq('subscribed', true).gte('created_at', dayStart).lte('created_at', dayEnd),
            supabase.from('visitors').select('*', { count: 'exact', head: true })
              .like('page', 'button_click:%').gte('created_at', dayStart).lte('created_at', dayEnd),
            supabase.from('visitors').select('*', { count: 'exact', head: true })
              .gte('created_at', dayStart).lte('created_at', dayEnd)
          ]);
          
          timeSeriesData.push({
            date: dateStr,
            users: usersResult.status === 'fulfilled' ? (usersResult.value.count || 0) : 0,
            subscribers: subscribersResult.status === 'fulfilled' ? (subscribersResult.value.count || 0) : 0,
            buttonClicks: clicksResult.status === 'fulfilled' ? (clicksResult.value.count || 0) : 0,
            visitors: visitorsResult.status === 'fulfilled' ? (visitorsResult.value.count || 0) : 0,
          });
        } catch (dayError) {
          console.warn(`Failed to get data for ${dateStr}:`, dayError);
          timeSeriesData.push({
            date: dateStr,
            users: 0,
            subscribers: 0,
            buttonClicks: 0,
            visitors: 0,
          });
        }
      }
      
      return timeSeriesData;
    },
    enabled: !!stats && !isError,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  // Enhanced button analytics
  const { data: buttonAnalytics } = useQuery({
    queryKey: ['button-analytics', timeRange, refreshKey],
    queryFn: async (): Promise<ButtonAnalytics> => {
      const { start } = getDateRange();
      
      try {
        const { data: clickData } = await supabase
          .from('visitors')
          .select('page, visitor_id')
          .like('page', 'button_click:%')
          .gte('created_at', start);

        const totalClicks = clickData?.length || 0;
        const uniqueClickers = new Set(clickData?.map(d => d.visitor_id)).size;
        
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
      } catch (error) {
        console.warn('Button analytics failed:', error);
        return {
          totalClicks: 0,
          uniqueClickers: 0,
          conversionRate: 0,
          clicksByPage: []
        };
      }
    },
    enabled: !!stats && !isError,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  const refreshStats = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    refetch().then(() => {
      toast({
        title: "Statistics refreshed",
        description: `Latest data loaded from ${stats?.dataSource || 'database'} at ${new Date().toLocaleTimeString()}.`
      });
    }).catch((error) => {
      toast({
        title: "Refresh failed",
        description: "Could not refresh statistics. Please try again.",
        variant: "destructive"
      });
    });
  }, [refetch, stats?.dataSource, toast]);

  return {
    stats: stats || {
      totalUsers: 0,
      subscribedUsers: 0,
      subscribeButtonClicks: 0,
      totalVisitors: 0,
      uniqueVisitors: 0,
      activeUsers: 0,
      newUsersToday: 0,
      newUsersThisWeek: 0,
      conversionRate: 0,
      averageSessionLength: 0,
      retentionRate: 0,
      churnRate: 0,
      errors: [],
      lastUpdated: new Date().toISOString()
    },
    timeSeriesData: timeSeriesData || [],
    buttonAnalytics: buttonAnalytics || {
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
