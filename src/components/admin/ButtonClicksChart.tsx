
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

type ButtonClickData = {
  button: string;
  clicks: number;
};

export default function ButtonClicksChart() {
  const { data: buttonData, isLoading, error } = useQuery({
    queryKey: ['button-clicks-last-30-days'],
    queryFn: async (): Promise<ButtonClickData[]> => {
      // Get last 30 days of button click data
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      const { data, error } = await supabase
        .from('visitors')
        .select('page')
        .like('page', 'button_click:%')
        .gte('created_at', thirtyDaysAgo);
      
      if (error) {
        console.error('Error fetching button clicks:', error);
        throw error;
      }
      
      // Count clicks per button
      const buttonClicksMap: Record<string, number> = {};
      
      data?.forEach(visitor => {
        if (visitor.page && visitor.page.startsWith('button_click:')) {
          const buttonName = visitor.page.replace('button_click:', '');
          // Clean up button names for better display
          const cleanButtonName = buttonName
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          buttonClicksMap[cleanButtonName] = (buttonClicksMap[cleanButtonName] || 0) + 1;
        }
      });
      
      // Convert to chart format and sort by clicks (descending)
      return Object.entries(buttonClicksMap)
        .map(([button, clicks]) => ({ button, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10); // Top 10 buttons
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const chartConfig = {
    clicks: { color: '#10b981' }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Button Clicks (Last 30 Days)</CardTitle>
        <CardDescription>
          Most clicked buttons on your landing page
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">Loading button data...</p>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-red-500">Error loading button data</p>
            </div>
          ) : buttonData && buttonData.length > 0 ? (
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={buttonData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="button" 
                    type="category" 
                    width={90}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        formatter={(value) => [`${value} clicks`, "Clicks"]}
                      />
                    }
                  />
                  <Bar 
                    dataKey="clicks" 
                    fill={chartConfig.clicks.color}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">No button click data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
