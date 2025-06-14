
import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Brain, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SelectionPopupProps {
  position: { x: number; y: number };
  selectedText: string;
  onCreateDictation: () => void;
  onCreateBidirectional: () => void;
  onClose: () => void;
  isVisible: boolean;
}

export const SelectionPopup: React.FC<SelectionPopupProps> = ({
  position,
  selectedText,
  onCreateDictation,
  onCreateBidirectional,
  onClose,
  isVisible
}) => {
  const isMobile = useIsMobile();

  if (!isVisible) return null;

  // Enhanced positioning with viewport boundary detection
  const getOptimalPosition = () => {
    const popupWidth = isMobile ? 280 : 320;
    const popupHeight = isMobile ? 160 : 180;
    const margin = 16;
    
    let x = position.x;
    let y = position.y;
    
    // Horizontal boundary check
    if (x + popupWidth > window.innerWidth - margin) {
      x = window.innerWidth - popupWidth - margin;
    }
    if (x < margin) {
      x = margin;
    }
    
    // Vertical boundary check - prefer above selection
    if (y - popupHeight < margin) {
      y = position.y + 60; // Show below selection
    } else {
      y = position.y - popupHeight - 20; // Show above selection
    }
    
    return { x, y };
  };

  const safePosition = getOptimalPosition();

  // Smart text truncation with word boundary awareness
  const getDisplayText = (text: string, maxLength: number = isMobile ? 35 : 50) => {
    if (text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > maxLength * 0.6) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }
    
    return truncated + '...';
  };

  const popup = (
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{
        left: 0,
        top: 0,
        width: '100vw',
        height: '100vh',
      }}
    >
      <Card
        className={`absolute pointer-events-auto bg-white shadow-xl border border-gray-200 rounded-xl animate-in fade-in zoom-in-95 duration-300 ${
          isMobile ? 'p-3' : 'p-4'
        }`}
        style={{
          left: safePosition.x,
          top: safePosition.y,
          maxWidth: isMobile ? '280px' : '320px',
          minWidth: isMobile ? '240px' : '280px',
          transform: isMobile ? 'translateX(-50%)' : 'none',
        }}
        role="dialog"
        aria-label="Text selection actions"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          {/* Enhanced text preview with better typography */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
            <div className={`text-gray-800 font-medium leading-relaxed ${isMobile ? 'text-sm' : 'text-base'}`}>
              <span className="text-gray-500 text-xs font-normal">"</span>
              {getDisplayText(selectedText)}
              <span className="text-gray-500 text-xs font-normal">"</span>
            </div>
          </div>
          
          {/* Enhanced action buttons with better visual hierarchy */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onCreateDictation}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02]"
            >
              <Mic className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Dictation</span>
            </Button>
            
            <Button
              size="sm"
              onClick={onCreateBidirectional}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02]"
            >
              <Brain className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Translation</span>
            </Button>
          </div>

          {/* Enhanced close button with better accessibility */}
          <div className="flex justify-center pt-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 px-3 py-1 rounded-full"
              aria-label="Close selection menu"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  // Portal to render outside the modal
  return createPortal(popup, document.body);
};
