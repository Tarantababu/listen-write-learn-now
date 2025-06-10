import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, CreditCard, MousePointerClick, AlertCircle } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { UserStats } from './UserStats';
import { useAdminStats } from '@/hooks/use-admin-stats';
export function AdminStatsDashboard() {
  const {
    stats,
    isLoading,
    isError,
    refreshStats,
    error
  } = useAdminStats();
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Admin Statistics Dashboard</h2>
        <Button variant="outline" size="sm" onClick={refreshStats} className="flex gap-2 items-center">
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {isError && <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex gap-2 items-center text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load data from admin statistics service. Using fallback data. Error: {error?.message}</p>
            </div>
          </CardContent>
        </Card>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Users" value={stats.totalUsers} icon={<Users className="h-4 w-4" />} description="Total registered users" isLoading={isLoading} />
        
        <StatsCard title="Subscribed Users" value={stats.subscribedUsers} icon={<CreditCard className="h-4 w-4" />} description="Users with active subscriptions" isLoading={isLoading} />
        
        <StatsCard title="Subscribe Button Clicks" value={stats.subscribeButtonClicks} icon={<MousePointerClick className="h-4 w-4" />} description="Number of times users clicked Subscribe" isLoading={isLoading} />
      </div>
      
      
    </div>;
}