
import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Mic, Brain, Plus, Copy, Search } from 'lucide-react';
import { toast } from 'sonner';

interface TextSelectionContextMenuProps {
  children: React.ReactNode;
  selectedText: string;
  onCreateDictation: (text: string) => void;
  onCreateBidirectional: (text: string) => void;
  onCreateVocabulary?: (text: string) => void;
  disabled?: boolean;
  enableVocabulary?: boolean;
}

export const TextSelectionContextMenu: React.FC<TextSelectionContextMenuProps> = ({
  children,
  selectedText,
  onCreateDictation,
  onCreateBidirectional,
  onCreateVocabulary,
  disabled = false,
  enableVocabulary = false
}) => {
  const handleCopyText = () => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
      toast.success('Text copied to clipboard');
    }
  };

  const handleSearchText = () => {
    if (selectedText) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(selectedText)}`;
      window.open(searchUrl, '_blank');
    }
  };

  const handleCreateDictation = () => {
    if (selectedText) {
      onCreateDictation(selectedText);
    }
  };

  const handleCreateBidirectional = () => {
    if (selectedText) {
      onCreateBidirectional(selectedText);
    }
  };

  const handleCreateVocabulary = () => {
    if (selectedText && onCreateVocabulary) {
      onCreateVocabulary(selectedText);
    }
  };

  if (disabled || !selectedText) {
    return <>{children}</>;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <div className="px-3 py-2 text-sm font-medium text-gray-600 border-b">
          "{selectedText.length > 30 ? selectedText.substring(0, 30) + '...' : selectedText}"
        </div>
        
        <ContextMenuItem onClick={handleCreateDictation} className="cursor-pointer">
          <Mic className="mr-2 h-4 w-4" />
          Create Dictation Exercise
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleCreateBidirectional} className="cursor-pointer">
          <Brain className="mr-2 h-4 w-4" />
          Create Translation Exercise
        </ContextMenuItem>
        
        {enableVocabulary && onCreateVocabulary && (
          <ContextMenuItem onClick={handleCreateVocabulary} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Add to Vocabulary
          </ContextMenuItem>
        )}
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={handleCopyText} className="cursor-pointer">
          <Copy className="mr-2 h-4 w-4" />
          Copy Text
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleSearchText} className="cursor-pointer">
          <Search className="mr-2 h-4 w-4" />
          Search Online
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
