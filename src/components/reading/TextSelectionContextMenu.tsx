
import React, { useState, useEffect } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Mic, Brain, Plus, Copy, Search, Loader2, Volume2, Sparkles, BookOpen, X } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import AudioPlayer from '@/components/AudioPlayer';

interface VocabularyInfo {
  definition: string;
  exampleSentence: string;
  audioUrl?: string;
}

interface TextSelectionContextMenuProps {
  children: React.ReactNode;
  selectedText: string;
  onCreateDictation: (text: string) => void;
  onCreateBidirectional: (text: string) => void;
  onCreateVocabulary?: (text: string) => void;
  disabled?: boolean;
  enableVocabulary?: boolean;
  isGeneratingVocabulary?: boolean;
  canCreateVocabulary?: boolean;
  vocabularyInfo?: VocabularyInfo | null;
  onClose?: () => void;
}

export const TextSelectionContextMenu: React.FC<TextSelectionContextMenuProps> = ({
  children,
  selectedText,
  onCreateDictation,
  onCreateBidirectional,
  onCreateVocabulary,
  disabled = false,
  enableVocabulary = false,
  isGeneratingVocabulary = false,
  canCreateVocabulary = true,
  vocabularyInfo,
  onClose
}) => {
  const isMobile = useIsMobile();
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);

  // Mobile touch handling for alternative access
  useEffect(() => {
    if (!isMobile || !selectedText) return;

    let touchTimer: NodeJS.Timeout;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (selectedText) {
        touchTimer = setTimeout(() => {
          setShowMobileActions(true);
        }, 500); // 500ms long press
      }
    };

    const handleTouchEnd = () => {
      if (touchTimer) {
        clearTimeout(touchTimer);
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      if (touchTimer) clearTimeout(touchTimer);
    };
  }, [isMobile, selectedText]);

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
      toast.success('Dictation exercise created!');
    }
  };

  const handleCreateBidirectional = () => {
    if (selectedText) {
      onCreateBidirectional(selectedText);
      toast.success('Translation exercise created!');
    }
  };

  const handleCreateVocabulary = () => {
    if (selectedText && onCreateVocabulary) {
      onCreateVocabulary(selectedText);
    }
  };

  const closeMobileActions = () => {
    setShowMobileActions(false);
    if (onClose) onClose();
  };

  const getDisplayText = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (disabled || !selectedText) {
    return <>{children}</>;
  }

  // Mobile floating action panel
  const MobileActionPanel = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={closeMobileActions}>
      <Card className="w-full mx-4 mb-4 p-4 animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-4">
          {/* Header with selected text */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">Selected Text</span>
            </div>
            <Button size="sm" variant="ghost" onClick={closeMobileActions}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-900">
              "{getDisplayText(selectedText, 50)}"
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleCreateDictation}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Mic className="h-4 w-4" />
              Dictation
            </Button>
            
            <Button
              onClick={handleCreateBidirectional}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Brain className="h-4 w-4" />
              Translation
            </Button>
            
            {enableVocabulary && onCreateVocabulary && (
              <Button
                onClick={handleCreateVocabulary}
                disabled={isGeneratingVocabulary || !canCreateVocabulary}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isGeneratingVocabulary ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Vocabulary
              </Button>
            )}
            
            <Button
              onClick={handleCopyText}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>

          {/* Vocabulary info display */}
          {vocabularyInfo && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Added to Vocabulary!</span>
              </div>
              
              <div>
                <p className="text-xs text-green-600 mb-1">Definition:</p>
                <p className="text-sm text-green-800">{vocabularyInfo.definition}</p>
              </div>
              
              <div>
                <p className="text-xs text-green-600 mb-1">Example:</p>
                <p className="text-sm italic text-green-800 mb-2">"{vocabularyInfo.exampleSentence}"</p>
                
                {vocabularyInfo.audioUrl && (
                  <AudioPlayer audioUrl={vocabularyInfo.audioUrl} />
                )}
              </div>
            </div>
          )}

          {/* Loading state */}
          {isGeneratingVocabulary && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-700">Generating vocabulary information...</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  return (
    <>
      <ContextMenu onOpenChange={setIsContextMenuOpen}>
        <ContextMenuTrigger asChild>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-72 p-2">
          {/* Enhanced header with text preview and analysis */}
          <div className="px-3 py-3 border-b border-gray-100">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Selected Text
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 leading-relaxed break-words">
                  "{getDisplayText(selectedText, 45)}"
                </p>
              </div>
              <div className="flex gap-1">
                <Badge variant="outline" className="text-xs">
                  {selectedText.split(' ').length} words
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Primary actions with enhanced styling */}
          <div className="py-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ContextMenuItem 
                    onClick={handleCreateDictation} 
                    className="cursor-pointer focus:bg-blue-50 focus:text-blue-700 px-3 py-2"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-1 rounded bg-blue-100">
                        <Mic className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Create Dictation Exercise</div>
                        <div className="text-xs text-gray-500">Practice listening and typing</div>
                      </div>
                    </div>
                  </ContextMenuItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Convert selected text into a dictation exercise</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <ContextMenuItem 
                    onClick={handleCreateBidirectional} 
                    className="cursor-pointer focus:bg-purple-50 focus:text-purple-700 px-3 py-2"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-1 rounded bg-purple-100">
                        <Brain className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Create Translation Exercise</div>
                        <div className="text-xs text-gray-500">Practice translation skills</div>
                      </div>
                    </div>
                  </ContextMenuItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Convert selected text into a translation exercise</p>
                </TooltipContent>
              </Tooltip>
              
              {enableVocabulary && onCreateVocabulary && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ContextMenuItem 
                      onClick={handleCreateVocabulary}
                      className="cursor-pointer focus:bg-green-50 focus:text-green-700 px-3 py-2"
                      disabled={isGeneratingVocabulary || !canCreateVocabulary}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="p-1 rounded bg-green-100">
                          {isGeneratingVocabulary ? (
                            <Loader2 className="h-4 w-4 text-green-600 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">
                            {isGeneratingVocabulary ? 'Generating...' : 'Add to Vocabulary'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {canCreateVocabulary ? 'Save word with definition and audio' : 'Vocabulary limit reached'}
                          </div>
                        </div>
                      </div>
                    </ContextMenuItem>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{canCreateVocabulary ? 'Add word to your vocabulary collection' : 'Upgrade to premium for unlimited vocabulary'}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
          
          <ContextMenuSeparator />
          
          {/* Utility actions */}
          <div className="py-1">
            <ContextMenuItem onClick={handleCopyText} className="cursor-pointer px-3 py-2">
              <Copy className="mr-3 h-4 w-4" />
              <span>Copy Text</span>
            </ContextMenuItem>
            
            <ContextMenuItem onClick={handleSearchText} className="cursor-pointer px-3 py-2">
              <Search className="mr-3 h-4 w-4" />
              <span>Search Online</span>
            </ContextMenuItem>
          </div>

          {/* Vocabulary information display */}
          {vocabularyInfo && (
            <>
              <ContextMenuSeparator />
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg mx-2 my-2">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Added to Vocabulary!</span>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-green-600 font-medium mb-1">Definition:</p>
                    <p className="text-sm text-green-800">{vocabularyInfo.definition}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-green-600 font-medium mb-1">Example:</p>
                    <p className="text-sm italic text-green-800 mb-2">"{vocabularyInfo.exampleSentence}"</p>
                    
                    {vocabularyInfo.audioUrl ? (
                      <AudioPlayer audioUrl={vocabularyInfo.audioUrl} />
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-green-600">
                        <Volume2 className="h-3 w-3" />
                        <span>Audio not available</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Mobile floating action panel */}
      {isMobile && showMobileActions && <MobileActionPanel />}
    </>
  );
};
