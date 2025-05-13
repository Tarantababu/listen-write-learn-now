
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Headphones, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LearningOptionsMenuProps {
  onStartReadingAnalysis: () => void;
  onStartDictation: () => void;
  exerciseTitle?: string;
  hasReadingAnalysis?: boolean;
}

const LearningOptionsMenu: React.FC<LearningOptionsMenuProps> = ({
  onStartReadingAnalysis,
  onStartDictation,
  exerciseTitle,
  hasReadingAnalysis = false
}) => {
  return (
    <div className="px-6 pt-0 pb-6 space-y-6">
      <div className="mb-6">
        <p className="text-lg font-medium mb-2">Boost Your Understanding Before You Start</p>
        <p className="text-muted-foreground">Dive into a Reading Analysis to see how words and grammar work — or skip straight to dictation.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card className={cn(
          "border-muted overflow-hidden hover:bg-muted/5 transition-colors dark:hover:bg-muted/10",
          hasReadingAnalysis && "border-primary/20 bg-primary/5"
        )}>
          <CardContent className="p-0">
            <Button 
              onClick={onStartReadingAnalysis} 
              variant="ghost" 
              className="h-auto py-8 px-6 w-full rounded-none border-0 flex flex-col items-center justify-center text-left bg-transparent"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="flex items-center justify-center bg-primary/10 w-12 h-12 rounded-full relative">
                  <Search className="h-6 w-6 text-primary" />
                  {hasReadingAnalysis && (
                    <span className="absolute -right-1 -top-1 bg-primary text-white rounded-full p-0.5">
                      <BadgeCheck className="h-4 w-4" />
                    </span>
                  )}
                </div>
                <div className="font-semibold text-lg">
                  🔍 {hasReadingAnalysis ? 'View Reading Analysis' : 'Start with Reading Analysis'}
                </div>
                <p className="text-sm text-muted-foreground">
                  {hasReadingAnalysis 
                    ? 'Reading analysis is available - review vocabulary and grammar explanations'
                    : 'Explore vocabulary and grammar with AI explanations'}
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
