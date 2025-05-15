
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Loader2 } from 'lucide-react';
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
  variant = 'ghost'
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn("h-8 w-8", className)}
      onClick={(e) => {
        e.preventDefault();
        onRefresh();
      }}
      disabled={isLoading}
      aria-label="Refresh data"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCcw className="h-4 w-4" />
      )}
    </Button>
  );
};
