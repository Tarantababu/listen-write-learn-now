
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface TimePeriodSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const TimePeriodSelector = ({ value, onChange, className = "" }: TimePeriodSelectorProps) => {
  const periods = [
    { value: '1d', label: 'Last 24 hours', badge: '1D' },
    { value: '7d', label: 'Last 7 days', badge: '7D' },
    { value: '30d', label: 'Last 30 days', badge: '30D' },
    { value: '90d', label: 'Last 90 days', badge: '90D' }
  ];

  const currentPeriod = periods.find(p => p.value === value);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-muted-foreground">Time period:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-40">
          <SelectValue>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {currentPeriod?.badge}
              </Badge>
              <span className="text-sm">{currentPeriod?.label}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {periods.map((period) => (
            <SelectItem key={period.value} value={period.value}>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {period.badge}
                </Badge>
                <span>{period.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TimePeriodSelector;
