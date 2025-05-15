
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RefreshButtonProps {
  onRefresh: () => void;
  isLoading?: boolean;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  isLoading = false,
  className,
  size = 'icon',
  variant = 'ghost',
}) => {
  return (
    <Button
      onClick={onRefresh}
      disabled={isLoading}
      className={cn("flex items-center", className)}
      size={size}
      variant={variant}
      aria-label="Refresh data"
    >
      <RefreshCw 
        className={cn(
          "h-4 w-4", 
          isLoading && "animate-spin"
        )} 
      />
    </Button>
  );
};
