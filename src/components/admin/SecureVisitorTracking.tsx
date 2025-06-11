
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Shield, TrendingUp, Users, Globe, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

export function SecureVisitorTracking() {
  const [timeRange, setTimeRange] = useState('7d');

  const { data: visitorData, isLoading, error } = useQuery({
    queryKey: ['secure-visitors', timeRange],
    queryFn: async () => {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 1;
      const since = subDays(new Date(), days).toISOString();

      const { data, error } = await supabase
        .from('visitors')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  const { data: rateLimitStats } = useQuery({
    queryKey: ['rate-limit-stats'],
    queryFn: async () => {
      const oneDayAgo = subDays(new Date(), 1).toISOString();

      // Get rate limit violations from security logs
      const { data, error } = await supabase
        .from('security_logs')
        .select('*')
        .eq('event_type', 'rate_limit')
        .gte('created_at', oneDayAgo);

      if (error) throw error;
      return data;
    }
  });

  const testSecureTracking = async () => {
    try {
      // Test the secure visitor tracking function
      const { data, error } = await supabase.rpc('track_visitor_secure', {
        visitor_id_param: 'test-' + Date.now(),
        page_param: 'admin-test',
        referer_param: window.location.href,
        user_agent_param: navigator.userAgent,
        ip_address_param: '127.0.0.1' // Will be anonymized
      });

      if (error) throw error;
      
      alert('Secure tracking test successful!');
    } catch (error) {
      console.error('Secure tracking test failed:', error);
      alert('Secure tracking test failed: ' + error.message);
    }
  };

  // Process visitor data for charts
  const chartData = React.useMemo(() => {
    if (!visitorData) return [];

    const dailyStats = visitorData.reduce((acc, visitor) => {
      const date = format(new Date(visitor.created_at), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = {
          date,
          visits: 0,
          uniqueIps: new Set()
        };
      }
      acc[date].visits++;
      acc[date].uniqueIps.add(visitor.ip_address);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(dailyStats).map((day: any) => ({
      date: day.date,
      visits: day.visits,
      uniqueIps: day.uniqueIps.size
    }));
  }, [visitorData]);

  const suspiciousActivity = React.useMemo(() => {
    if (!visitorData) return [];

    // Detect potential suspicious patterns
    const ipCounts = visitorData.reduce((acc, visitor) => {
      acc[visitor.ip_address] = (acc[visitor.ip_address] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(ipCounts)
      .filter(([ip, count]) => count > 50) // More than 50 requests
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count);
  }, [visitorData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Secure Visitor Tracking
          </h3>
          <p className="text-sm text-muted-foreground">
            Enhanced visitor analytics with security monitoring
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="1d">Last Day</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button variant="outline" size="sm" onClick={testSecureTracking}>
            Test Secure Tracking
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Visits</p>
                <p className="text-2xl font-bold">{visitorData?.length || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique IPs</p>
                <p className="text-2xl font-bold">
                  {new Set(visitorData?.map(v => v.ip_address)).size || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rate Limits</p>
                <p className="text-2xl font-bold">{rateLimitStats?.length || 0}</p>
              </div>
              <Shield className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Suspicious IPs</p>
                <p className="text-2xl font-bold">{suspiciousActivity.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visitor Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Visitor Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="visits" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Total Visits"
                />
                <Line 
                  type="monotone" 
                  dataKey="uniqueIps" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Unique IPs"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Suspicious Activity */}
      {suspiciousActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Suspicious Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                High request volumes detected from the following IP addresses:
              </AlertDescription>
            </Alert>
            <div className="mt-4 space-y-2">
              {suspiciousActivity.slice(0, 10).map(({ ip, count }) => (
                <div key={ip} className="flex justify-between items-center p-2 border rounded">
                  <span className="font-mono text-sm">{ip}</span>
                  <span className="text-sm font-semibold text-red-600">{count} requests</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
