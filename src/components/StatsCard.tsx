import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { TrendData } from '@/utils/trendUtils';

interface StatsCardProps {
  title: string;
  value: number;
  description: string;
  icon?: React.ReactNode;
  progress?: number;
  progressColor?: string;
  trend?: { value: number; label: string };
  className?: string;
  isLoading?: boolean; // New prop for loading state
}

const StatsCard = ({
  title,
  value,
  description,
  icon,
  progress,
  progressColor,
  trend,
  className = "",
  isLoading = false // Default to not loading
}: StatsCardProps) => {
  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <Skeleton className="h-5 w-5 mr-2 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
          <Skeleton className="h-2 w-full mb-4" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }
  
  // Format value for display
  const formattedValue = value?.toLocaleString() || '0';
  
  // Determine trend arrow direction and color
  const getTrendDisplay = (trend?: TrendData) => {
    if (!trend) return null;
    
    const { value: trendValue } = trend;
    
    if (trendValue > 0) {
      return (
        <div className="flex items-center text-green-600 text-xs font-medium">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
          </svg>
          <span>{Math.abs(trendValue)}%</span>
        </div>
      );
    } else if (trendValue < 0) {
      // Special handling for streak broken case (value = 0, trend < 0)
      const isBrokenStreak = value === 0 && title === "Learning Streak";
      return (
        <div className="flex items-center text-red-600 text-xs font-medium">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
          <span>{isBrokenStreak ? "Broken" : `${Math.abs(trendValue)}%`}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-500 text-xs font-medium">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14"></path>
          </svg>
          <span>0%</span>
        </div>
      );
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        
        {isLoading ? (
          <Skeleton className="h-8 w-20 mb-1" />
        ) : (
          <div className="text-2xl font-bold mb-1">{formattedValue}</div>
        )}
        
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        
        {trend && !isLoading && (
          <div className="mt-2 flex items-center">
            {getTrendDisplay(trend)}
            <span className="text-xs text-muted-foreground ml-2">
              {trend.label || ''}
            </span>
          </div>
        )}
        
        {typeof progress === 'number' && !isLoading && (
          <div className="mt-2">
            <Progress value={progress} className={cn("h-1", progressColor)} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
