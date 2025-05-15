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
  uploadAvatar: (file: File) => Promise<string | null>;
  avatarUrl: string | null;
}

const defaultSettings: UserSettings = {
  learningLanguages: ['english', 'german', 'spanish', 'french'] as Language[],
  selectedLanguage: 'english' as Language
};

const UserSettingsContext = createContext<UserSettingsContextProps | undefined>(undefined);

// Export both the original name and the simpler alias for backward compatibility
export const useUserSettingsContext = () => {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error('useUserSettingsContext must be used within a UserSettingsProvider');
  }
  return context;
};

// Add this alias to match what HomePage.tsx is importing
export const useUserSettings = useUserSettingsContext;

export const UserSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Initialize avatar from localStorage if available
  useEffect(() => {
    if (user) {
      // Check cached avatarUrl in localStorage first for immediate display
      const cachedAvatarUrl = localStorage.getItem(`userAvatarUrl:${user.id}`);
      if (cachedAvatarUrl) {
        setAvatarUrl(cachedAvatarUrl);
      }
      
      // Then fetch the latest from the database
      fetchUserAvatar(user.id);
    } else {
      // Clear avatar when there's no user
      setAvatarUrl(null);
      // Clean up any stored avatar URLs when user logs out
      if (typeof localStorage !== 'undefined') {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('userAvatarUrl:')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
    }
  }, [user]);
  
  // Load settings from localStorage first, then override with Supabase if authenticated
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Failed to parse saved settings", e);
      }
    }
  }, []);

  const fetchUserAvatar = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .maybeSingle(); // Using maybeSingle instead of single to avoid errors if no profile exists
          
      if (error) throw error;
      
      if (data && data.avatar_url) {
        console.log('Avatar loaded from database:', data.avatar_url);
        setAvatarUrl(data.avatar_url);
        // Store the avatar URL in localStorage with the user ID to ensure it's user-specific
        localStorage.setItem(`userAvatarUrl:${userId}`, data.avatar_url);
      }
    } catch (error) {
      console.error('Error fetching avatar:', error);
    }
  };

  // Load settings from Supabase when user changes
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) {
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
        // Fallback to defaults or local storage
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  // Save settings to local storage for non-authenticated users
  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);

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

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) {
      toast.error('You must be logged in to upload an avatar');
      return null;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('user-content')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data } = supabase.storage
        .from('user-content')
        .getPublicUrl(filePath);

      const newAvatarUrl = data.publicUrl;

      // Update the profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state and localStorage with user-specific key
      setAvatarUrl(newAvatarUrl);
      localStorage.setItem(`userAvatarUrl:${user.id}`, newAvatarUrl);
      console.log('Avatar updated and cached:', newAvatarUrl);
      
      toast.success('Avatar updated successfully');
      return newAvatarUrl;
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar: ' + error.message);
      return null;
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
    loading,
    uploadAvatar,
    avatarUrl
  };

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
};
