
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export interface ExerciseContentProps {
  exercise: {
    id: string;
    title: string;
    text: string;
    audioUrl?: string;
    language?: string;
    tags?: string[];
  };
  showActions?: boolean;
}

const ExerciseContent: React.FC<ExerciseContentProps> = ({ 
  exercise,
  showActions = true
}) => {
  return (
    <Card className="mb-4">
      <CardContent className="p-4 space-y-4">
        <h3 className="text-lg font-medium">{exercise.title}</h3>
        
        <div className="exercise-text text-base mt-2 leading-relaxed">
          {exercise.text.split('\n\n').map((paragraph, idx) => (
            <p key={idx} className="mb-4">{paragraph}</p>
          ))}
        </div>
        
        {showActions && exercise.audioUrl && (
          <div className="mt-4">
            <audio
              className="w-full"
              controls
              src={exercise.audioUrl}
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
        
        {showActions && (
          <div className="flex justify-end mt-4">
            {exercise.audioUrl && (
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Open audio in new tab
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExerciseContent;
