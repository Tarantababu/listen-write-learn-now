
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, UserSettings } from '@/types';

interface UserSettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  setSelectedLanguage: (language: Language) => void;
  addLearningLanguage: (language: Language) => void;
  removeLearningLanguage: (language: Language) => void;
}

const defaultSettings: UserSettings = {
  learningLanguages: ['english'],
  selectedLanguage: 'english',
};

const UserSettingsContext = createContext<UserSettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  setSelectedLanguage: () => {},
  addLearningLanguage: () => {},
  removeLearningLanguage: () => {},
});

interface UserSettingsProviderProps {
  children: ReactNode;
}

export const UserSettingsProvider: React.FC<UserSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(() => {
    // Try to load settings from localStorage
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        console.error('Error parsing user settings:', e);
      }
    }
    return defaultSettings;
  });

  // Update localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };

  const setSelectedLanguage = (language: Language) => {
    setSettings(prev => ({
      ...prev,
      selectedLanguage: language,
    }));
  };

  const addLearningLanguage = (language: Language) => {
    setSettings(prev => {
      if (!prev.learningLanguages.includes(language)) {
        return {
          ...prev,
          learningLanguages: [...prev.learningLanguages, language],
        };
      }
      return prev;
    });
  };

  const removeLearningLanguage = (language: Language) => {
    setSettings(prev => {
      if (prev.learningLanguages.length > 1) {
        return {
          ...prev,
          learningLanguages: prev.learningLanguages.filter(lang => lang !== language),
          selectedLanguage: 
            prev.selectedLanguage === language 
              ? prev.learningLanguages.find(lang => lang !== language) || 'english'
              : prev.selectedLanguage,
        };
      }
      return prev;
    });
  };

  const value = {
    settings,
    updateSettings,
    setSelectedLanguage,
    addLearningLanguage,
    removeLearningLanguage,
  };

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
};

export const useUserSettingsContext = () => useContext(UserSettingsContext);
