
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import StatsCard from '@/components/StatsCard';
import { Users, CreditCard, MousePointerClick } from 'lucide-react';

export function AdminStats() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    subscribedUsers: 0,
    subscribeButtonClicks: 0
  });

  useEffect(() => {
    async function fetchAdminStats() {
      try {
        setLoading(true);
        setError(null);

        if (!user) {
          setError('Authentication required');
          return;
        }

        const { data, error } = await supabase.functions.invoke('get-admin-stats');

        if (error) {
          console.error('Error fetching admin stats:', error);
          setError('Failed to load admin statistics');
          return;
        }

        setStats({
          totalUsers: data.totalUsers || 0,
          subscribedUsers: data.subscribedUsers || 0,
          subscribeButtonClicks: data.subscribeButtonClicks || 0
        });
      } catch (err) {
        console.error('Unexpected error fetching admin stats:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchAdminStats();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <p>Loading admin statistics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40 text-red-500">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatsCard
        title="Total Users"
        value={stats.totalUsers}
        icon={<Users className="h-4 w-4" />}
        description="Total registered users"
      />
      
      <StatsCard
        title="Subscribed Users"
        value={stats.subscribedUsers}
        icon={<CreditCard className="h-4 w-4" />}
        description="Users with active subscriptions"
      />
      
      <StatsCard
        title="Subscribe Button Clicks"
        value={stats.subscribeButtonClicks}
        icon={<MousePointerClick className="h-4 w-4" />}
        description="Number of times users clicked Subscribe"
      />
    </div>
  );
}
