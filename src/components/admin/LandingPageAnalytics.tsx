
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TodayVisitorsCard from './TodayVisitorsCard';
import HistoricalVisitorsChart from './HistoricalVisitorsChart';
import ButtonClicksChart from './ButtonClicksChart';

export function LandingPageAnalytics() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Landing Page Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Key metrics for your landing page performance
        </p>
      </div>

      {/* Today's Visitors Card */}
      <TodayVisitorsCard />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HistoricalVisitorsChart />
        <ButtonClicksChart />
      </div>
    </div>
  );
}
