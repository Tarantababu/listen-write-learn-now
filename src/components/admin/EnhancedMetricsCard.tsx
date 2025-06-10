
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendData {
  value: number;
  percentage: number;
  isPositive: boolean;
}

interface EnhancedMetricsCardProps {
  title: string;
  value: number | string;
  description: string;
  icon?: React.ReactNode;
  trend?: TrendData;
  className?: string;
  isLoading?: boolean;
  formatValue?: (value: number | string) => string;
  color?: 'default' | 'success' | 'warning' | 'danger';
}

const EnhancedMetricsCard = ({
  title,
  value,
  description,
  icon,
  trend,
  className = "",
  isLoading = false,
  formatValue,
  color = 'default'
}: EnhancedMetricsCardProps) => {
  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-3 w-32 mb-2" />
          <Skeleton className="h-3 w-24" />
        </CardContent>
      </Card>
    );
  }
  
  const formattedValue = formatValue ? formatValue(value) : 
    typeof value === 'number' ? value.toLocaleString() : value;

  const colorVariants = {
    default: 'border-border',
    success: 'border-green-200 bg-green-50/50',
    warning: 'border-yellow-200 bg-yellow-50/50',
    danger: 'border-red-200 bg-red-50/50'
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend.percentage === 0) {
      return <Minus className="h-3 w-3" />;
    }
    
    return trend.isPositive ? 
      <TrendingUp className="h-3 w-3" /> : 
      <TrendingDown className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return 'text-muted-foreground';
    if (trend.percentage === 0) return 'text-muted-foreground';
    return trend.isPositive ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md", colorVariants[color], className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-bold mb-1">{formattedValue}</div>
        
        <p className="text-xs text-muted-foreground mb-2">{description}</p>
        
        {trend && (
          <div className="flex items-center gap-1">
            <Badge 
              variant="outline" 
              className={cn(
                "flex items-center gap-1 text-xs px-2 py-0.5",
                getTrendColor()
              )}
            >
              {getTrendIcon()}
              {Math.abs(trend.percentage).toFixed(1)}%
            </Badge>
            <span className="text-xs text-muted-foreground">
              vs previous period
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedMetricsCard;
