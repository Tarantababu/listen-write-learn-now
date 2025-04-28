
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings, Language } from '@/types';

interface UserSettingsContextProps {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  selectLanguage: (language: Language) => void;
  addLearningLanguage: (language: Language) => void;
  removeLearningLanguage: (language: Language) => void;
}

const defaultSettings: UserSettings = {
  learningLanguages: ['english', 'german'],
  selectedLanguage: 'english'
};

const UserSettingsContext = createContext<UserSettingsContextProps | undefined>(undefined);

export const useUserSettingsContext = () => {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error('useUserSettingsContext must be used within a UserSettingsProvider');
  }
  return context;
};

export const UserSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const savedSettings = localStorage.getItem('userSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const selectLanguage = (language: Language) => {
    if (settings.learningLanguages.includes(language)) {
      setSettings(prev => ({ ...prev, selectedLanguage: language }));
    }
  };

  const addLearningLanguage = (language: Language) => {
    if (!settings.learningLanguages.includes(language)) {
      setSettings(prev => ({
        ...prev,
        learningLanguages: [...prev.learningLanguages, language]
      }));
    }
  };

  const removeLearningLanguage = (language: Language) => {
    if (settings.learningLanguages.length > 1) {
      const updatedLanguages = settings.learningLanguages.filter(lang => lang !== language);
      setSettings(prev => ({
        ...prev,
        learningLanguages: updatedLanguages,
        selectedLanguage: prev.selectedLanguage === language ? updatedLanguages[0] : prev.selectedLanguage
      }));
    }
  };

  const value = {
    settings,
    updateSettings,
    selectLanguage,
    addLearningLanguage,
    removeLearningLanguage
  };

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
};
