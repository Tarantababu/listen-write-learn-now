
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import StatsCard from '@/components/StatsCard';
import { Activity, Users, Globe } from 'lucide-react';
import { calculateTrend, compareWithPreviousDay } from '@/utils/trendUtils';

type VisitorCount = {
  date: string;
  count: number;
};

type PageCount = {
  page: string;
  count: number;
};

type ReferrerCount = {
  name: string;
  value: number;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#FF6666'];

export function VisitorStats() {
  const [visitorCounts, setVisitorCounts] = useState<VisitorCount[]>([]);
  const [pageCounts, setPageCounts] = useState<PageCount[]>([]);
  const [referrerCounts, setReferrerCounts] = useState<ReferrerCount[]>([]);
  const [totalVisitors, setTotalVisitors] = useState<number>(0);
  const [uniqueVisitors, setUniqueVisitors] = useState<number>(0);
  const [todayVisitors, setTodayVisitors] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVisitorStats() {
      try {
        setLoading(true);
        setError(null);
        
        // Get total visitor count (raw visits)
        const { count: totalCount, error: countError } = await supabase
          .from('visitors')
          .select('*', { count: 'exact', head: false });
        
        if (countError) throw countError;
        setTotalVisitors(totalCount || 0);
        
        // Get unique visitor count
        const { data: uniqueData, error: uniqueError } = await supabase
          .from('visitors')
          .select('visitor_id');
        
        if (uniqueError) throw uniqueError;
        
        // Count unique visitor IDs
        const uniqueIds = new Set(uniqueData?.map(visitor => visitor.visitor_id));
        setUniqueVisitors(uniqueIds.size);
        
        // Get today's visitor count
        const today = format(new Date(), 'yyyy-MM-dd');
        const { count: todayCount, error: todayError } = await supabase
          .from('visitors')
          .select('*', { count: 'exact', head: false })
          .gte('created_at', today);
        
        if (todayError) throw todayError;
        setTodayVisitors(todayCount || 0);
        
        // Get visitor counts by day for the last 30 days
        const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        
        const { data: dailyData, error: dailyError } = await supabase
          .from('visitors')
          .select('created_at')
          .gte('created_at', thirtyDaysAgo);
        
        if (dailyError) throw dailyError;
        
        // Process data to count visitors per day
        const dailyCounts: Record<string, number> = {};
        
        // Initialize all days in the last 30 days with 0
        for (let i = 30; i >= 0; i--) {
          const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
          dailyCounts[date] = 0;
        }
        
        // Fill in actual counts
        dailyData?.forEach((visitor) => {
          const date = format(parseISO(visitor.created_at), 'yyyy-MM-dd');
          dailyCounts[date] = (dailyCounts[date] || 0) + 1;
        });
        
        // Convert to array format for chart
        const dailyCountsArray = Object.entries(dailyCounts).map(([date, count]) => ({
          date: format(parseISO(date), 'MMM dd'),
          count
        }));
        
        setVisitorCounts(dailyCountsArray);
        
        // Get page counts
        const { data: pageData, error: pageError } = await supabase
          .from('visitors')
          .select('page');
        
        if (pageError) throw pageError;
        
        // Process data to count visits per page
        const pages: Record<string, number> = {};
        
        pageData?.forEach((visitor) => {
          pages[visitor.page] = (pages[visitor.page] || 0) + 1;
        });
        
        // Convert to array format for chart
        const pagesArray = Object.entries(pages).map(([page, count]) => ({
          page,
          count
        }));
        
        setPageCounts(pagesArray);

        // Get referrer counts
        const { data: referrerData, error: referrerError } = await supabase
          .from('visitors')
          .select('referer');
        
        if (referrerError) throw referrerError;
        
        // Process data to count visits per referrer
        const referrers: Record<string, number> = {};
        
        referrerData?.forEach((visitor) => {
          const referer = visitor.referer || 'Direct / None';
          referrers[referer] = (referrers[referer] || 0) + 1;
        });
        
        // Convert to array format for chart and filter out empty entries
        const referrersArray = Object.entries(referrers)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value); // Sort by count descending
        
        setReferrerCounts(referrersArray);
        
      } catch (err) {
        console.error('Error fetching visitor stats:', err);
        setError('Failed to load visitor statistics. Please ensure you have the correct permissions.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchVisitorStats();
  }, []);

  // Calculate trends
  const calculateVisitorTrend = () => {
    if (visitorCounts.length < 2) return { value: 0, label: 'No previous data' };
    
    const today = new Date();
    const yesterday = subDays(today, 1);
    
    const todayStr = format(today, 'MMM dd');
    const yesterdayStr = format(yesterday, 'MMM dd');
    
    const todayData = visitorCounts.find(item => item.date === todayStr);
    const yesterdayData = visitorCounts.find(item => item.date === yesterdayStr);
    
    const todayValue = todayData?.count || 0;
    const yesterdayValue = yesterdayData?.count || 0;
    
    return calculateTrend(todayValue, yesterdayValue);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visitor Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <p>Loading visitor statistics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visitor Statistics</CardTitle>
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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total Page Views"
          value={totalVisitors}
          icon={<Activity className="h-4 w-4" />}
          description="Total page views since tracking began"
        />
        
        <StatsCard
          title="Unique Visitors"
          value={uniqueVisitors}
          icon={<Users className="h-4 w-4" />}
          description="Number of unique visitors tracked"
        />
        
        <StatsCard
          title="Today's Visitors"
          value={todayVisitors}
          description="Visitors today"
          trend={calculateVisitorTrend()}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Visitors (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={visitorCounts}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 50,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={70} 
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Visitors grouped by referrer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={referrerCounts.slice(0, 8)} // Take top 8 referrers
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {referrerCounts.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} views`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pages Visited</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={pageCounts}
                  layout="vertical"
                  margin={{
                    top: 20,
                    right: 30,
                    left: 100,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="page" 
                    type="category" 
                    width={80} 
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
