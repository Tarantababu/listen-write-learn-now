
import React from 'react';
import { ThemeProvider as ThemeContextProvider } from '@/contexts/ThemeContext';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  storageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = "system", 
  storageKey = "vite-react-theme" 
}) => {
  return (
    <ThemeContextProvider>
      {children}
    </ThemeContextProvider>
  );
};
