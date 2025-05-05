
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { format, subMonths, isWithinInterval, differenceInCalendarDays } from 'date-fns';

interface ActivityData {
  date: Date;
  count: number;
}

interface StatsHeatmapProps {
  activityData: ActivityData[];
}

const StatsHeatmap: React.FC<StatsHeatmapProps> = ({ activityData }) => {
  const today = new Date();
  const threeMonthsAgo = subMonths(today, 3);

  // Filter activity data to only show the last 3 months
  const filteredActivityData = useMemo(() => {
    return activityData.filter(activity => 
      isWithinInterval(activity.date, { start: threeMonthsAgo, end: today })
    );
  }, [activityData, threeMonthsAgo, today]);

  // Create explicit day modifiers for each activity day with its corresponding class
  const activityModifiers = useMemo(() => {
    const modifiers: Record<string, Date[]> = {};
    
    // Group dates by their intensity level using the new ranges
    const intensityLevels = {
      high: [] as Date[],
      medium: [] as Date[],
      low: [] as Date[],
      minimal: [] as Date[]
    };
    
    filteredActivityData.forEach(activity => {
      if (activity.count > 350) {
        intensityLevels.high.push(activity.date);
      } else if (activity.count > 150) {
        intensityLevels.medium.push(activity.date);
      } else if (activity.count > 50) {
        intensityLevels.low.push(activity.date);
      } else {
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

  return (
    <Card className="col-span-full animate-fade-in">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Activity Heatmap - Last 3 Months
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Calendar 
            mode="range"
            numberOfMonths={3}
            fromMonth={threeMonthsAgo}
            toMonth={today}
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
