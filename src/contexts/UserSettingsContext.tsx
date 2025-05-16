import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Language } from '@/types';

export type UserSettings = {
  selectedLanguage: Language;
  learningLanguages: Language[];
  avatarUrl?: string; // Add avatarUrl to UserSettings
};

type UserSettingsContextType = {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
};

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export const UserSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    selectedLanguage: 'en',
    learningLanguages: ['en'],
    avatarUrl: '',
  });

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error) {
            console.error('Error fetching user settings:', error);
          }

          if (data) {
            setSettings({
              selectedLanguage: data.selected_language || 'en',
              learningLanguages: data.learning_languages || ['en'],
              avatarUrl: data.avatar_url || '',
            });
          }
        } catch (error) {
          console.error('Error fetching user settings:', error);
        }
      }
    };

    fetchUserSettings();
  }, [user]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (user) {
      try {
        const { error } = await supabase
          .from('user_settings')
          .upsert(
            {
              user_id: user.id,
              selected_language: newSettings.selectedLanguage ?? settings.selectedLanguage,
              learning_languages: newSettings.learningLanguages ?? settings.learningLanguages,
              avatar_url: newSettings.avatarUrl ?? settings.avatarUrl,
            },
            { onConflict: 'user_id' }
          );

        if (error) {
          console.error('Error updating user settings:', error);
        } else {
          setSettings((prevSettings) => ({
            ...prevSettings,
            ...newSettings,
          }));
        }
      } catch (error) {
        console.error('Error updating user settings:', error);
      }
    } else {
      setSettings((prevSettings) => ({
        ...prevSettings,
        ...newSettings,
      }));
    }
  };

  return (
    <UserSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </UserSettingsContext.Provider>
  );
};

export const useUserSettingsContext = () => {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error('useUserSettingsContext must be used within a UserSettingsProvider');
  }
  return context;
};
