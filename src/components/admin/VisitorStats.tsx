
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
        
        console.log('Fetching visitor statistics with optimized queries...');
        
        // Get total visitors count using count query (no limit issues)
        const { count: totalVisitorsCount, error: totalVisitorsError } = await supabase
          .from('visitors')
          .select('*', { count: 'exact', head: true });
        
        if (totalVisitorsError) {
          console.error('Error fetching total visitors count:', totalVisitorsError);
          throw totalVisitorsError;
        }
        
        setTotalVisitors(totalVisitorsCount || 0);
        console.log('Total visitors counted:', totalVisitorsCount);
        
        // Get unique visitors count using a more efficient approach
        try {
          // Try to use the database function first - using any to bypass TypeScript check
          const { data: uniqueCount, error: uniqueError } = await (supabase as any)
            .rpc('get_unique_visitor_count');
          
          if (uniqueError) {
            console.log('RPC function not available, using fallback method');
            
            // Fallback: Get a limited sample and calculate unique visitors
            const { data: visitorSample, error: sampleError } = await supabase
              .from('visitors')
              .select('visitor_id')
              .limit(50000) // Increased sample size for better accuracy
              .order('created_at', { ascending: false }); // Get recent visitors first
            
            if (sampleError) {
              throw sampleError;
            }
            
            if (visitorSample) {
              const uniqueIds = new Set(visitorSample.map(v => v.visitor_id));
              setUniqueVisitors(uniqueIds.size);
              console.log('Unique visitors estimated from sample:', uniqueIds.size);
              
              if (visitorSample.length === 50000) {
                console.warn('Sample size reached limit, unique visitors count may be underestimated');
              }
            }
          } else {
            // Ensure the result is a number
            const uniqueVisitorCount = typeof uniqueCount === 'number' ? uniqueCount : 0;
            setUniqueVisitors(uniqueVisitorCount);
            console.log('Unique visitors counted via RPC:', uniqueVisitorCount);
          }
        } catch (uniqueError) {
          console.error('Error calculating unique visitors:', uniqueError);
          setUniqueVisitors(0);
        }
        
        // Get earliest data point for reference
        const { data: earliestRecord, error: earliestError } = await supabase
          .from('visitors')
          .select('created_at')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        let earliestDate: Date | null = null;
        if (!earliestError && earliestRecord?.created_at) {
          try {
            earliestDate = parseISO(earliestRecord.created_at);
            if (isValid(earliestDate)) {
              setDataStartDate(format(earliestDate, 'MMMM d, yyyy'));
            }
          } catch (e) {
            console.error('Error parsing earliest date:', e);
          }
        }
        
        // Calculate today's visitors using count query with date filter
        const today = new Date();
        const todayStart = startOfDay(today).toISOString();
        const todayEnd = endOfDay(today).toISOString();
        
        const { count: todayCount, error: todayError } = await supabase
          .from('visitors')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd);
        
        if (!todayError) {
          setTodayVisitors(todayCount || 0);
          console.log('Today visitors counted:', todayCount);
        }
        
        // Process daily visitor counts for the last 30 days using efficient queries
        const currentDate = new Date();
        const dailyCountsArray: VisitorCount[] = [];
        
        // Get daily counts in batches to avoid overwhelming the database
        for (let i = 30; i >= 0; i--) {
          const date = subDays(currentDate, i);
          const dateStart = startOfDay(date).toISOString();
          const dateEnd = endOfDay(date).toISOString();
          
          try {
            const { count: dayCount } = await supabase
              .from('visitors')
              .select('*', { count: 'exact', head: true })
              .gte('created_at', dateStart)
              .lte('created_at', dateEnd);
            
            const hasData = earliestDate ? date >= startOfDay(earliestDate) : true;
            
            dailyCountsArray.push({
              date: format(date, 'MMM dd'),
              fullDate: date,
              count: dayCount || 0,
              hasData
            });
          } catch (dayError) {
            console.warn(`Error getting count for ${format(date, 'MMM dd')}:`, dayError);
            dailyCountsArray.push({
              date: format(date, 'MMM dd'),
              fullDate: date,
              count: 0,
              hasData: false
            });
          }
        }
        
        setVisitorCounts(dailyCountsArray);
        console.log('Daily counts processed:', dailyCountsArray.length, 'days');
        
        // Use optimized database function for page counts
        try {
          const { data: pageData, error: pageError } = await (supabase as any)
            .rpc('get_top_pages', { limit_count: 10 });
          
          if (!pageError && pageData) {
            const pageCountsArray = pageData.map((item: any) => ({
              page: item.page,
              count: parseInt(item.count, 10)
            }));
            
            setPageCounts(pageCountsArray);
            console.log('Page counts processed via database function:', pageCountsArray.length, 'unique pages');
          } else {
            console.error('Error with get_top_pages function:', pageError);
            setPageCounts([]);
          }
        } catch (pageError) {
          console.error('Error processing page counts:', pageError);
          setPageCounts([]);
        }
        
        // Use optimized database function for referrer counts
        try {
          const { data: referrerData, error: referrerError } = await (supabase as any)
            .rpc('get_top_referrers', { limit_count: 8 });
          
          if (!referrerError && referrerData) {
            const referrerCountsArray = referrerData.map((item: any) => ({
              name: item.name,
              value: parseInt(item.value, 10)
            }));
            
            setReferrerCounts(referrerCountsArray);
            console.log('Referrer counts processed via database function:', referrerCountsArray.length, 'unique referrers');
          } else {
            console.error('Error with get_top_referrers function:', referrerError);
            setReferrerCounts([]);
          }
        } catch (referrerError) {
          console.error('Error processing referrer counts:', referrerError);
          setReferrerCounts([]);
        }
        
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
      color: '#8884d8'
    },
    inactive: {
      color: '#e5e5e5'
    },
    pages: { 
      color: '#82ca9d'
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
