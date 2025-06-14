
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

/**
 * Legacy SelectionActions component - now replaced by SelectionPopup
 * Keeping for backward compatibility
 */
export const SelectionActions: React.FC<SelectionActionsProps> = ({
  position,
  selectedText,
  onCreateDictation,
  onCreateBidirectional,
  onClose
}) => {
  const isMobile = useIsMobile();
  
  // Smart positioning with better offset and boundary detection
  const safePosition = {
    x: Math.max(16, Math.min(position.x, window.innerWidth - (isMobile ? 280 : 320))),
    y: Math.max(80, position.y - (isMobile ? 20 : 30))
  };

  // Smart text truncation
  const getDisplayText = (text: string, maxLength: number = isMobile ? 40 : 60) => {
    if (text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > maxLength * 0.7) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }
    
    return truncated + '...';
  };
  
  return (
    <Card
      className={`absolute z-50 bg-white shadow-lg border border-gray-200 rounded-lg animate-in fade-in zoom-in-95 duration-200 ${
        isMobile ? 'p-3' : 'p-4'
      }`}
      style={{
        left: safePosition.x,
        top: safePosition.y,
        transform: 'translateX(-50%)',
        maxWidth: isMobile ? '260px' : '300px',
        minWidth: isMobile ? '240px' : '280px',
      }}
      role="dialog"
      aria-label="Text selection actions"
    >
      <div className="space-y-3">
        {/* Minimalistic text preview */}
        <div className="bg-gray-50 rounded-md p-2 border">
          <div className={`text-gray-700 font-medium leading-relaxed ${isMobile ? 'text-sm' : 'text-base'}`}>
            "{getDisplayText(selectedText)}"
          </div>
        </div>
        
        {/* Clean action buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onCreateDictation}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
          >
            <Mic className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Dictation</span>
          </Button>
          
          <Button
            size="sm"
            onClick={onCreateBidirectional}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white transition-colors duration-200"
          >
            <Brain className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Translation</span>
          </Button>
        </div>

        {/* Minimalistic close button */}
        <div className="flex justify-center pt-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200 px-3 py-1"
            aria-label="Close selection menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
