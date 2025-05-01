
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings, Language } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserSettingsContextProps {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  selectLanguage: (language: Language) => Promise<void>;
  addLearningLanguage: (language: Language) => Promise<void>;
  removeLearningLanguage: (language: Language) => Promise<void>;
  loading: boolean;
}

const defaultSettings: UserSettings = {
  learningLanguages: ['english', 'german'] as Language[],
  selectedLanguage: 'english' as Language
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
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load settings from Supabase when user changes
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) {
        // If not logged in, use local storage
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('learning_languages, selected_language')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setSettings({
            learningLanguages: data.learning_languages as Language[] || defaultSettings.learningLanguages,
            selectedLanguage: data.selected_language as Language || defaultSettings.selectedLanguage
          });
        }
      } catch (error) {
        console.error('Error fetching user settings:', error);
        // Fallback to defaults
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  // Save settings to local storage for non-authenticated users
  useEffect(() => {
    if (!user) {
      localStorage.setItem('userSettings', JSON.stringify(settings));
    }
  }, [settings, user]);

  const updateSettings = async (updates: Partial<UserSettings>) => {
    try {
      // Update local state
      setSettings(prev => ({ ...prev, ...updates }));

      // If user is authenticated, update in Supabase
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            learning_languages: updates.learningLanguages || settings.learningLanguages,
            selected_language: updates.selectedLanguage || settings.selectedLanguage
          })
          .eq('id', user.id);

        if (error) throw error;
      }
    } catch (error: any) {
      toast.error('Failed to update settings: ' + error.message);
      throw error;
    }
  };

  const selectLanguage = async (language: Language) => {
    if (settings.learningLanguages.includes(language)) {
      try {
        await updateSettings({ selectedLanguage: language });
      } catch (error) {
        console.error('Error selecting language:', error);
      }
    }
  };

  const addLearningLanguage = async (language: Language) => {
    if (!settings.learningLanguages.includes(language)) {
      try {
        const updatedLanguages = [...settings.learningLanguages, language];
        await updateSettings({ learningLanguages: updatedLanguages });
      } catch (error) {
        console.error('Error adding language:', error);
      }
    }
  };

  const removeLearningLanguage = async (language: Language) => {
    if (settings.learningLanguages.length > 1) {
      try {
        const updatedLanguages = settings.learningLanguages.filter(lang => lang !== language);
        const updates: Partial<UserSettings> = { learningLanguages: updatedLanguages };
        
        // If removing the currently selected language, switch to another one
        if (settings.selectedLanguage === language) {
          updates.selectedLanguage = updatedLanguages[0];
        }
        
        await updateSettings(updates);
      } catch (error) {
        console.error('Error removing language:', error);
      }
    }
  };

  const value = {
    settings,
    updateSettings,
    selectLanguage,
    addLearningLanguage,
    removeLearningLanguage,
    loading
  };

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
};
