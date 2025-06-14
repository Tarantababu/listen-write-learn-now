
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
    <div className={`inline-flex rounded-xl border border-gray-200 bg-white shadow-sm ${isMobile ? 'w-full' : 'w-fit'}`}>
      <Button
        variant={currentView === 'all' ? 'default' : 'ghost'}
        size={isMobile ? 'sm' : 'sm'}
        onClick={() => onViewChange('all')}
        className={`${
          currentView === 'all' 
            ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        } ${isMobile ? 'flex-1 rounded-l-xl rounded-r-none border-r' : 'rounded-l-xl rounded-r-none border-r'} border-gray-200 transition-all duration-200`}
      >
        <BookOpen className="h-4 w-4" />
        <span className={`ml-2 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Full Text</span>
      </Button>
      
      <Button
        variant={currentView === 'sentence' ? 'default' : 'ghost'}
        size={isMobile ? 'sm' : 'sm'}
        onClick={() => onViewChange('sentence')}
        className={`${
          currentView === 'sentence' 
            ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        } ${isMobile ? 'flex-1 rounded-r-xl rounded-l-none' : 'rounded-r-xl rounded-l-none'} transition-all duration-200`}
      >
        <List className="h-4 w-4" />
        <span className={`ml-2 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>By Sentence</span>
      </Button>
    </div>
  );
};
