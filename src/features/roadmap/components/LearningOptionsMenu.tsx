
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Headphones } from 'lucide-react';

interface LearningOptionsMenuProps {
  onStartReadingAnalysis: () => void;
  onStartDictation: () => void;
  exerciseTitle?: string;
}

const LearningOptionsMenu: React.FC<LearningOptionsMenuProps> = ({
  onStartReadingAnalysis,
  onStartDictation,
  exerciseTitle
}) => {
  return (
    <div className="px-6 pt-0 pb-6 space-y-6">
      <div className="mb-6">
        <p className="text-lg font-medium mb-2">Boost Your Understanding Before You Start</p>
        <p className="text-muted-foreground">Dive into a Reading Analysis to see how words and grammar work — or skip straight to dictation.</p>
        {exerciseTitle && (
          <p className="text-sm mt-2 font-medium">{exerciseTitle}</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card className="border-muted overflow-hidden hover:bg-muted/5 transition-colors dark:hover:bg-muted/10">
          <CardContent className="p-0">
            <Button onClick={onStartReadingAnalysis} variant="ghost" className="h-auto py-8 px-6 w-full rounded-none border-0 flex flex-col items-center justify-center text-left bg-transparent">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="flex items-center justify-center bg-primary/10 w-12 h-12 rounded-full">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <div className="font-semibold text-lg">
                  🔍 Start with Reading Analysis
                </div>
                <p className="text-sm text-muted-foreground">
                  Explore vocabulary and grammar with AI explanations
                </p>
              </div>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border border-muted hover:bg-muted/5 transition-all dark:hover:bg-muted/10">
          <CardContent className="p-0">
            <Button onClick={onStartDictation} variant="ghost" className="h-auto py-8 px-6 w-full rounded-none border-0 flex flex-col items-center justify-center text-left bg-transparent">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="flex items-center justify-center bg-muted/40 w-12 h-12 rounded-full">
                  <Headphones className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="font-semibold text-lg">🎧 Start Dictation Now</div>
                <p className="text-sm text-muted-foreground">
                  Practice listening and transcription skills with audio
                </p>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LearningOptionsMenu;
