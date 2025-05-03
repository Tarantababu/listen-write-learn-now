
import React, { useState, useRef, useEffect } from 'react';
import { VocabularyItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { toast } from 'sonner';
import { PlayCircle, PauseCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VocabularyPlaylistProps {
  vocabulary: VocabularyItem[];
  compact?: boolean;
}

const VocabularyPlaylist = ({ vocabulary, compact = false }: VocabularyPlaylistProps) => {
  const { settings } = useUserSettingsContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  
  // Add audio references
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);

  // Generate text-to-speech for vocabulary items
  const generateAudio = async (text: string, language: string): Promise<string | null> => {
    try {
      setIsLoadingAudio(true);
      
      // Call the text-to-speech Supabase function
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, language: language.toLowerCase() }
      });

      if (error) {
        console.error('Error generating speech:', error);
        toast.error('Failed to generate audio');
        return null;
      }

      // Create a blob URL from the base64 audio content
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      
      return url;
    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error('Failed to generate audio');
      return null;
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Play the current vocabulary item
  const playCurrentVocabulary = async () => {
    if (vocabulary.length === 0 || currentIndex >= vocabulary.length) {
      toast.error('No vocabulary to play');
      setIsPlaying(false);
      return;
    }

    const currentItem = vocabulary[currentIndex];
    
    // If the item has an audioUrl, play it directly
    if (currentItem.audioUrl) {
      setCurrentAudioUrl(currentItem.audioUrl);
      if (audioRef.current) {
        audioRef.current.src = currentItem.audioUrl;
        audioRef.current.play();
      }
    } else {
      // Generate audio for the word
      const wordAudio = await generateAudio(
        currentItem.word, 
        currentItem.language
      );
      
      if (wordAudio) {
        setCurrentAudioUrl(wordAudio);
        if (audioRef.current) {
          audioRef.current.src = wordAudio;
          audioRef.current.play();
        }
      }
    }

    // Display the current word in a toast
    toast.info(`${currentItem.word}: ${currentItem.definition}`);
  };

  // Manage audio playback
  useEffect(() => {
    if (isPlaying) {
      playCurrentVocabulary();
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentIndex]);

  // Handle audio ended event
  const handleAudioEnded = () => {
    // Move to the next vocabulary item
    if (currentIndex < vocabulary.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // End of playlist
      setIsPlaying(false);
      setCurrentIndex(0);
      toast.success('Playlist finished');
    }
  };

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    
    if (audio) {
      audio.addEventListener('ended', handleAudioEnded);
    }
    
    return () => {
      if (audio) {
        audio.removeEventListener('ended', handleAudioEnded);
      }
      
      // Clean up any blob URLs to avoid memory leaks
      if (currentAudioUrl && currentAudioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentAudioUrl);
      }
    };
  }, [currentIndex, vocabulary.length]);

  // Handle play button click
  const handlePlay = () => {
    if (!vocabulary.length) {
      toast.error('No vocabulary to play');
      return;
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Practice Playlist</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              {vocabulary.length === 0
                ? 'Add vocabulary words through the Vocabulary Builder when reading exercises'
                : `${vocabulary.length} words available for practice`}
            </p>
            
            {/* Hidden audio element */}
            <audio ref={audioRef} style={{ display: 'none' }} />
            
            {isPlaying && vocabulary.length > 0 && currentIndex < vocabulary.length && (
              <div className="mb-4 p-3 bg-primary/5 rounded-md">
                <p className="font-semibold">{vocabulary[currentIndex].word}</p>
                <p className="text-sm text-muted-foreground">{vocabulary[currentIndex].definition}</p>
              </div>
            )}
            
            <Button
              onClick={handlePlay}
              variant="outline"
              className="w-full"
              disabled={vocabulary.length === 0 || isLoadingAudio}
            >
              {isPlaying ? (
                <>
                  <PauseCircle className="mr-2 h-4 w-4" /> Pause Playback
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" /> Start Playback
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VocabularyPlaylist;
