import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import SkeletonStatsHeatmap from './SkeletonStatsHeatmap';
import { useDelayedLoading } from '@/hooks/use-delayed-loading';

interface ActivityData {
  date: Date;
  count: number;
  masteredWords: number;
}

interface StatsHeatmapProps {
  activityData: ActivityData[];
  isLoading?: boolean;
}

const StatsHeatmap: React.FC<StatsHeatmapProps> = ({ activityData, isLoading = false }) => {
  // Use delayed loading to prevent UI flashing for quick loads
  const showLoading = useDelayedLoading(isLoading, 400);
  
  if (showLoading) {
    return <SkeletonStatsHeatmap />;
  }
  
  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-lg">Activity History</CardTitle>
        <Calendar className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {/* Heatmap visualization goes here */}
        <p className="text-center text-muted-foreground">
          Your learning activity will be displayed here as you complete exercises.
        </p>
      </CardContent>
    </Card>
  );
};

export default StatsHeatmap;
