import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Toggle } from '@/components/ui/toggle';
import { useLocation } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
interface ThemeToggleProps {
  variant?: 'default' | 'compact';
  showLabel?: boolean;
}
const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'default',
  showLabel = true
}) => {
  const {
    theme,
    toggleTheme
  } = useTheme();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isDark = theme === 'dark';

  // Disable toggle on landing page
  if (isLandingPage) {
    return null;
  }
  if (variant === 'compact') {
    return <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{isDark ? "Switch to light mode" : "Switch to dark mode"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>;
  }
  return <div className="flex items-center gap-2">
      {showLabel && <span className="text-sm text-muted-foreground">Dark Mode</span>}
      <div className="flex items-center cursor-pointer" onClick={toggleTheme}>
        <div className={`flex items-center justify-center w-11 h-6 rounded-full transition-colors ${isDark ? 'bg-primary' : 'bg-input'}`}>
          <div className={`flex items-center justify-center h-5 w-5 rounded-full bg-background transition-transform ${isDark ? 'translate-x-5' : 'translate-x-0'}`}>
            {isDark ? <Moon className="h-3 w-3 text-foreground" /> : <Sun className="h-3 w-3 text-foreground" />}
          </div>
        </div>
      </div>
    </div>;
};
export default ThemeToggle;