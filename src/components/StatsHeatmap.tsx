
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, isWithinInterval, isSameDay } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarDays } from 'lucide-react';

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
                <span className="absolute top-0.5 right-0.5 text-[8px] font-medium rounded-full bg-background/80 px-1">
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

  // Calculate total unique mastered words for the current month
  // Fix: Count each mastered word only once across all dates
  const totalMasteredWordsThisMonth = useMemo(() => {
    // Instead of summing the counts directly, we'll track unique words
    // Since we don't have access to the actual word list, we'll estimate
    // by taking the maximum count across all dates in the month
    
    // This is a simplified approach since we don't have the actual word identifiers
    // If we had the word IDs, we could use a Set to deduplicate them
    
    // Find the maximum count from any day - assuming this represents the total unique words
    // This works if the same set of words is being tracked across multiple days
    const maxCount = filteredActivityData.reduce((max, activity) => {
      return Math.max(max, activity.masteredWords || 0);
    }, 0);
    
    return maxCount;
  }, [filteredActivityData]);

  return (
    <Card className="col-span-full animate-fade-in shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-base font-medium">Activity Calendar</CardTitle>
          </div>
          <span className="text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-full font-medium">
            {totalMasteredWordsThisMonth} words this month
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border border-border p-1 bg-slate-50 dark:bg-slate-900/30">
          <Calendar 
            mode="default"
            numberOfMonths={1}
            defaultMonth={today}
            classNames={{
              day_today: "border-2 border-purple-500 dark:border-purple-400",
              day_selected: "",
              day_disabled: "",
              day_range_start: "",
              day_range_middle: "",
              day_range_end: "",
              day_hidden: "invisible",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 transition-colors duration-200 rounded-md",
              caption: "flex justify-center pt-2 pb-4 relative items-center",
              caption_label: "text-sm font-medium",
            }}
            modifiers={activityModifiers}
            modifiersClassNames={{
              activityHigh: "bg-green-700 hover:bg-green-600 text-white shadow-md",
              activityMedium: "bg-green-500 hover:bg-green-400 text-white shadow-md",
              activityLow: "bg-green-400 hover:bg-green-300 text-white shadow-sm",
              activityMinimal: "bg-green-200 hover:bg-green-100 text-green-800"
            }}
            components={{
              Day: ({ date }) => renderDay(date)
            }}
            ISOWeek
            fixedWeeks
            showOutsideDays
          />
        </div>
        <div className="flex justify-end mt-4 gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-green-200 shadow-sm"></div>
            <span className="text-xs text-muted-foreground">1-50</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-green-400 shadow-sm"></div>
            <span className="text-xs text-muted-foreground">51-150</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-green-500 shadow-sm"></div>
            <span className="text-xs text-muted-foreground">151-350</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-green-700 shadow-sm"></div>
            <span className="text-xs text-muted-foreground">350+</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsHeatmap;
