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

// Custom Bar component for conditional styling
const CustomBar = (props) => {
  const { fill, x, y, width, height, payload } = props;
  const barColor = payload?.hasData ? '#8884d8' : '#e5e5e5';
  const opacity = payload?.hasData ? 1 : 0.5;
  
  return (
    <rect 
      x={x} 
      y={y} 
      width={width} 
      height={height} 
      fill={barColor}
      opacity={opacity}
    />
  );
};

// Custom tooltip for better data display
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const hasData = data?.hasData;
    
    return (
      <div className="bg-white p-3 border rounded shadow-lg">
        <p className="font-medium">{`Date: ${label}`}</p>
        <p className="text-blue-600">
          {`Visitors: ${hasData ? payload[0].value : 'No data collected yet'}`}
        </p>
        {!hasData && (
          <p className="text-xs text-gray-500 mt-1">Data collection hadn't started</p>
        )}
      </div>
    );
  }
  return null;
};

// Custom pie chart tooltip
const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-3 border rounded shadow-lg">
        <p className="font-medium">{data.name}</p>
        <p className="text-blue-600">{`${data.value} visits`}</p>
        <p className="text-xs text-gray-500">{`${((data.value / payload[0].payload.total) * 100 || 0).toFixed(1)}%`}</p>
      </div>
    );
  }
  return null;
};

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
        
        // Get total visitor count (raw visits)
        const { count: totalCount, error: countError } = await supabase
          .from('visitors')
          .select('*', { count: 'exact', head: true });
        
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
        
        // Get today's visitor count - Using timestamp comparison for accurate timezone handling
        const todayStart = startOfDay(new Date()).toISOString();
        
        const { count: todayCount, error: todayError } = await supabase
          .from('visitors')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart);
        
        if (todayError) throw todayError;
        setTodayVisitors(todayCount || 0);
        
        // Get visitor data for the last 31 days (today + 30 previous days)
        const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
        
        const { data: dailyData, error: dailyError } = await supabase
          .from('visitors')
          .select('created_at')
          .gte('created_at', thirtyDaysAgo);
        
        if (dailyError) throw dailyError;
        
        console.log("Raw visitor data count:", dailyData?.length || 0);
        
        // Find the earliest data collection date to mark pre-data-collection dates
        let earliestDate: Date | null = null;
        
        if (dailyData && dailyData.length > 0) {
          // Parse date strings safely, filtering out invalid dates
          const allDates = dailyData
            .map(visitor => {
              try {
                if (!visitor.created_at) return null;
                const date = parseISO(visitor.created_at);
                return isValid(date) ? date : null;
              } catch (e) {
                console.error('Invalid date format:', visitor.created_at);
                return null;
              }
            })
            .filter(date => date !== null) as Date[];
            
          if (allDates.length > 0) {
            earliestDate = new Date(Math.min(...allDates.map(date => date.getTime())));
            setDataStartDate(format(earliestDate, 'MMMM d, yyyy'));
          }
        }
        
        console.log("Earliest data date:", earliestDate?.toISOString() || "No data");
        
        // Process data to count visitors per day - using full date objects for comparison
        const dailyCounts: Record<string, number> = {};
        
        // Initialize all days in the last 31 days with 0
        const currentDate = new Date();
        const dailyCountsArray: VisitorCount[] = [];
        
        for (let i = 30; i >= 0; i--) {
          const date = subDays(currentDate, i);
          const dateStr = format(date, 'yyyy-MM-dd');
          const formattedDate = format(date, 'MMM dd');
          dailyCounts[dateStr] = 0;
          
          const hasData = earliestDate ? 
            date >= startOfDay(earliestDate) : 
            true;
            
          dailyCountsArray.push({
            date: formattedDate, 
            fullDate: date,
            count: 0,
            hasData
          });
        }
        
        // Fill in actual counts by iterating through the visitor data
        if (dailyData) {
          for (const visitor of dailyData) {
            if (visitor.created_at) {
              try {
                // Parse the ISO date and format to YYYY-MM-DD for bucketing
                const visitorDate = parseISO(visitor.created_at);
                
                if (isValid(visitorDate)) {
                  const dateKey = format(visitorDate, 'yyyy-MM-dd');
                  
                  // Only count if the dateKey exists in our dailyCounts (within the 31 day range)
                  if (dailyCounts[dateKey] !== undefined) {
                    dailyCounts[dateKey] += 1;
                  }
                }
              } catch (e) {
                console.error('Error parsing date:', visitor.created_at, e);
              }
            }
          }
        }
        
        // Update counts in the array
        for (let i = 0; i < dailyCountsArray.length; i++) {
          const item = dailyCountsArray[i];
          const dateStr = format(item.fullDate, 'yyyy-MM-dd');
          if (dailyCounts[dateStr] !== undefined) {
            dailyCountsArray[i] = {
              ...item,
              count: dailyCounts[dateStr]
            };
          }
        }
        
        console.log("Daily counts by date:", dailyCounts);
        
        // Sort by date to ensure chronological order (earliest to latest)
        dailyCountsArray.sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
        
        setVisitorCounts(dailyCountsArray);
        
        // Get page counts
        const { data: pageData, error: pageError } = await supabase
          .from('visitors')
          .select('page');
        
        if (pageError) throw pageError;
        
        // Process data to count visits per page
        const pages: Record<string, number> = {};
        
        if (pageData) {
          pageData.forEach((visitor) => {
            if (visitor.page) {
              // Clean up page names for better display
              const cleanPage = visitor.page.replace(/^\/+|\/+$/g, '') || 'Home';
              pages[cleanPage] = (pages[cleanPage] || 0) + 1;
            }
          });
        }
        
        // Convert to array format for chart and sort by count
        const pagesArray = Object.entries(pages)
          .map(([page, count]) => ({ 
            page: page.length > 20 ? page.substring(0, 20) + '...' : page, 
            count 
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10); // Limit to top 10 pages for better visualization
        
        setPageCounts(pagesArray);

        // Get referrer counts
        const { data: referrerData, error: referrerError } = await supabase
          .from('visitors')
          .select('referer');
        
        if (referrerError) throw referrerError;
        
        // Process data to count visits per referrer
        const referrers: Record<string, number> = {};
        
        if (referrerData) {
          referrerData.forEach((visitor) => {
            let referer = visitor.referer || 'Direct / None';
            
            // Clean up referrer names for better display
            if (referer !== 'Direct / None') {
              try {
                const url = new URL(referer);
                referer = url.hostname.replace('www.', '');
              } catch (e) {
                // If URL parsing fails, truncate long referrers
                referer = referer.length > 30 ? referer.substring(0, 30) + '...' : referer;
              }
            }
            
            referrers[referer] = (referrers[referer] || 0) + 1;
          });
        }
        
        // Convert to array format for chart, filter out empty entries and sort
        const totalReferrerCount = Object.values(referrers).reduce((sum, count) => sum + count, 0);
        const referrersArray = Object.entries(referrers)
          .map(([name, value]) => ({ name, value, total: totalReferrerCount }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8); // Limit to top 8 referrers for better visualization
        
        setReferrerCounts(referrersArray);
        
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
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Visitor Statistics</CardTitle>
            <CardDescription>Loading your analytics data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="ml-3 text-gray-600">Loading visitor statistics...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert className="border-red-200 bg-red-50">
          <Info className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Error loading statistics:</strong> {error}
          </AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle>Visitor Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center h-40 text-red-500">
              <div className="text-center">
                <p className="font-medium">{error}</p>
                <p className="text-sm mt-2">Please check your database connection and permissions.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback empty state check
  const hasAnyData = totalVisitors > 0 || uniqueVisitors > 0 || todayVisitors > 0;

  if (!hasAnyData) {
    return (
      <div className="space-y-6">
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            No visitor data has been collected yet. Visit your site to start seeing statistics!
          </AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle>Visitor Statistics</CardTitle>
            <CardDescription>Your analytics will appear here once data is collected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <StatsCard
                title="Total Page Views"
                value={0}
                icon={<Activity className="h-4 w-4" />}
                description="No page views yet"
              />
              
              <StatsCard
                title="Unique Visitors"
                value={0}
                icon={<Users className="h-4 w-4" />}
                description="No unique visitors yet"
              />
              
              <StatsCard
                title="Today's Visitors"
                value={0}
                description="No visitors today"
              />
            </div>
          </CardContent>
        </Card>
      </div>
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
          {dataStartDate && (
            <CardDescription className="flex items-center gap-1 text-amber-600">
              <Info size={14} />
              Data collection began on {dataStartDate}. Earlier dates are shown with lighter bars.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            {visitorCounts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={visitorCounts}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 60,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                    stroke="#666"
                  />
                  <YAxis 
                    fontSize={12}
                    stroke="#666"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="count" 
                    name="Visitors"
                    shape={<CustomBar />}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">No visitor data available for the last 30 days</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Visitors grouped by referrer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              {referrerCounts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={referrerCounts}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {referrerCounts.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px' }}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">No referrer data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              {pageCounts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={pageCounts}
                    layout="vertical"
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" fontSize={12} stroke="#666" />
                    <YAxis 
                      dataKey="page" 
                      type="category" 
                      width={100}
                      fontSize={11}
                      stroke="#666"
                      tick={{ width: 100 }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} views`, 'Page Views']}
                      labelStyle={{ color: '#333' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      name="Views" 
                      fill="#82ca9d"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">No page visit data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}