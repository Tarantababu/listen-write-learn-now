
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Shield, AlertTriangle, Activity, Users, Lock, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface SecurityLog {
  id: string;
  user_id: string | null;
  event_type: string;
  event_details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export function SecurityDashboard() {
  const [timeFilter, setTimeFilter] = useState('24h');

  const { data: securityLogs, isLoading, error, refetch } = useQuery({
    queryKey: ['security-logs', timeFilter],
    queryFn: async () => {
      const timeMap = {
        '1h': 1,
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30
      };

      const hoursBack = timeMap[timeFilter] || 24;
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('security_logs')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as SecurityLog[];
    }
  });

  const { data: adminValidation } = useQuery({
    queryKey: ['admin-validation'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('validate_admin_access');
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Admin validation error:', error);
        return false;
      }
    }
  });

  const logCounts = securityLogs?.reduce((acc, log) => {
    acc[log.event_type] = (acc[log.event_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'admin_action':
        return <Shield className="h-4 w-4" />;
      case 'security_violation':
        return <AlertTriangle className="h-4 w-4" />;
      case 'rate_limit':
        return <Lock className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'admin_action':
        return 'bg-blue-50 text-blue-700';
      case 'security_violation':
        return 'bg-red-50 text-red-700';
      case 'rate_limit':
        return 'bg-yellow-50 text-yellow-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  if (!adminValidation) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Access denied. Admin privileges required to view security dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Dashboard
          </h2>
          <p className="text-sm text-muted-foreground">
            Monitor security events and system access
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{securityLogs?.length || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Admin Actions</p>
                <p className="text-2xl font-bold">{logCounts['admin_action'] || 0}</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Security Violations</p>
                <p className="text-2xl font-bold">{logCounts['security_violation'] || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rate Limits</p>
                <p className="text-2xl font-bold">{logCounts['rate_limit'] || 0}</p>
              </div>
              <Lock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Recent Security Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to load security logs. Please check your permissions.
              </AlertDescription>
            </Alert>
          ) : securityLogs?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No security events found in the selected time period.
            </div>
          ) : (
            <div className="space-y-3">
              {securityLogs?.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="mt-1">
                    {getEventIcon(log.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getEventColor(log.event_type)}>
                        {log.event_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      {log.event_details && (
                        <div className="bg-gray-50 p-2 rounded text-xs font-mono">
                          {JSON.stringify(log.event_details, null, 2)}
                        </div>
                      )}
                      <div className="text-muted-foreground">
                        IP: {log.ip_address} | 
                        User: {log.user_id ? log.user_id.substring(0, 8) + '...' : 'Anonymous'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
