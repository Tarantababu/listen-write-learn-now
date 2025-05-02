
import React from 'react';
import { VocabularyItem } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AudioPlayer from '@/components/AudioPlayer';
import { cn } from '@/lib/utils';

interface VocabularyCardProps {
  item: VocabularyItem;
  onDelete: () => void;
  isHighlighted?: boolean;
}

/**
 * VocabularyCard component displays a single vocabulary item with its details
 */
const VocabularyCard: React.FC<VocabularyCardProps> = ({
  item,
  onDelete,
  isHighlighted = false
}) => {
  const { word, definition, exampleSentence, audioUrl, language } = item;
  
  return (
    <Card className={cn(
      "overflow-hidden h-full flex flex-col border transition-all duration-200",
      isHighlighted ? "ring-2 ring-primary shadow-lg" : "shadow-sm hover:shadow-md"
    )}>
      <CardContent className="p-4 flex-grow">
        <div className="mb-2 flex justify-between items-start">
          <h3 className={cn(
            "font-medium text-lg",
            isHighlighted && "text-primary"
          )}>{word}</h3>
          <span className="text-xs px-2 py-1 bg-muted rounded-full capitalize">
            {language}
          </span>
        </div>
        
        <div className="space-y-2 mt-3">
          <VocabularyDefinition definition={definition} />
          <VocabularyExample example={exampleSentence} />
          
          <div className="pt-1">
            <AudioPlayer 
              audioUrl={audioUrl} 
              demoMode={!audioUrl}
            />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-3 pt-0">
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

// Extracted components for better maintainability
const VocabularyDefinition = ({ definition }: { definition: string }) => (
  <div>
    <h4 className="text-sm font-medium">Definition:</h4>
    <p className="text-sm text-muted-foreground">{definition}</p>
  </div>
);

const VocabularyExample = ({ example }: { example: string }) => (
  <div>
    <h4 className="text-sm font-medium">Example:</h4>
    <p className="text-sm text-muted-foreground italic">"{example}"</p>
  </div>
);

export default VocabularyCard;
