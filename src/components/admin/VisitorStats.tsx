
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';

type VisitorCount = {
  date: string;
  count: number;
};

type PageCount = {
  page: string;
  count: number;
};

export function VisitorStats() {
  const [visitorCounts, setVisitorCounts] = useState<VisitorCount[]>([]);
  const [pageCounts, setPageCounts] = useState<PageCount[]>([]);
  const [totalVisitors, setTotalVisitors] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVisitorStats() {
      try {
        setLoading(true);
        
        // Get total visitor count
        const { count, error: countError } = await supabase
          .from('visitors')
          .select('*', { count: 'exact', head: true });
        
        if (countError) throw countError;
        setTotalVisitors(count || 0);
        
        // Get visitor counts by day for the last 30 days
        const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        
        const { data: dailyData, error: dailyError } = await supabase
          .from('visitors')
          .select('created_at')
          .gte('created_at', thirtyDaysAgo);
        
        if (dailyError) throw dailyError;
        
        // Process data to count visitors per day
        const dailyCounts: Record<string, number> = {};
        
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
      } catch (err) {
        console.error('Error fetching visitor stats:', err);
        setError('Failed to load visitor statistics');
      } finally {
        setLoading(false);
      }
    }
    
    fetchVisitorStats();
  }, []);

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
      <Card>
        <CardHeader>
          <CardTitle>Total Visitors</CardTitle>
          <CardDescription>Number of unique visitors tracked since launch</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{totalVisitors}</div>
        </CardContent>
      </Card>

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
  );
}
