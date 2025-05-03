
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { VocabularyItem } from '@/types';
import { Trash, Volume2 } from 'lucide-react';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { toast } from 'sonner';

interface VocabularyCardProps {
  item: VocabularyItem;
}

const VocabularyCard: React.FC<VocabularyCardProps> = ({ item }) => {
  const { removeVocabularyItem } = useVocabularyContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const handleDelete = async () => {
    try {
      await removeVocabularyItem(item.id);
      toast.success('Vocabulary removed successfully');
    } catch (error) {
      toast.error('Failed to remove vocabulary');
    }
  };

  const playAudio = () => {
    if (!item.audioUrl) return;
    
    if (!audio) {
      const newAudio = new Audio(item.audioUrl);
      setAudio(newAudio);
      
      newAudio.addEventListener('ended', () => {
        setIsPlaying(false);
      });
      
      newAudio.addEventListener('error', () => {
        setIsPlaying(false);
        toast.error('Failed to play audio');
      });
      
      newAudio.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.error('Error playing audio:', error);
        toast.error('Failed to play audio');
      });
    } else {
      if (isPlaying) {
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
      } else {
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.error('Error playing audio:', error);
          toast.error('Failed to play audio');
        });
      }
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <span className="text-lg font-bold">{item.word}</span>
          <div className="flex gap-2">
            {item.audioUrl && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={playAudio}
                className={isPlaying ? "text-primary" : ""}
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="outline" 
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10" 
              onClick={handleDelete}
              title="Delete vocabulary item"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-3">
          <p className="text-sm font-medium text-muted-foreground mb-1">Definition:</p>
          <p>{item.definition}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Example:</p>
          <p className="italic text-sm">{item.exampleSentence}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VocabularyCard;
