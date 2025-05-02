
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp, Activity } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
  progress?: number;
  progressColor?: string;
  trend?: {
    value: number;
    label: string;
  };
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  description,
  className,
  progress,
  progressColor = "bg-primary",
  trend,
}) => {
  const renderTrend = () => {
    if (!trend) return null;
    
    const isPositive = trend.value >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const displayValue = Math.abs(trend.value);
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isPositive ? "text-green-600" : "text-red-500"
            )}>
              <Icon className={cn(
                "h-3 w-3 transition-transform",
                isPositive && "animate-bounce-once"
              )} />
              <span>{isPositive ? "+" : "-"}{displayValue}%</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{trend.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Card className={cn("overflow-hidden hover:shadow-md transition-all duration-300 animate-fade-in", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{value}</div>
          {renderTrend()}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {typeof progress === 'number' && (
          <div className="mt-3">
            <Progress 
              value={progress} 
              className="h-1.5" 
              indicatorClassName={progressColor} 
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
