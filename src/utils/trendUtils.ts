
import { subDays, isAfter, format } from 'date-fns';

export interface TrendData {
  value: number;
  label: string;
}

// Calculate trend compared to the previous period (week, month)
export function calculateTrend(
  currentValue: number,
  previousPeriodValue: number
): TrendData {
  if (previousPeriodValue === 0) {
    return {
      value: currentValue > 0 ? 100 : 0,
      label: 'Since last week'
    };
  }
  
  const change = ((currentValue - previousPeriodValue) / previousPeriodValue) * 100;
  return {
    value: Math.round(change),
    label: `${change >= 0 ? 'Increase' : 'Decrease'} from previous period`
  };
}

// Group activity data by days
export function groupByDay(data: Array<{ date: Date, count: number }>) {
  const grouped: Record<string, number> = {};
  
  data.forEach(item => {
    const dateKey = format(item.date, 'yyyy-MM-dd');
    grouped[dateKey] = (grouped[dateKey] || 0) + item.count;
  });
  
  return grouped;
}

// Calculate value for current week vs previous week
export function compareWeeks(data: Record<string, number>) {
  const today = new Date();
  const oneWeekAgo = subDays(today, 7);
  const twoWeeksAgo = subDays(today, 14);
  
  let currentWeekTotal = 0;
  let previousWeekTotal = 0;
  
  Object.entries(data).forEach(([dateStr, value]) => {
    const date = new Date(dateStr);
    
    if (isAfter(date, oneWeekAgo)) {
      currentWeekTotal += value;
    } else if (isAfter(date, twoWeeksAgo)) {
      previousWeekTotal += value;
    }
  });
  
  return calculateTrend(currentWeekTotal, previousWeekTotal);
}
