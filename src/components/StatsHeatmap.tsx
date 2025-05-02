
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
  const sixMonthsAgo = subMonths(today, 6);

  // Function to apply custom modifiers for activity intensity
  const getDayClassNames = (date: Date) => {
    const dayActivity = activityData.find(
      activity => differenceInCalendarDays(activity.date, date) === 0
    );

    if (!dayActivity || dayActivity.count === 0) {
      return '';
    }

    // Determine intensity based on count
    if (dayActivity.count >= 15) {
      return 'bg-green-800 hover:bg-green-700 text-white';
    } else if (dayActivity.count >= 10) {
      return 'bg-green-600 hover:bg-green-500 text-white'; 
    } else if (dayActivity.count >= 5) {
      return 'bg-green-500 hover:bg-green-400 text-white';
    } else {
      return 'bg-green-300 hover:bg-green-200';
    }
  };

  // Filter activity data to only show the last 6 months
  const filteredActivityData = useMemo(() => {
    return activityData.filter(activity => 
      isWithinInterval(activity.date, { start: sixMonthsAgo, end: today })
    );
  }, [activityData, sixMonthsAgo, today]);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Activity Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Calendar 
            mode="range"
            numberOfMonths={6}
            fromMonth={sixMonthsAgo}
            toMonth={today}
            defaultMonth={today}
            classNames={{
              day_today: "border border-primary",
            }}
            modifiers={{
              activity: (date) => 
                filteredActivityData.some(
                  activity => differenceInCalendarDays(activity.date, date) === 0
                )
            }}
            modifiersClassNames={{
              activity: (date) => getDayClassNames(date)
            }}
            ISOWeek
            fixedWeeks
            showOutsideDays
          />
        </div>
        <div className="flex justify-end mt-4 gap-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-green-300"></div>
            <span className="text-xs">1-4</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-green-500"></div>
            <span className="text-xs">5-9</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-green-600"></div>
            <span className="text-xs">10-14</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-green-800"></div>
            <span className="text-xs">15+</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsHeatmap;
