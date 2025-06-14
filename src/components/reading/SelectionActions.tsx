
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Brain, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SelectionActionsProps {
  position: { x: number; y: number };
  selectedText: string;
  onCreateDictation: () => void;
  onCreateBidirectional: () => void;
  onClose: () => void;
}

export const SelectionActions: React.FC<SelectionActionsProps> = ({
  position,
  selectedText,
  onCreateDictation,
  onCreateBidirectional,
  onClose
}) => {
  const isMobile = useIsMobile();
  
  // Calculate safe positioning
  const safePosition = {
    x: Math.max(10, Math.min(position.x, window.innerWidth - (isMobile ? 280 : 320))),
    y: Math.max(10, position.y)
  };

  return (
    <Card
      className={`absolute z-50 shadow-lg border-2 animate-in fade-in zoom-in-95 duration-200 ${
        isMobile ? 'p-2' : 'p-3'
      }`}
      style={{
        left: safePosition.x,
        top: safePosition.y,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="space-y-2">
        {/* Selected text preview */}
        <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground max-w-64 truncate`}>
          "{selectedText}"
        </div>
        
        {/* Action buttons */}
        <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
          <Button
            size={isMobile ? 'sm' : 'sm'}
            variant="outline"
            onClick={onCreateDictation}
            className={`flex items-center gap-2 ${isMobile ? 'w-full justify-start' : ''}`}
          >
            <Mic className="h-3 w-3" />
            <span className={isMobile ? 'text-xs' : 'text-sm'}>Dictation</span>
          </Button>
          
          <Button
            size={isMobile ? 'sm' : 'sm'}
            variant="outline"
            onClick={onCreateBidirectional}
            className={`flex items-center gap-2 ${isMobile ? 'w-full justify-start' : ''}`}
          >
            <Brain className="h-3 w-3" />
            <span className={isMobile ? 'text-xs' : 'text-sm'}>Bidirectional</span>
          </Button>
          
          <Button
            size={isMobile ? 'sm' : 'sm'}
            variant="ghost"
            onClick={onClose}
            className={`${isMobile ? 'w-full' : 'px-2'}`}
          >
            <X className="h-3 w-3" />
            {isMobile && <span className="ml-2 text-xs">Close</span>}
          </Button>
        </div>
      </div>
    </Card>
  );
};
