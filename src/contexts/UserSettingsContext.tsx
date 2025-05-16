
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Language } from '@/types';
import { toast } from 'sonner';

export type UserSettings = {
  selectedLanguage: Language;
  learningLanguages: Language[];
  avatarUrl?: string;
};

type UserSettingsContextType = {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  avatarUrl: string | undefined;
  uploadAvatar: (file: File) => Promise<void>;
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
          // Using 'profiles' table instead of 'user_settings'
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
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
          .from('profiles')
          .upsert(
            {
              id: user.id,
              selected_language: newSettings.selectedLanguage ?? settings.selectedLanguage,
              learning_languages: newSettings.learningLanguages ?? settings.learningLanguages,
              avatar_url: newSettings.avatarUrl ?? settings.avatarUrl,
            },
            { onConflict: 'id' }
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

  const uploadAvatar = async (file: File) => {
    if (!user) {
      toast.error('You must be logged in to upload an avatar');
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user.id}/${Math.random().toString(36).slice(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-content')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('user-content')
        .getPublicUrl(filePath);
      
      if (!publicUrlData.publicUrl) {
        throw new Error('Failed to get public URL for avatar');
      }

      await updateSettings({ avatarUrl: publicUrlData.publicUrl });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  return (
    <UserSettingsContext.Provider value={{ 
      settings, 
      updateSettings,
      avatarUrl: settings.avatarUrl,
      uploadAvatar
    }}>
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
