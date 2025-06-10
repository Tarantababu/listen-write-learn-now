
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, subDays, parseISO, startOfDay, endOfDay, isValid } from 'date-fns';
import StatsCard from '@/components/StatsCard';
import { Activity, Users, Globe, Info } from 'lucide-react';
import { calculateTrend } from '@/utils/trendUtils';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Alert, AlertDescription } from '@/components/ui/alert';

type VisitorCount = {
  date: string;
  fullDate: Date;
  count: number;
  hasData: boolean;
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
  const [dataStartDate, setDataStartDate] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVisitorStats() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching visitor statistics...');
        
        // Get all visitor data
        const { data: allVisitorData, error: allDataError } = await supabase
          .from('visitors')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (allDataError) {
          console.error('Error fetching visitor data:', allDataError);
          throw allDataError;
        }
        
        console.log('Raw visitor data fetched:', allVisitorData?.length || 0, 'records');
        
        if (!allVisitorData || allVisitorData.length === 0) {
          console.log('No visitor data found');
          setTotalVisitors(0);
          setUniqueVisitors(0);
          setTodayVisitors(0);
          setVisitorCounts([]);
          setPageCounts([]);
          setReferrerCounts([]);
          setLoading(false);
          return;
        }
        
        // Set total visitors
        setTotalVisitors(allVisitorData.length);
        
        // Calculate unique visitors
        const uniqueIds = new Set(allVisitorData.map(visitor => visitor.visitor_id));
        setUniqueVisitors(uniqueIds.size);
        
        // Find earliest data date
        const earliestRecord = allVisitorData[0]; // Already ordered by created_at ascending
        let earliestDate: Date | null = null;
        
        if (earliestRecord?.created_at) {
          try {
            earliestDate = parseISO(earliestRecord.created_at);
            if (isValid(earliestDate)) {
              setDataStartDate(format(earliestDate, 'MMMM d, yyyy'));
            }
          } catch (e) {
            console.error('Error parsing earliest date:', e);
          }
        }
        
        // Calculate today's visitors using proper date comparison
        const today = new Date();
        const todayStart = startOfDay(today);
        const todayEnd = endOfDay(today);
        
        const todayCount = allVisitorData.filter(visitor => {
          if (!visitor.created_at) return false;
          try {
            const visitorDate = parseISO(visitor.created_at);
            return isValid(visitorDate) && visitorDate >= todayStart && visitorDate <= todayEnd;
          } catch (e) {
            return false;
          }
        }).length;
        
        setTodayVisitors(todayCount);
        console.log('Today visitors:', todayCount);
        
        // Process daily visitor counts for the last 30 days
        const currentDate = new Date();
        const dailyCountsMap: Record<string, number> = {};
        
        // Initialize all days in the last 30 days with 0
        for (let i = 30; i >= 0; i--) {
          const date = subDays(currentDate, i);
          const dateKey = format(date, 'yyyy-MM-dd');
          dailyCountsMap[dateKey] = 0;
        }
        
        // Count actual visitors per day
        allVisitorData.forEach(visitor => {
          if (!visitor.created_at) return;
          
          try {
            const visitorDate = parseISO(visitor.created_at);
            if (!isValid(visitorDate)) return;
            
            const dateKey = format(visitorDate, 'yyyy-MM-dd');
            
            // Only count if the date is within our 31-day range
            if (dailyCountsMap.hasOwnProperty(dateKey)) {
              dailyCountsMap[dateKey]++;
            }
          } catch (e) {
            console.error('Error processing visitor date:', visitor.created_at, e);
          }
        });
        
        // Convert to array format for chart
        const dailyCountsArray: VisitorCount[] = [];
        for (let i = 30; i >= 0; i--) {
          const date = subDays(currentDate, i);
          const dateKey = format(date, 'yyyy-MM-dd');
          const formattedDate = format(date, 'MMM dd');
          
          const hasData = earliestDate ? 
            date >= startOfDay(earliestDate) : 
            true;
          
          dailyCountsArray.push({
            date: formattedDate,
            fullDate: date,
            count: dailyCountsMap[dateKey] || 0,
            hasData
          });
        }
        
        setVisitorCounts(dailyCountsArray);
        console.log('Daily counts processed:', dailyCountsArray);
        
        // Process page counts - filter out button clicks and clean page names
        const pageCountsMap: Record<string, number> = {};
        
        allVisitorData.forEach(visitor => {
          if (!visitor.page) return;
          
          let pageName = visitor.page;
          
          // Skip button click tracking events
          if (pageName.startsWith('button_click:')) {
            return;
          }
          
          // Clean up page names for better display
          if (pageName === '/') {
            pageName = 'Home';
          } else if (pageName.startsWith('/')) {
            pageName = pageName.substring(1);
            // Capitalize first letter and replace hyphens/underscores
            pageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
            pageName = pageName.replace(/[-_]/g, ' ');
          }
          
          pageCountsMap[pageName] = (pageCountsMap[pageName] || 0) + 1;
        });
        
        // Convert to array and sort by count
        const pageCountsArray = Object.entries(pageCountsMap)
          .map(([page, count]) => ({ page, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10); // Top 10 pages
        
        setPageCounts(pageCountsArray);
        console.log('Page counts processed:', pageCountsArray);
        
        // Process referrer counts
        const referrerCountsMap: Record<string, number> = {};
        
        allVisitorData.forEach(visitor => {
          let referer = visitor.referer || 'Direct / None';
          
          // Clean up referrer names for better display
          if (referer && referer !== 'Direct / None') {
            try {
              const url = new URL(referer);
              referer = url.hostname.replace('www.', '');
            } catch (e) {
              // If URL parsing fails, use the original referer
            }
          }
          
          referrerCountsMap[referer] = (referrerCountsMap[referer] || 0) + 1;
        });
        
        // Convert to array and sort by count
        const referrerCountsArray = Object.entries(referrerCountsMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8); // Top 8 referrers
        
        setReferrerCounts(referrerCountsArray);
        console.log('Referrer counts processed:', referrerCountsArray);
        
      } catch (err: any) {
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
    
    const currentDate = new Date();
    const yesterday = subDays(currentDate, 1);
    
    const todayStr = format(currentDate, 'MMM dd');
    const yesterdayStr = format(yesterday, 'MMM dd');
    
    // Find today's and yesterday's data by formatted date string
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

  // Configure chart colors with explicit values instead of CSS variables
  const chartConfig = {
    visitors: { 
      color: '#8884d8' // Using direct color instead of CSS variable
    },
    inactive: {
      color: '#e5e5e5' // Light gray for dates before data collection
    },
    pages: { 
      color: '#82ca9d' // Using direct color instead of CSS variable
    },
    sources: {}
  };

  for (let i = 0; i < referrerCounts.length; i++) {
    chartConfig.sources[`source${i}`] = { color: COLORS[i % COLORS.length] };
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
          {dataStartDate && (
            <CardDescription className="flex items-center gap-1 text-amber-600">
              <Info size={14} />
              Data collection began on {dataStartDate}. Earlier dates are shown with lighter bars.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {visitorCounts.length > 0 ? (
              <ChartContainer config={chartConfig} className="w-full h-full">
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
                    <ChartTooltip 
                      content={
                        <ChartTooltipContent 
                          formatter={(value, name, props) => {
                            const entry = props.payload;
                            if (!entry?.hasData) {
                              return ["No data collected yet", "Visitors"];
                            }
                            return [value, "Visitors"];
                          }}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                      } 
                    />
                    <Bar 
                      dataKey="count" 
                      name="Visitors" 
                      fill={chartConfig.visitors.color}
                      shape={(props) => {
                        const { fill, x, y, width, height } = props;
                        const customProps = props.payload?.hasData ? 
                          { fill: chartConfig.visitors.color } : 
                          { fill: chartConfig.inactive.color, fillOpacity: 0.5 };
                        return <rect x={x} y={y} width={width} height={height} {...customProps} />;
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-muted-foreground">No visitor data available for the last 30 days</p>
              </div>
            )}
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
              {referrerCounts.length > 0 ? (
                <ChartContainer config={chartConfig} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={referrerCounts}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {referrerCounts.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <ChartTooltip formatter={(value) => [`${value} views`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-muted-foreground">No referrer data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pages Visited</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {pageCounts.length > 0 ? (
                <ChartContainer config={chartConfig} className="w-full h-full">
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
                        tick={{ fontSize: 12 }}
                      />
                      <ChartTooltip 
                        content={
                          <ChartTooltipContent 
                            formatter={(value, name) => [`${value} views`, name]}
                          />
                        }
                      />
                      <Bar 
                        dataKey="count" 
                        name="Views" 
                        fill={chartConfig.pages.color}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-muted-foreground">No page visit data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
