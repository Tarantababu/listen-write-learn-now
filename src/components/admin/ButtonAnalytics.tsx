
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MousePointerClick, Users, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface ButtonAnalyticsData {
  totalClicks: number;
  uniqueClickers: number;
  conversionRate: number;
  clicksByPage: Array<{ page: string; clicks: number }>;
}

interface ButtonAnalyticsProps {
  data: ButtonAnalyticsData;
  isLoading?: boolean;
}

const ButtonAnalytics = ({ data, isLoading = false }: ButtonAnalyticsProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointerClick className="h-5 w-5" />
            Button Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    clicks: { color: '#8884d8' }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MousePointerClick className="h-5 w-5" />
          Button Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Clicks</p>
                  <p className="text-2xl font-bold">{data.totalClicks.toLocaleString()}</p>
                </div>
                <MousePointerClick className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unique Clickers</p>
                  <p className="text-2xl font-bold">{data.uniqueClickers.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold">{data.conversionRate.toFixed(2)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Click Efficiency Metrics */}
          <div className="p-4 border rounded-lg bg-card">
            <h4 className="text-sm font-medium mb-3">Click Efficiency</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Click-to-User Ratio</span>
                <span>{data.uniqueClickers > 0 ? (data.totalClicks / data.uniqueClickers).toFixed(2) : '0'} clicks/user</span>
              </div>
              <Progress 
                value={data.uniqueClickers > 0 ? Math.min((data.totalClicks / data.uniqueClickers) * 20, 100) : 0} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                Average clicks per unique visitor
              </p>
            </div>
          </div>

          {/* Clicks by Page */}
          {data.clicksByPage.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Clicks by Page</h4>
              <div className="h-64">
                <ChartContainer config={chartConfig} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.clicksByPage} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="page" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                      />
                      <Bar 
                        dataKey="clicks" 
                        fill={chartConfig.clicks.color}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>
          )}

          {/* Page Performance List */}
          {data.clicksByPage.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Page Performance</h4>
              <div className="space-y-2">
                {data.clicksByPage.slice(0, 5).map((page, index) => {
                  const percentage = (page.clicks / data.totalClicks) * 100;
                  return (
                    <div key={page.page} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="text-sm font-medium">{page.page}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {page.clicks} clicks
                        </span>
                        <Badge variant="secondary">
                          {percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ButtonAnalytics;
