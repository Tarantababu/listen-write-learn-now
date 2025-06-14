
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Brain, X, Quote } from 'lucide-react';
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
  
  // Smart positioning with better offset and boundary detection
  const safePosition = {
    x: Math.max(16, Math.min(position.x, window.innerWidth - (isMobile ? 320 : 380))),
    y: Math.max(80, position.y - (isMobile ? 20 : 30))
  };

  // Smart text truncation with context awareness
  const getDisplayText = (text: string, maxLength: number = isMobile ? 60 : 80) => {
    if (text.length <= maxLength) return text;
    
    // Try to break at word boundaries
    const truncated = text.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > maxLength * 0.7) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }
    
    return truncated + '...';
  };

  // Word count for context
  const wordCount = selectedText.trim().split(/\s+/).length;
  
  return (
    <Card
      className={`absolute z-50 border-2 border-blue-200 bg-white shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200 ${
        isMobile ? 'p-3' : 'p-4'
      }`}
      style={{
        left: safePosition.x,
        top: safePosition.y,
        transform: 'translateX(-50%)',
        maxWidth: isMobile ? '300px' : '360px',
        minWidth: isMobile ? '280px' : '320px',
      }}
      role="dialog"
      aria-label="Text selection actions"
    >
      <div className="space-y-3">
        {/* Enhanced text preview with visual indicator */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
          <div className="flex items-start gap-2">
            <Quote className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className={`text-gray-800 font-medium leading-relaxed ${isMobile ? 'text-sm' : 'text-base'}`}>
                "{getDisplayText(selectedText)}"
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-blue-600 font-medium">
                  {wordCount} {wordCount === 1 ? 'word' : 'words'} selected
                </div>
                {selectedText.length > (isMobile ? 60 : 80) && (
                  <div className="text-xs text-gray-500 italic">
                    +{selectedText.length - (isMobile ? 60 : 80)} more chars
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Action header with improved messaging */}
        <div className="text-center">
          <div className={`text-gray-700 font-semibold ${isMobile ? 'text-sm' : 'text-base'}`}>
            Create Exercise
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Turn your selection into a learning exercise
          </div>
        </div>
        
        {/* Enhanced action buttons with better descriptions */}
        <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
          <Button
            size={isMobile ? 'sm' : 'default'}
            onClick={onCreateDictation}
            className={`flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
              isMobile ? 'w-full justify-start py-3' : 'flex-1'
            }`}
          >
            <Mic className="h-4 w-4" />
            <div className="text-left">
              <div className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>
                Dictation Exercise
              </div>
              {!isMobile && (
                <div className="text-xs opacity-90">
                  Listen & type practice
                </div>
              )}
            </div>
          </Button>
          
          <Button
            size={isMobile ? 'sm' : 'default'}
            onClick={onCreateBidirectional}
            className={`flex items-center gap-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
              isMobile ? 'w-full justify-start py-3' : 'flex-1'
            }`}
          >
            <Brain className="h-4 w-4" />
            <div className="text-left">
              <div className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>
                Translation Exercise
              </div>
              {!isMobile && (
                <div className="text-xs opacity-90">
                  Bidirectional practice
                </div>
              )}
            </div>
          </Button>
        </div>

        {/* Enhanced close button */}
        <div className="flex justify-center pt-2 border-t border-gray-100">
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200 px-4"
            aria-label="Close selection menu"
          >
            <X className="h-4 w-4 mr-2" />
            <span className="text-sm">Close</span>
          </Button>
        </div>

        {/* Helpful tip for new users */}
        {wordCount > 5 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mt-3">
            <div className="text-xs text-amber-700 text-center">
              💡 Tip: Longer selections work great for comprehensive practice!
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
