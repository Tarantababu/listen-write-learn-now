import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, isSameDay, addMonths } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarDays, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import SkeletonStatsHeatmap from './SkeletonStatsHeatmap';
import { useDelayedLoading } from '@/hooks/use-delayed-loading';

interface ActivityData {
  date: Date;
  count: number;
  masteredWords?: number;
}

interface StatsHeatmapProps {
  activityData: ActivityData[];
  isLoading?: boolean;
}

const StatsHeatmap: React.FC<StatsHeatmapProps> = ({
  activityData,
  isLoading = false
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState('month');
  const navigate = useNavigate();
  const {
    exercises
  } = useExerciseContext();
  const {
    settings
  } = useUserSettingsContext();
  const isMobile = useIsMobile();
  
  // Use debounced loading state to prevent flashing
  const showLoading = useDelayedLoading(isLoading, 400);
  
  // If we're in loading state and it's been long enough, show skeleton
  if (showLoading) {
    return <SkeletonStatsHeatmap />;
  }

  // Filter exercises with partial progress
  const inProgressExercises = useMemo(() => {
    return exercises.filter(ex => ex.language === settings.selectedLanguage && ex.completionCount > 0 && !ex.isCompleted).sort((a, b) => b.completionCount - a.completionCount) // Sort by progress (highest first)
    .slice(0, 5); // Limit to 5 exercises
  }, [exercises, settings.selectedLanguage]);

  // Get start and end dates based on the time range
  const {
    startDate,
    endDate
  } = useMemo(() => {
    if (timeRange === 'month') {
      return {
        startDate: startOfMonth(currentDate),
        endDate: endOfMonth(currentDate)
      };
    } else if (timeRange === '3months') {
      return {
        startDate: startOfMonth(subMonths(currentDate, 2)),
        endDate: endOfMonth(currentDate)
      };
    } else {
      // year
      return {
        startDate: startOfMonth(subMonths(currentDate, 11)),
        endDate: endOfMonth(currentDate)
      };
    }
  }, [currentDate, timeRange]);

  // Filter activity data to show only the current time range
  const filteredActivityData = useMemo(() => {
    return activityData.filter(activity => isWithinInterval(activity.date, {
      start: startDate,
      end: endDate
    }));
  }, [activityData, startDate, endDate]);

  // Navigate to next/previous period
  const handlePrevious = () => {
    if (timeRange === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (timeRange === '3months') {
      setCurrentDate(subMonths(currentDate, 3));
    } else {
      // year
      setCurrentDate(subMonths(currentDate, 12));
    }
  };
  const handleNext = () => {
    const nextDate = timeRange === 'month' ? addMonths(currentDate, 1) : timeRange === '3months' ? addMonths(currentDate, 3) : addMonths(currentDate, 12);

    // Don't allow navigating to the future
    if (nextDate <= new Date()) {
      setCurrentDate(nextDate);
    }
  };

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
      } else if (masteredCount > 0 || activity.count > 0) {
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
  const getActivityForDate = (date: Date) => {
    return filteredActivityData.find(a => isSameDay(a.date, date));
  };

  // Custom day renderer with tooltip - Updated for better visibility in light mode
  const renderDay = (day: Date) => {
    const activity = getActivityForDate(day);
    const masteredCount = activity?.masteredWords || 0;
    const exercisesCount = activity?.count || 0;
    const hasActivity = masteredCount > 0 || exercisesCount > 0;

    // Determine the appropriate styles based on mastered count
    let textColorClass = "text-foreground";
    let badgeClass = "absolute top-0.5 right-0.5 text-xs font-medium rounded-full"; // Increased text size to text-xs

    if (hasActivity) {
      if (masteredCount > 350) {
        textColorClass = "text-white";
        badgeClass += " text-white font-bold px-1";
      } else if (masteredCount > 150) {
        textColorClass = "text-white";
        badgeClass += " text-white font-bold px-1";
      } else if (masteredCount > 50) {
        textColorClass = "text-white";
        badgeClass += " text-white font-bold px-1";
      } else {
        // Improved visibility for low count in light mode
        textColorClass = "text-green-800 dark:text-green-100";
        badgeClass += " text-green-800 dark:text-green-100 font-semibold bg-white/70 dark:bg-transparent px-1.5 py-0.5 shadow-sm";
      }
    }
    return <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="w-full h-full flex items-center justify-center relative">
              <span className={textColorClass}>{format(day, 'd')}</span>
              {hasActivity && <span className={badgeClass}>
                  {masteredCount}
                </span>}
            </div>
          </TooltipTrigger>
          {hasActivity && <TooltipContent className="p-2 text-xs bg-background border border-border">
              <p><strong>{format(day, 'MMMM d, yyyy')}</strong></p>
              <p>{masteredCount} mastered word{masteredCount !== 1 ? 's' : ''}</p>
              {exercisesCount > 0 && <p>{exercisesCount} exercise{exercisesCount !== 1 ? 's' : ''} completed</p>}
            </TooltipContent>}
        </Tooltip>
      </TooltipProvider>;
  };

  // Calculate total unique mastered words for the current time range
  const totalMasteredWordsInRange = useMemo(() => {
    // Find the maximum count from any day - assuming this represents the total unique words
    const maxCount = filteredActivityData.reduce((max, activity) => {
      return Math.max(max, activity.masteredWords || 0);
    }, 0);
    return maxCount;
  }, [filteredActivityData]);

  // Get the date range description
  const dateRangeDescription = useMemo(() => {
    if (timeRange === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else if (timeRange === '3months') {
      return `${format(startDate, 'MMM')} - ${format(endDate, 'MMM yyyy')}`;
    } else {
      // year
      return `${format(startDate, 'MMM yyyy')} - ${format(endDate, 'MMM yyyy')}`;
    }
  }, [currentDate, startDate, endDate, timeRange]);

  // Handle click on exercise to navigate to practice
  const handleExerciseClick = (exerciseId: string) => {
    navigate(`/dashboard/exercises`);
  };

  return (
    <Card className="col-span-full animate-fade-in shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-base font-medium">Activity Calendar</CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="3months">3 Months</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Calendar and legend */}
          <div className="space-y-4 w-full">
            <div className="flex items-center justify-between mb-2">
              <Button variant="ghost" size="sm" onClick={handlePrevious} className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm font-medium">
                {dateRangeDescription}
              </span>
              
              <Button variant="ghost" size="sm" onClick={handleNext} className="h-8 w-8 p-0" disabled={addMonths(currentDate, 1) > new Date()}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="overflow-x-auto rounded-md border border-border p-1 bg-slate-50 dark:bg-slate-900/30 w-full">
              <Calendar mode="default" numberOfMonths={timeRange === 'month' ? 1 : timeRange === '3months' ? 3 : 12} month={startDate} showOutsideDays={false} className="w-full max-w-none" classNames={{
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
              months: "w-full flex-grow",
              month: "w-full space-y-4",
              table: "w-full border-collapse space-y-1",
              row: "flex w-full justify-between mt-2",
              head_row: "flex w-full justify-between",
              cell: "text-center p-0 relative flex-1"
            }} modifiers={activityModifiers} modifiersClassNames={{
              activityHigh: "bg-green-700 hover:bg-green-600 text-white shadow-md",
              activityMedium: "bg-green-500 hover:bg-green-400 text-white shadow-md",
              activityLow: "bg-green-400 hover:bg-green-300 text-white shadow-sm",
              activityMinimal: "bg-green-200 hover:bg-green-100 hover:shadow-sm text-green-800"
            }} components={{
              Day: ({
                date
              }) => renderDay(date)
            }} ISOWeek fixedWeeks />
            </div>
            <div className="flex justify-end gap-3">
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
          </div>
          
          {/* Right column: In-progress exercises */}
          <div className={`${isMobile ? "mt-4" : ""}`}>
            {inProgressExercises.length > 0 && <div className={`h-full flex flex-col ${isMobile ? "border-t pt-4 lg:border-t-0 lg:pt-0" : ""}`}>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-5 w-5 text-purple-500" />
                  <h3 className="font-medium text-sm">Continue Your Progress</h3>
                </div>
                <div className="space-y-2 flex-grow">
                  {inProgressExercises.map(exercise => <div key={exercise.id} className="flex items-center justify-between rounded-md border p-3 bg-background hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleExerciseClick(exercise.id)}>
                      <div>
                        <h4 className="font-medium text-sm">{exercise.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{
                        width: `${Math.min(exercise.completionCount / 3 * 100, 100)}%`
                      }}></div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(exercise.completionCount / 3 * 100)}% complete
                          </span>
                        </div>
                      </div>
                      
                    </div>)}
                </div>
                <div className="mt-auto pt-3">
                  <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/exercises')} className="text-xs text-purple-500 hover:text-purple-700 w-full">
                    View all exercises
                  </Button>
                </div>
              </div>}
            
            {inProgressExercises.length === 0 && <div className="h-full flex flex-col items-center justify-center border rounded-md p-6 bg-muted/20">
                <BookOpen className="h-12 w-12 text-muted mb-4" />
                <h3 className="text-lg font-medium text-center mb-2">No exercises in progress</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Start practicing exercises to track your progress
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/exercises')}>
                  Browse Exercises
                </Button>
              </div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsHeatmap;
