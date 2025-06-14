
import React from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, List } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export type ReadingView = 'sentence' | 'all';

interface ViewToggleProps {
  currentView: ReadingView;
  onViewChange: (view: ReadingView) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  currentView,
  onViewChange
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={`flex gap-1 p-1 bg-muted rounded-lg ${isMobile ? 'w-full' : 'w-fit'}`}>
      <Button
        variant={currentView === 'all' ? 'default' : 'ghost'}
        size={isMobile ? 'sm' : 'sm'}
        onClick={() => onViewChange('all')}
        className={`flex items-center gap-2 ${isMobile ? 'flex-1 justify-center' : ''}`}
      >
        <BookOpen className="h-4 w-4" />
        <span className={isMobile ? 'text-xs' : 'text-sm'}>Full Text</span>
      </Button>
      
      <Button
        variant={currentView === 'sentence' ? 'default' : 'ghost'}
        size={isMobile ? 'sm' : 'sm'}
        onClick={() => onViewChange('sentence')}
        className={`flex items-center gap-2 ${isMobile ? 'flex-1 justify-center' : ''}`}
      >
        <List className="h-4 w-4" />
        <span className={isMobile ? 'text-xs' : 'text-sm'}>By Sentence</span>
      </Button>
    </div>
  );
};
