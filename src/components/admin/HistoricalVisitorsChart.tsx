
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, parseISO, isValid } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

type DailyVisitorData = {
  date: string;
  visitors: number;
};

export default function HistoricalVisitorsChart() {
  const { data: chartData, isLoading, error } = useQuery({
    queryKey: ['historical-landing-visitors'],
    queryFn: async (): Promise<DailyVisitorData[]> => {
      // Get last 30 days of data
      const endDate = new Date();
      const startDate = subDays(endDate, 29); // 30 days total
      
      const { data, error } = await supabase
        .from('visitors')
        .select('created_at')
        .eq('page', 'landing_page')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching historical visitors:', error);
        throw error;
      }
      
      // Group by day
      const dailyCountsMap: Record<string, number> = {};
      
      // Initialize all days with 0
      for (let i = 0; i < 30; i++) {
        const date = subDays(endDate, 29 - i);
        const dateKey = format(date, 'yyyy-MM-dd');
        dailyCountsMap[dateKey] = 0;
      }
      
      // Count actual visits per day
      data?.forEach(visitor => {
        if (!visitor.created_at) return;
        
        try {
          const visitorDate = parseISO(visitor.created_at);
          if (!isValid(visitorDate)) return;
          
          const dateKey = format(visitorDate, 'yyyy-MM-dd');
          if (dailyCountsMap.hasOwnProperty(dateKey)) {
            dailyCountsMap[dateKey]++;
          }
        } catch (e) {
          console.warn('Error parsing visitor date:', visitor.created_at);
        }
      });
      
      // Convert to chart format
      return Object.entries(dailyCountsMap).map(([dateKey, count]) => ({
        date: format(new Date(dateKey), 'MMM dd'),
        visitors: count
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const chartConfig = {
    visitors: { color: '#3b82f6' }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Landing Page Visitors (Last 30 Days)</CardTitle>
        <CardDescription>
          Daily visitor count to your landing page
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">Loading chart data...</p>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-red-500">Error loading chart data</p>
            </div>
          ) : chartData && chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        formatter={(value) => [`${value} visitors`, "Visitors"]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                    } 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="visitors" 
                    stroke={chartConfig.visitors.color}
                    strokeWidth={2}
                    dot={{ fill: chartConfig.visitors.color, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">No visitor data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
