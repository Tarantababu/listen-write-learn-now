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
const StatsHeatmap: React.FC<StatsHeatmapProps> = ({
  activityData,
  isLoading = false
}) => {
  // Use delayed loading to prevent UI flashing for quick loads
  const showLoading = useDelayedLoading(isLoading, 400);
  if (showLoading) {
    return <SkeletonStatsHeatmap />;
  }
  return;
};
export default StatsHeatmap;