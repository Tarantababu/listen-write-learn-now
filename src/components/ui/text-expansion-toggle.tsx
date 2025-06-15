
import React from 'react';
import { Button } from '@/components/ui/button';
import { Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextExpansionToggleProps {
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export const TextExpansionToggle: React.FC<TextExpansionToggleProps> = ({
  isExpanded,
  onToggle,
  className,
  size = 'sm'
}) => {
  return (
    <Button
      variant="outline"
      size={size}
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 transition-all duration-200 hover:scale-105",
        className
      )}
      title={isExpanded ? "Minimize text" : "Enlarge text"}
      aria-label={isExpanded ? "Minimize text display" : "Enlarge text display"}
    >
      {isExpanded ? (
        <>
          <Minimize className="h-4 w-4" />
          <span className="hidden sm:inline">Minimize</span>
        </>
      ) : (
        <>
          <Maximize className="h-4 w-4" />
          <span className="hidden sm:inline">Enlarge</span>
        </>
      )}
    </Button>
  );
};
