
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, FileText } from 'lucide-react';

export type ReadingView = 'sentence' | 'alltext';

interface ViewToggleProps {
  currentView: ReadingView;
  onViewChange: (view: ReadingView) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  currentView,
  onViewChange
}) => {
  return (
    <Card className="mb-4">
      <CardContent className="p-3">
        <div className="flex items-center justify-center gap-2">
          <Button
            variant={currentView === 'sentence' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewChange('sentence')}
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Sentence by Sentence
          </Button>
          
          <Button
            variant={currentView === 'alltext' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewChange('alltext')}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Full Text
          </Button>
        </div>
        
        <div className="text-xs text-center text-muted-foreground mt-2">
          {currentView === 'sentence' 
            ? 'Navigate through sentences one by one with detailed analysis'
            : 'Read the complete text with interactive vocabulary and full audio'
          }
        </div>
      </CardContent>
    </Card>
  );
};
