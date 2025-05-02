
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Headphones, Menu, X, Award } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { getUserLevel } from '@/utils/levelSystem';
import LevelBadge from '@/components/LevelBadge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { exercises } = useExerciseContext();
  const { settings } = useUserSettingsContext();
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navigateTo = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };
  
  // Calculate mastered words for level badge
  const masteredWords = React.useMemo(() => {
    const currentLanguage = settings.selectedLanguage;
    const masteredSet = new Set<string>();
    
    exercises.forEach(exercise => {
      if (exercise.language !== currentLanguage || !exercise.isCompleted) return;
      
      // We consider completed exercises (3+ attempts with >95% accuracy) as mastered
      const words = exercise.text
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]"']/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ');
        
      words.forEach(word => masteredSet.add(word));
    });
    
    return masteredSet.size;
  }, [exercises, settings.selectedLanguage]);
  
  const userLevel = getUserLevel(masteredWords);
  
  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-sm sticky top-0 z-50">
      <div 
        className="flex items-center gap-2 cursor-pointer" 
        onClick={() => navigateTo('/dashboard')}
      >
        <Headphones className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">ListenWriteLearn</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-500" />
                <LevelBadge masteredWords={masteredWords} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Your current level: {userLevel.title}</p>
              <p className="text-xs text-muted-foreground">Based on {masteredWords} mastered words</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {isMobile ? (
          <>
            <button 
              onClick={toggleMobileMenu}
              className="text-gray-600 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
            
            {mobileMenuOpen && (
              <div className="absolute top-full left-0 right-0 bg-white shadow-md animate-slide-in">
                <nav className="p-4">
                  <ul className="flex flex-col gap-4">
                    <li>
                      <button 
                        onClick={() => navigateTo('/dashboard/exercises')}
                        className="text-base w-full text-left py-2 px-4 hover:bg-muted rounded-md transition-colors"
                      >
                        Exercises
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => navigateTo('/dashboard/vocabulary')}
                        className="text-base w-full text-left py-2 px-4 hover:bg-muted rounded-md transition-colors"
                      >
                        Vocabulary
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => navigateTo('/dashboard/settings')}
                        className="text-base w-full text-left py-2 px-4 hover:bg-muted rounded-md transition-colors"
                      >
                        Settings
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </>
        ) : (
          <nav>
            <ul className="flex gap-6">
              <li>
                <button 
                  onClick={() => navigateTo('/dashboard/exercises')}
                  className="text-sm hover:text-primary transition-colors"
                >
                  Exercises
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('/dashboard/vocabulary')}
                  className="text-sm hover:text-primary transition-colors"
                >
                  Vocabulary
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('/dashboard/settings')}
                  className="text-sm hover:text-primary transition-colors"
                >
                  Settings
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
