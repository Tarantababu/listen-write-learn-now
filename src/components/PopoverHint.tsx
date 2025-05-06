
import React from 'react';
import { HelpCircle } from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface PopoverHintProps {
  children: React.ReactNode;
  className?: string;
  triggerClassName?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

const PopoverHint: React.FC<PopoverHintProps> = ({
  children,
  className,
  triggerClassName,
  side = "bottom",
  align = "center"
}) => {
  return (
    <Popover>
      <PopoverTrigger className={cn("text-muted-foreground hover:text-foreground", triggerClassName)}>
        <HelpCircle className="h-5 w-5" />
      </PopoverTrigger>
      <PopoverContent 
        side={side} 
        align={align}
        className={cn("text-sm p-4 max-w-xs", className)}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
};

export default PopoverHint;
