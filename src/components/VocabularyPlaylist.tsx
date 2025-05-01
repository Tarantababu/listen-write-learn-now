
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { VocabularyItem } from '@/types';
import { Play, Pause, RotateCcw, ListMusic } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { toast } from 'sonner';

interface VocabularyPlaylistProps {
  vocabularyItems: VocabularyItem[];
}

const VocabularyPlaylist: React.FC<VocabularyPlaylistProps> = ({
  vocabularyItems
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filter items that have audio URLs
  const itemsWithAudio = vocabularyItems.filter(item => item.audioUrl);

  // Get the current filtered playlist based on selection
  const currentPlaylist = itemsWithAudio.filter(
    item => selectedItems.has(item.id) || selectedItems.size === 0
  );

  const currentItem = currentPlaylist[currentItemIndex];

  // Load audio when current item changes
  useEffect(() => {
    if (currentItem?.audioUrl && audioRef.current) {
      audioRef.current.src = currentItem.audioUrl;
      
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error('Failed to play audio:', error);
          setIsPlaying(false);
          toast.error('Failed to play audio');
        });
      }
    }
  }, [currentItem, isPlaying]);

  // Handle audio ended event
  useEffect(() => {
    const audio = audioRef.current;
    
    if (!audio) return;
    
    const handleEnded = () => {
      if (currentItemIndex < currentPlaylist.length - 1) {
        setCurrentItemIndex(prev => prev + 1);
      } else {
        // Playlist ended
        setIsPlaying(false);
        setCurrentItemIndex(0);
        toast.info('Playlist completed');
      }
    };
    
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentItemIndex, currentPlaylist.length]);

  const togglePlay = () => {
    if (!currentPlaylist.length) {
      toast.error('No vocabulary items with audio available');
      return;
    }

    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play().catch(error => {
        console.error('Failed to play audio:', error);
        toast.error('Failed to play audio');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (currentItemIndex < currentPlaylist.length - 1) {
      setCurrentItemIndex(prev => prev + 1);
    } else {
      setCurrentItemIndex(0);
    }
  };

  const playPrevious = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(prev => prev - 1);
    } else {
      setCurrentItemIndex(currentPlaylist.length - 1);
    }
  };

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        console.error('Failed to play audio:', error);
      });
      setIsPlaying(true);
    }
  };

  const toggleItemSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    
    setSelectedItems(newSelection);
    
    // Reset playlist position when selection changes
    setCurrentItemIndex(0);
    setIsPlaying(false);
  };

  const handlePlayAll = () => {
    setSelectedItems(new Set());
    setCurrentItemIndex(0);
    setIsPlaying(true);
    setShowPlaylistDialog(false);
  };

  return (
    <>
      <audio ref={audioRef} />
      
      {itemsWithAudio.length > 0 ? (
        <div className="mb-6 bg-muted rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium text-lg flex items-center">
              <ListMusic className="mr-2 h-5 w-5" />
              Vocabulary Playlist
            </h2>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  {selectedItems.size > 0 ? `${selectedItems.size} selected` : 'All items'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <div className="p-4 border-b border-border">
                  <h4 className="font-medium">Select vocabulary items</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose which items to include in the playlist
                  </p>
                </div>
                <div className="max-h-60 overflow-y-auto p-2">
                  {itemsWithAudio.map(item => (
                    <div 
                      key={item.id} 
                      className="flex items-center p-2 hover:bg-accent rounded-md cursor-pointer"
                      onClick={() => toggleItemSelection(item.id)}
                    >
                      <div className={`w-4 h-4 mr-2 rounded border ${
                        selectedItems.has(item.id) ? 'bg-primary border-primary' : 'border-muted-foreground'
                      }`}>
                        {selectedItems.has(item.id) && (
                          <div className="h-full w-full text-white flex items-center justify-center text-xs">✓</div>
                        )}
                      </div>
                      <span className="truncate">{item.word}</span>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-border">
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedItems(new Set())}
                    >
                      Reset
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => {
                        setCurrentItemIndex(0);
                        setIsPlaying(false);
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="outline" 
              size="sm"
              onClick={playPrevious}
              disabled={currentPlaylist.length <= 1}
            >
              Previous
            </Button>
            
            <Button
              onClick={togglePlay}
              variant="default"
              size="icon"
              className="rounded-full w-12 h-12"
            >
              {isPlaying ? 
                <Pause className="h-6 w-6" /> : 
                <Play className="h-6 w-6" />
              }
            </Button>
            
            <Button
              variant="outline" 
              size="sm"
              onClick={playNext}
              disabled={currentPlaylist.length <= 1}
            >
              Next
            </Button>
            
            <Button 
              onClick={restart}
              variant="outline"
              size="icon"
              className="rounded-full"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          
          {currentItem && (
            <div className="mt-4 text-center">
              <p className="font-medium">{currentItem.word}</p>
              <p className="text-sm text-muted-foreground italic">"{currentItem.exampleSentence}"</p>
              <p className="text-xs mt-1 text-muted-foreground">
                {currentItemIndex + 1} of {currentPlaylist.length}
              </p>
            </div>
          )}
        </div>
      ) : null}
      
      <Dialog open={showPlaylistDialog} onOpenChange={setShowPlaylistDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" className="mb-4">
            <ListMusic className="mr-2 h-4 w-4" />
            Manage Playlist
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vocabulary Playlist</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border rounded-md p-4">
              <p className="text-sm mb-2">Select which vocabulary items to include in your playlist:</p>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {itemsWithAudio.map(item => (
                  <div 
                    key={item.id} 
                    className="flex items-center p-2 hover:bg-accent rounded-md cursor-pointer"
                    onClick={() => toggleItemSelection(item.id)}
                  >
                    <div className={`w-4 h-4 mr-2 rounded border ${
                      selectedItems.has(item.id) ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`}>
                      {selectedItems.has(item.id) && (
                        <div className="h-full w-full text-white flex items-center justify-center text-xs">✓</div>
                      )}
                    </div>
                    <span>{item.word}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowPlaylistDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handlePlayAll}>
                Play {selectedItems.size > 0 ? 'Selected' : 'All'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VocabularyPlaylist;
