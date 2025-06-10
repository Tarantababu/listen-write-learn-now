
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, CreditCard, MousePointerClick, AlertCircle, TrendingUp, UserPlus, Activity } from 'lucide-react';
import { useEnhancedAdminStats } from '@/hooks/use-enhanced-admin-stats';
import EnhancedMetricsCard from './EnhancedMetricsCard';
import TimePeriodSelector from './TimePeriodSelector';
import ButtonAnalytics from './ButtonAnalytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export function EnhancedAdminDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const {
    stats,
    timeSeriesData,
    buttonAnalytics,
    isLoading,
    isError,
    refreshStats,
    error
  } = useEnhancedAdminStats(timeRange);

  // Calculate trends (mock data for now - would need historical data for real trends)
  const calculateTrend = (current: number, previous: number = 0) => ({
    value: current - previous,
    percentage: previous > 0 ? ((current - previous) / previous) * 100 : 0,
    isPositive: current >= previous
  });

  const chartConfig = {
    users: { color: '#8884d8' },
    subscribers: { color: '#82ca9d' },
    buttonClicks: { color: '#ffc658' }
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Enhanced Admin Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Comprehensive analytics and user metrics
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <TimePeriodSelector value={timeRange} onChange={setTimeRange} />
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

      {/* Error Alert */}
      {isError && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex gap-2 items-center text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <p>
                Data service temporarily unavailable. Showing fallback data. 
                Error: {error?.message}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Grid */}
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
          description="Users with paid subscriptions"
          icon={<CreditCard className="h-4 w-4" />}
          trend={calculateTrend(stats.subscribedUsers, Math.max(0, stats.subscribedUsers - 5))}
          isLoading={isLoading}
          color="success"
        />
        
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
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <EnhancedMetricsCard
          title="Active Users"
          value={stats.activeUsers}
          description={`Users active in last ${timeRange.replace('d', ' days')}`}
          icon={<Activity className="h-4 w-4" />}
          isLoading={isLoading}
        />
        
        <EnhancedMetricsCard
          title="New This Week"
          value={stats.newUsersThisWeek}
          description="New registrations this week"
          icon={<UserPlus className="h-4 w-4" />}
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

      {/* Time Series Chart */}
      {timeSeriesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>User Growth Over Time</CardTitle>
            <CardDescription>
              Daily user registrations and subscriber growth
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
                      dataKey="users" 
                      stackId="1"
                      stroke={chartConfig.users.color}
                      fill={chartConfig.users.color}
                      fillOpacity={0.6}
                      name="New Users"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="subscribers" 
                      stackId="2"
                      stroke={chartConfig.subscribers.color}
                      fill={chartConfig.subscribers.color}
                      fillOpacity={0.6}
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

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>
            Key metrics and recommendations for improvement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-3">Conversion Funnel</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm">Total Visitors</span>
                  <span className="font-semibold">{buttonAnalytics.uniqueClickers + stats.totalUsers}</span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm">Button Clicks</span>
                  <span className="font-semibold">{buttonAnalytics.totalClicks}</span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm">Registrations</span>
                  <span className="font-semibold">{stats.totalUsers}</span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded bg-green-50">
                  <span className="text-sm">Conversions</span>
                  <span className="font-semibold text-green-600">{stats.subscribedUsers}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-3">Key Ratios</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm">Click-to-Registration</span>
                  <span className="font-semibold">
                    {buttonAnalytics.totalClicks > 0 
                      ? ((stats.totalUsers / buttonAnalytics.totalClicks) * 100).toFixed(1) 
                      : '0'}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm">Registration-to-Subscription</span>
                  <span className="font-semibold">{stats.conversionRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm">Daily Active Users</span>
                  <span className="font-semibold">
                    {stats.totalUsers > 0 
                      ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) 
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
