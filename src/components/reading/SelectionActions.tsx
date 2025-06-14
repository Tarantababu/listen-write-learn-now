
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
  
  // Calculate safe positioning with better offset
  const safePosition = {
    x: Math.max(16, Math.min(position.x, window.innerWidth - (isMobile ? 300 : 340))),
    y: Math.max(16, position.y - 10)
  };

  return (
    <Card
      className={`absolute z-50 border border-gray-200 bg-white shadow-xl rounded-xl animate-in fade-in zoom-in-95 duration-300 ${
        isMobile ? 'p-3' : 'p-4'
      }`}
      style={{
        left: safePosition.x,
        top: safePosition.y,
        transform: 'translateX(-50%)',
        maxWidth: isMobile ? '280px' : '320px',
      }}
    >
      <div className="space-y-3">
        {/* Selected text preview with better styling */}
        <div className="border-b border-gray-100 pb-2">
          <div className={`text-gray-700 font-medium ${isMobile ? 'text-sm' : 'text-base'} line-clamp-2`}>
            "{selectedText}"
          </div>
          <div className="text-xs text-gray-500 mt-1">Create exercise from selection</div>
        </div>
        
        {/* Action buttons with improved design */}
        <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
          <Button
            size={isMobile ? 'sm' : 'sm'}
            onClick={onCreateDictation}
            className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 ${
              isMobile ? 'w-full justify-start py-2.5' : 'flex-1'
            }`}
          >
            <Mic className="h-4 w-4" />
            <span className={isMobile ? 'text-sm font-medium' : 'text-sm font-medium'}>Dictation Exercise</span>
          </Button>
          
          <Button
            size={isMobile ? 'sm' : 'sm'}
            onClick={onCreateBidirectional}
            className={`flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white transition-colors duration-200 ${
              isMobile ? 'w-full justify-start py-2.5' : 'flex-1'
            }`}
          >
            <Brain className="h-4 w-4" />
            <span className={isMobile ? 'text-sm font-medium' : 'text-sm font-medium'}>Translation Exercise</span>
          </Button>
          
          <Button
            size={isMobile ? 'sm' : 'sm'}
            variant="ghost"
            onClick={onClose}
            className={`text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors duration-200 ${
              isMobile ? 'w-full py-2.5' : 'px-3'
            }`}
          >
            <X className="h-4 w-4" />
            {isMobile && <span className="ml-2 text-sm">Close</span>}
          </Button>
        </div>
      </div>
    </Card>
  );
};
