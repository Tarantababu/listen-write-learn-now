
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Languages } from 'lucide-react';
import { ReadingViewToggle } from '@/components/ui/reading-view-toggle';
import { ReadingViewMode } from '@/hooks/use-full-screen-reading';
import { cn } from '@/lib/utils';

interface FullScreenReadingOverlayProps {
  children: React.ReactNode;
  title: string;
  language: string;
  difficulty: string;
  viewMode: ReadingViewMode;
  onToggleView: () => void;
  onClose: () => void;
  onAnalyze?: () => void;
  className?: string;
}

export const FullScreenReadingOverlay: React.FC<FullScreenReadingOverlayProps> = ({
  children,
  title,
  language,
  difficulty,
  viewMode,
  onToggleView,
  onClose,
  onAnalyze,
  className
}) => {
  if (viewMode !== 'fullscreen') {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {language}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {difficulty}
            </Badge>
          </div>
          <h1 className="font-semibold text-lg line-clamp-1 max-w-md">
            {title}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {onAnalyze && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAnalyze}
              className="flex items-center gap-2"
            >
              <Languages className="h-4 w-4" />
              Analyze
            </Button>
          )}
          
          <ReadingViewToggle
            viewMode={viewMode}
            onToggle={onToggleView}
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
            title="Close (ESC)"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className={cn(
          "container mx-auto py-8 px-6 max-w-4xl",
          className
        )}>
          {children}
        </div>
      </div>
    </div>
  );
};
