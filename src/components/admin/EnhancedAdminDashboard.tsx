
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Users, CreditCard, MousePointerClick, AlertCircle, TrendingUp, UserPlus, Activity, Database, Cloud, Globe, Eye, AlertTriangle } from 'lucide-react';
import { useEnhancedAdminStats } from '@/hooks/use-enhanced-admin-stats';
import EnhancedMetricsCard from './EnhancedMetricsCard';
import TimePeriodSelector from './TimePeriodSelector';
import ButtonAnalytics from './ButtonAnalytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export function EnhancedAdminDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const {
    stats,
    timeSeriesData,
    buttonAnalytics,
    isLoading,
    isError,
    refreshStats,
    error
  } = useEnhancedAdminStats(timeRange);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      console.log('Auto-refreshing admin stats...');
      refreshStats();
    }, 30000); // Refresh every 30 seconds when enabled
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshStats]);

  const calculateTrend = (current: number, previous: number = 0) => ({
    value: current - previous,
    percentage: previous > 0 ? ((current - previous) / previous) * 100 : 0,
    isPositive: current >= previous
  });

  const chartConfig = {
    users: { color: '#8884d8' },
    subscribers: { color: '#82ca9d' },
    buttonClicks: { color: '#ffc658' },
    visitors: { color: '#ff7c7c' }
  };

  const getDataSourceInfo = (source: string | undefined) => {
    switch (source) {
      case 'stripe_enhanced':
        return {
          label: 'Stripe Enhanced',
          icon: <Cloud className="h-3 w-3" />,
          variant: 'default' as const,
          description: 'Real-time enhanced data from Stripe API with comprehensive subscription tracking'
        };
      case 'stripe_direct':
        return {
          label: 'Stripe Direct',
          icon: <Cloud className="h-3 w-3" />,
          variant: 'default' as const,
          description: 'Real-time data from Stripe API'
        };
      case 'database_comprehensive_fallback':
        return {
          label: 'Database Enhanced',
          icon: <Database className="h-3 w-3" />,
          variant: 'secondary' as const,
          description: 'Comprehensive cached data from database with error handling'
        };
      case 'database_fallback':
        return {
          label: 'Database Cache',
          icon: <Database className="h-3 w-3" />,
          variant: 'secondary' as const,
          description: 'Cached data from database'
        };
      case 'database_only':
        return {
          label: 'Database Only',
          icon: <Database className="h-3 w-3" />,
          variant: 'outline' as const,
          description: 'Database data only (Stripe not configured)'
        };
      case 'error_state':
        return {
          label: 'Error State',
          icon: <AlertTriangle className="h-3 w-3" />,
          variant: 'destructive' as const,
          description: 'Multiple data source failures detected'
        };
      default:
        return {
          label: 'Unknown',
          icon: <AlertCircle className="h-3 w-3" />,
          variant: 'destructive' as const,
          description: 'Data source unknown'
        };
    }
  };

  const dataSourceInfo = getDataSourceInfo(stats.dataSource);

  return (
    <div className="space-y-6">
      {/* Enhanced Header with auto-refresh toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Enhanced Admin Dashboard</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">
              Comprehensive analytics and user metrics
            </p>
            <Badge variant={dataSourceInfo.variant} className="flex items-center gap-1">
              {dataSourceInfo.icon}
              {dataSourceInfo.label}
            </Badge>
            {stats.lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated: {new Date(stats.lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <TimePeriodSelector value={timeRange} onChange={setTimeRange} />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-green-50 border-green-200" : ""}
            >
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshStats} 
              className="flex gap-2 items-center"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Error Alerts */}
      {isError && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Data service error:</strong> {error?.message || 'Unknown error occurred'}
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={refreshStats}>
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Data Source and Error Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-2 items-center text-blue-600">
              {dataSourceInfo.icon}
              <div>
                <p className="text-sm">
                  <strong>Data Source:</strong> {dataSourceInfo.description}
                </p>
                {stats.dataSource === 'stripe_enhanced' && (
                  <p className="text-xs text-green-600 mt-1">✓ Enhanced Stripe integration with comprehensive tracking</p>
                )}
                {stats.dataSource === 'stripe_direct' && (
                  <p className="text-xs text-green-600 mt-1">✓ Live subscription data from Stripe</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {stats.errors && stats.errors.length > 0 && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex gap-2 items-start text-amber-700">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Data Collection Issues:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    {stats.errors.slice(0, 3).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {stats.errors.length > 3 && (
                      <li>• ... and {stats.errors.length - 3} more issues</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Enhanced Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <EnhancedMetricsCard
          title="Total Users"
          value={stats.totalUsers}
          description="Total registered accounts"
          icon={<Users className="h-4 w-4" />}
          trend={calculateTrend(stats.totalUsers, stats.totalUsers - stats.newUsersThisWeek)}
          isLoading={isLoading}
          color="default"
        />
        
        <EnhancedMetricsCard
          title="Active Subscribers"
          value={stats.subscribedUsers}
          description={`Users with paid subscriptions (${dataSourceInfo.label})`}
          icon={<CreditCard className="h-4 w-4" />}
          trend={calculateTrend(stats.subscribedUsers, Math.max(0, stats.subscribedUsers - 5))}
          isLoading={isLoading}
          color={stats.dataSource === 'stripe_enhanced' || stats.dataSource === 'stripe_direct' ? 'success' : 'warning'}
        />
        
        <EnhancedMetricsCard
          title="Total Visitors"
          value={stats.totalVisitors}
          description="All tracked page visits"
          icon={<Globe className="h-4 w-4" />}
          isLoading={isLoading}
          color="default"
        />
        
        <EnhancedMetricsCard
          title="Unique Visitors"
          value={stats.uniqueVisitors}
          description="Distinct visitors tracked"
          icon={<Eye className="h-4 w-4" />}
          isLoading={isLoading}
          color="default"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <EnhancedMetricsCard
          title="New Users Today"
          value={stats.newUsersToday}
          description="Signups in last 24 hours"
          icon={<UserPlus className="h-4 w-4" />}
          trend={calculateTrend(stats.newUsersToday, 2)}
          isLoading={isLoading}
          color="default"
        />
        
        <EnhancedMetricsCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          description="Users to subscribers ratio"
          icon={<TrendingUp className="h-4 w-4" />}
          trend={calculateTrend(stats.conversionRate, Math.max(0, stats.conversionRate - 0.5))}
          isLoading={isLoading}
          formatValue={(val) => typeof val === 'string' ? val : `${val}%`}
          color={stats.conversionRate > 5 ? 'success' : stats.conversionRate > 2 ? 'warning' : 'danger'}
        />
        
        <EnhancedMetricsCard
          title="Active Users"
          value={stats.activeUsers}
          description={`Users active in last ${timeRange.replace('d', ' days')}`}
          icon={<Activity className="h-4 w-4" />}
          isLoading={isLoading}
        />
        
        <EnhancedMetricsCard
          title="Button Clicks"
          value={buttonAnalytics.totalClicks}
          description="Total subscribe button clicks"
          icon={<MousePointerClick className="h-4 w-4" />}
          isLoading={isLoading}
        />
      </div>

      {/* Enhanced Time Series Chart */}
      {timeSeriesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>User Growth & Traffic Over Time</CardTitle>
            <CardDescription>
              Daily metrics including users, subscribers, visitors, and interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeriesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area 
                      type="monotone" 
                      dataKey="visitors" 
                      stackId="1"
                      stroke={chartConfig.visitors.color}
                      fill={chartConfig.visitors.color}
                      fillOpacity={0.3}
                      name="Visitors"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stackId="2"
                      stroke={chartConfig.users.color}
                      fill={chartConfig.users.color}
                      fillOpacity={0.6}
                      name="New Users"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="subscribers" 
                      stackId="3"
                      stroke={chartConfig.subscribers.color}
                      fill={chartConfig.subscribers.color}
                      fillOpacity={0.8}
                      name="New Subscribers"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Button Analytics */}
      <ButtonAnalytics data={buttonAnalytics} isLoading={isLoading} />

      {/* Enhanced Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights & Funnel Analysis</CardTitle>
          <CardDescription>
            Key metrics and conversion funnel with enhanced tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-3">Enhanced Conversion Funnel</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm">Total Visitors</span>
                  <span className="font-semibold">{stats.totalVisitors.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm">Unique Visitors</span>
                  <span className="font-semibold">{stats.uniqueVisitors.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm">Button Clicks</span>
                  <span className="font-semibold">{buttonAnalytics.totalClicks.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm">Registrations</span>
                  <span className="font-semibold">{stats.totalUsers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded bg-green-50">
                  <span className="text-sm">Conversions</span>
                  <span className="font-semibold text-green-600">{stats.subscribedUsers.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-3">Key Performance Ratios</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm">Visitor-to-User Rate</span>
                  <span className="font-semibold">
                    {stats.uniqueVisitors > 0 
                      ? ((stats.totalUsers / stats.uniqueVisitors) * 100).toFixed(1) 
                      : '0'}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm">Click-to-Registration</span>
                  <span className="font-semibold">
                    {buttonAnalytics.totalClicks > 0 
                      ? ((stats.totalUsers / buttonAnalytics.totalClicks) * 100).toFixed(1) 
                      : '0'}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm">User-to-Subscriber</span>
                  <span className="font-semibold">{stats.conversionRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm">Active User Rate</span>
                  <span className="font-semibold">
                    {stats.totalUsers > 0 
                      ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) 
                      : '0'}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded bg-blue-50">
                  <span className="text-sm">Overall Efficiency</span>
                  <span className="font-semibold text-blue-600">
                    {stats.uniqueVisitors > 0 
                      ? ((stats.subscribedUsers / stats.uniqueVisitors) * 100).toFixed(2) 
                      : '0'}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
