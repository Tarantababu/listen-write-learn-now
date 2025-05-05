
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, isWithinInterval, isSameDay } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ActivityData {
  date: Date;
  count: number;
  masteredWords?: number;
}

interface StatsHeatmapProps {
  activityData: ActivityData[];
}

const StatsHeatmap: React.FC<StatsHeatmapProps> = ({ activityData }) => {
  const today = new Date();
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);

  // Filter activity data to only show the current month
  const filteredActivityData = useMemo(() => {
    return activityData.filter(activity => 
      isWithinInterval(activity.date, { start: currentMonthStart, end: currentMonthEnd })
    );
  }, [activityData, currentMonthStart, currentMonthEnd]);

  // Create explicit day modifiers for each activity day with its corresponding class
  const activityModifiers = useMemo(() => {
    const modifiers: Record<string, Date[]> = {};
    
    // Group dates by their mastered words count using new ranges
    const intensityLevels = {
      high: [] as Date[],
      medium: [] as Date[],
      low: [] as Date[],
      minimal: [] as Date[]
    };
    
    filteredActivityData.forEach(activity => {
      const masteredCount = activity.masteredWords || 0;
      if (masteredCount > 350) {
        intensityLevels.high.push(activity.date);
      } else if (masteredCount > 150) {
        intensityLevels.medium.push(activity.date);
      } else if (masteredCount > 50) {
        intensityLevels.low.push(activity.date);
      } else if (masteredCount > 0) {
        intensityLevels.minimal.push(activity.date);
      }
    });
    
    // Add each intensity level to modifiers
    if (intensityLevels.high.length > 0) modifiers.activityHigh = intensityLevels.high;
    if (intensityLevels.medium.length > 0) modifiers.activityMedium = intensityLevels.medium;
    if (intensityLevels.low.length > 0) modifiers.activityLow = intensityLevels.low;
    if (intensityLevels.minimal.length > 0) modifiers.activityMinimal = intensityLevels.minimal;
    
    return modifiers;
  }, [filteredActivityData]);

  // Get mastered words count for a specific date
  const getMasteredWordsForDate = (date: Date): number => {
    const activity = filteredActivityData.find(a => isSameDay(a.date, date));
    return activity?.masteredWords || 0;
  };

  // Custom day renderer with tooltip
  const renderDay = (day: Date) => {
    const masteredCount = getMasteredWordsForDate(day);
    const hasActivity = masteredCount > 0;

    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="w-full h-full flex items-center justify-center relative">
              {format(day, 'd')}
              {hasActivity && (
                <span className="absolute top-1 right-1 text-[9px] font-medium">
                  {masteredCount}
                </span>
              )}
            </div>
          </TooltipTrigger>
          {hasActivity && (
            <TooltipContent className="p-2 text-xs bg-background border border-border">
              <p><strong>{format(day, 'MMMM d, yyyy')}</strong></p>
              <p>{masteredCount} mastered word{masteredCount !== 1 ? 's' : ''}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Card className="col-span-full animate-fade-in">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Mastered Words Heatmap - {format(currentMonthStart, 'MMMM yyyy')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Calendar 
            mode="default"
            numberOfMonths={1}
            defaultMonth={today}
            classNames={{
              day_today: "border border-primary",
            }}
            modifiers={activityModifiers}
            modifiersClassNames={{
              activityHigh: "bg-green-800 hover:bg-green-700 text-white",
              activityMedium: "bg-green-600 hover:bg-green-500 text-white",
              activityLow: "bg-green-500 hover:bg-green-400 text-white",
              activityMinimal: "bg-green-300 hover:bg-green-200"
            }}
            components={{
              Day: ({ date }) => renderDay(date)
            }}
            ISOWeek
            fixedWeeks
            showOutsideDays
          />
        </div>
        <div className="flex justify-end mt-4 gap-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-green-300"></div>
            <span className="text-xs">1-50</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-green-500"></div>
            <span className="text-xs">51-150</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-green-600"></div>
            <span className="text-xs">151-350</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-green-800"></div>
            <span className="text-xs">350+</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsHeatmap;
