
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Headphones, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface LearningOptionsMenuProps {
  onStartReadingAnalysis: () => void;
  onStartDictation: () => void;
  exerciseTitle?: string;
  analysisAllowed?: boolean;
  isSubscribed?: boolean;
  loadingAnalysisCheck?: boolean;
}

const LearningOptionsMenu: React.FC<LearningOptionsMenuProps> = ({
  onStartReadingAnalysis,
  onStartDictation,
  exerciseTitle,
  analysisAllowed = true,
  isSubscribed = false,
  loadingAnalysisCheck = false,
}) => {
  return (
    <div className="px-6 py-8 space-y-6 flex-1 overflow-y-auto practice-content">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{exerciseTitle}</h2>
        <div>
          <p className="text-lg font-medium mb-2">Boost Your Understanding Before You Start</p>
          <p className="text-base text-muted-foreground">
            Dive into a Reading Analysis to see how words and grammar work — or skip straight to dictation.
          </p>
          {loadingAnalysisCheck && (
            <div className="mt-2 text-sm font-medium">Checking for existing analysis...</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="group"
        >
          <Card className="border-2 border-primary/20 overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-lg dark:hover:bg-muted/5 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-0">
              <Button
                onClick={onStartReadingAnalysis}
                variant="ghost"
                disabled={!analysisAllowed || loadingAnalysisCheck}
                className="h-auto py-8 px-6 w-full rounded-none border-0 flex flex-col items-center justify-center text-left bg-transparent hover:bg-transparent"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="flex items-center justify-center bg-primary/15 w-16 h-16 rounded-full group-hover:bg-primary/25 transition-colors duration-300">
                    <Search className="h-7 w-7 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <div className="font-semibold text-xl text-primary">🔍 Reading Analysis</div>
                    <p className="text-sm text-muted-foreground leading-relaxed px-2">
                      Explore vocabulary and grammar with AI explanations
                    </p>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="group"
        >
          <Card className="border-2 border-muted overflow-hidden hover:border-muted/60 transition-all duration-300 hover:shadow-lg dark:hover:bg-muted/5 bg-gradient-to-br from-muted/20 to-muted/30">
            <CardContent className="p-0">
              <Button
                onClick={onStartDictation}
                variant="ghost"
                className="h-auto py-8 px-6 w-full rounded-none border-0 flex flex-col items-center justify-center text-left bg-transparent hover:bg-transparent"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="flex items-center justify-center bg-muted/60 w-16 h-16 rounded-full group-hover:bg-muted/80 transition-colors duration-300">
                    <Headphones className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <div className="font-semibold text-xl">🎧 Dictation Practice</div>
                    <p className="text-sm text-muted-foreground leading-relaxed px-2">
                      Practice listening and transcription skills with audio
                    </p>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {!analysisAllowed && !isSubscribed && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-amber-50 border-2 border-amber-200 text-amber-800 p-4 rounded-lg flex items-start mt-6 dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-300"
        >
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-base">Free user limit reached</p>
            <p className="text-sm mt-1">
              You've reached the limit of 5 reading analyses for free users. Upgrade to premium for unlimited
              analyses.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LearningOptionsMenu;
