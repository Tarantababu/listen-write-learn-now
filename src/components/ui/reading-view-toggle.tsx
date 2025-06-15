
import React from 'react';
import { Button } from '@/components/ui/button';
import { Maximize, Maximize2, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReadingViewMode } from '@/hooks/use-full-screen-reading';

interface ReadingViewToggleProps {
  viewMode: ReadingViewMode;
  onToggle: () => void;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

const getIconAndLabel = (mode: ReadingViewMode) => {
  switch (mode) {
    case 'normal':
      return {
        icon: <Maximize className="h-4 w-4" />,
        label: 'Expand',
        title: 'Expand text (larger modal)'
      };
    case 'expanded':
      return {
        icon: <Maximize2 className="h-4 w-4" />,
        label: 'Full Screen',
        title: 'Enter full-screen reading mode'
      };
    case 'fullscreen':
      return {
        icon: <Minimize className="h-4 w-4" />,
        label: 'Exit Full Screen',
        title: 'Exit full-screen mode (ESC)'
      };
    default:
      return {
        icon: <Maximize className="h-4 w-4" />,
        label: 'Expand',
        title: 'Expand text'
      };
  }
};

export const ReadingViewToggle: React.FC<ReadingViewToggleProps> = ({
  viewMode,
  onToggle,
  className,
  size = 'sm'
}) => {
  const { icon, label, title } = getIconAndLabel(viewMode);

  return (
    <Button
      variant="outline"
      size={size}
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 transition-all duration-200 hover:scale-105",
        viewMode === 'fullscreen' && "bg-primary text-primary-foreground hover:bg-primary/90",
        className
      )}
      title={title}
      aria-label={title}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
};
