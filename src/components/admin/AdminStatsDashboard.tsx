
import React, { useState } from 'react';
import { EnhancedAdminDashboard } from './EnhancedAdminDashboard';
import { SecurityDashboard } from './SecurityDashboard';
import { SecureVisitorTracking } from './SecureVisitorTracking';
import { VisitorStats } from './VisitorStats';
import { RealTimeMonitor } from './RealTimeMonitor';
import { AdminSecurityWrapper } from './AdminSecurityWrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Activity, Users, TrendingUp, Radio } from 'lucide-react';

export function AdminStatsDashboard() {
  return (
    <AdminSecurityWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive analytics, security monitoring, and real-time tracking
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="realtime" className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              Real-Time
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="visitors" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Visitors
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Tracking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <EnhancedAdminDashboard />
          </TabsContent>

          <TabsContent value="realtime">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RealTimeMonitor />
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Real-Time Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Monitor live activity as it happens on your platform. Track new visitors, 
                      user registrations, subscription changes, and button interactions in real-time.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <SecurityDashboard />
          </TabsContent>

          <TabsContent value="visitors">
            <VisitorStats />
          </TabsContent>

          <TabsContent value="tracking">
            <SecureVisitorTracking />
          </TabsContent>
        </Tabs>
      </div>
    </AdminSecurityWrapper>
  );
}
