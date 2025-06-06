
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

type Theme = 'light' | 'dark';

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  let isLandingPage = false;
  
  // Try to use location if we're in a router context
  try {
    const location = useLocation();
    isLandingPage = location.pathname === '/';
  } catch (error) {
    // If useLocation fails, we're not in a router context
    // This is fine for the initial render in main.tsx
    isLandingPage = false;
  }

  // Load theme from localStorage on initial mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Update the document class when theme changes
  useEffect(() => {
    // Landing page should always be light mode
    if (isLandingPage) {
      document.documentElement.classList.remove('dark');
      return;
    }

    // Apply dark mode class based on theme setting
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      
      // Add classes for dictation practice components which can't be directly modified
      document.documentElement.classList.add('dark-dictation-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.remove('dark-dictation-mode');
    }
  }, [theme, isLandingPage]);

  // Toggle between light and dark theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Set theme explicitly
  const setThemeValue = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeValue }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
