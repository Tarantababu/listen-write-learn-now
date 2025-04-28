
import React from 'react';
import { VocabularyItem } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AudioPlayer from '@/components/AudioPlayer';

interface VocabularyCardProps {
  item: VocabularyItem;
  onDelete: () => void;
}

const VocabularyCard: React.FC<VocabularyCardProps> = ({
  item,
  onDelete
}) => {
  const { word, definition, exampleSentence, audioUrl, language } = item;
  
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardContent className="p-4 flex-grow">
        <div className="mb-2 flex justify-between items-start">
          <h3 className="font-medium text-lg">{word}</h3>
          <span className="text-xs px-2 py-1 bg-muted rounded-full capitalize">
            {language}
          </span>
        </div>
        
        <div className="space-y-3 mt-4">
          <div>
            <h4 className="text-sm font-medium">Definition:</h4>
            <p className="text-sm text-muted-foreground">{definition}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium">Example:</h4>
            <p className="text-sm text-muted-foreground italic">"{exampleSentence}"</p>
          </div>
          
          <div className="pt-2">
            <AudioPlayer 
              audioUrl={audioUrl} 
              demoMode={!audioUrl}
            />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={onDelete} 
          variant="outline"
          size="sm"
          className="w-full"
        >
          Remove
        </Button>
      </CardFooter>
    </Card>
  );
};

export default VocabularyCard;
