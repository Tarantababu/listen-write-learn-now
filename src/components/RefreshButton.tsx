
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function RefreshButton({ onRefresh, isLoading = false, className = '' }: RefreshButtonProps) {
  const handleRefresh = async () => {
    try {
      await onRefresh();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className={`p-2 rounded-full ${className}`}
          >
            <RefreshCw 
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} 
              aria-hidden="true" 
            />
            <span className="sr-only">Refresh data</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Refresh data</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
