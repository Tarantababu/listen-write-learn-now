
import React, { useState } from 'react';
import { useCurriculum } from '@/contexts/CurriculumContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { LanguageLevel } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import LevelBadge from '@/components/LevelBadge';
import { motion } from 'framer-motion';

const levels: { level: LanguageLevel; title: string; description: string }[] = [
  { 
    level: 'A0', 
    title: 'Absolute Beginner', 
    description: 'Start learning the very basics of the language' 
  },
  { 
    level: 'A1', 
    title: 'Beginner', 
    description: 'Simple phrases and everyday expressions' 
  },
  { 
    level: 'A2', 
    title: 'Elementary', 
    description: 'Basic communication for routine tasks' 
  },
  { 
    level: 'B1', 
    title: 'Intermediate', 
    description: 'Main points on familiar matters regularly encountered' 
  },
  { 
    level: 'B2', 
    title: 'Upper Intermediate', 
    description: 'Interact with a degree of fluency with native speakers' 
  },
  { 
    level: 'C1', 
    title: 'Advanced', 
    description: 'Express ideas fluently and spontaneously' 
  },
  { 
    level: 'C2', 
    title: 'Proficient', 
    description: 'Understand with ease virtually everything heard or read' 
  },
];

const CurriculumSelection: React.FC = () => {
  const { initializeUserCurriculumPath, isLoading } = useCurriculum();
  const { settings } = useUserSettingsContext();
  const [selectedLevel, setSelectedLevel] = useState<LanguageLevel | null>(null);
  
  const handleSelection = (level: LanguageLevel) => {
    setSelectedLevel(level);
  };
  
  const handleStartCurriculum = async () => {
    if (selectedLevel) {
      await initializeUserCurriculumPath(selectedLevel, settings.selectedLanguage);
    }
  };
  
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Select your level for {settings.selectedLanguage}</h2>
      <p className="text-sm text-muted-foreground">
        Choose the level that best matches your current knowledge of {settings.selectedLanguage}
      </p>
      
      <div className="grid gap-4">
        {levels.map((level, index) => (
          <motion.div 
            key={level.level}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            <Card 
              className={`cursor-pointer transition-all ${
                selectedLevel === level.level 
                  ? 'border-primary shadow-md' 
                  : 'hover:border-muted-foreground/20'
              }`}
              onClick={() => handleSelection(level.level)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">
                    {level.title}
                  </CardTitle>
                  <LevelBadge level={level.level} />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{level.description}</CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      <Separator className="my-4" />
      
      <div className="flex justify-end">
        <Button 
          onClick={handleStartCurriculum} 
          disabled={!selectedLevel || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting...
            </>
          ) : (
            <>Start Learning</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CurriculumSelection;
