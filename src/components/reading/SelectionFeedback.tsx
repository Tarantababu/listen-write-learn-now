
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface SelectionFeedbackProps {
  selectedText: string;
  wordCount: number;
  isValidSelection: boolean;
  position?: { x: number; y: number };
  visible: boolean;
}

export const SelectionFeedback: React.FC<SelectionFeedbackProps> = ({
  selectedText,
  wordCount,
  isValidSelection,
  position,
  visible
}) => {
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (visible && selectedText) {
      setShowFeedback(true);
      const timer = setTimeout(() => {
        setShowFeedback(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowFeedback(false);
    }
  }, [visible, selectedText]);

  if (!showFeedback || !selectedText) return null;

  const getSelectionQuality = () => {
    if (wordCount === 1) return { type: 'word', color: 'bg-blue-100 text-blue-800' };
    if (wordCount <= 5) return { type: 'phrase', color: 'bg-green-100 text-green-800' };
    if (wordCount <= 15) return { type: 'sentence', color: 'bg-purple-100 text-purple-800' };
    return { type: 'paragraph', color: 'bg-orange-100 text-orange-800' };
  };

  const quality = getSelectionQuality();

  return (
    <div
      className="fixed z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300"
      style={{
        left: position?.x || '50%',
        top: (position?.y || 100) - 60,
        transform: position ? 'translateX(-50%)' : 'translateX(-50%)',
      }}
    >
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          {isValidSelection ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-orange-600" />
          )}
          <Badge variant="secondary" className={quality.color}>
            {wordCount} {wordCount === 1 ? 'word' : 'words'} • {quality.type}
          </Badge>
        </div>
        
        <div className="text-xs text-gray-600">
          {isValidSelection 
            ? 'Right-click for more options'
            : 'Selection too long for some features'
          }
        </div>
      </div>
    </div>
  );
};
