import React, { useState } from 'react';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Language } from '@/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, Settings, Mail, User, Moon } from 'lucide-react';
import FeedbackForm from '@/components/FeedbackForm';
import AvatarUpload from '@/components/AvatarUpload';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import ResetLanguageProgress from '@/components/ResetLanguageProgress';
import { getLanguageFlag } from '@/utils/languageUtils';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { OnboardingSettings } from '@/components/onboarding/OnboardingSettings';

const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    selectLanguage,
    addLearningLanguage,
    removeLearningLanguage,
    loading
  } = useUserSettingsContext();
  const availableLanguages: Language[] = ['english', 'german', 'spanish', 'french', 'portuguese', 'italian', 'turkish', 'swedish', 'dutch', 'norwegian'];
  const [updatingLanguage, setUpdatingLanguage] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  
  const handleLanguageToggle = async (language: Language, isChecked: boolean) => {
    try {
      setUpdatingLanguage(language);
      if (isChecked) {
        await addLearningLanguage(language);
        toast.success(`Added ${language} to your learning languages`);
      } else {
        await removeLearningLanguage(language);
        toast.success(`Removed ${language} from your learning languages`);
      }
    } catch (error) {
      console.error('Error updating languages:', error);
      toast.error('Failed to update learning languages');
    } finally {
      setUpdatingLanguage(null);
    }
  };
  
  const handleLanguageSelect = async (language: Language) => {
    try {
      setUpdatingLanguage(language);
      await selectLanguage(language);
      toast.success(`Selected ${language} as your active language`);
    } catch (error) {
      console.error('Error selecting language:', error);
      toast.error('Failed to update active language');
    } finally {
      setUpdatingLanguage(null);
    }
  };
  
  if (loading) {
    return <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>;
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="grid gap-6">
        {/* Personal Settings */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Personal Settings</h2>
          
          {/* Add OnboardingSettings component at the top */}
          <OnboardingSettings />
          
          <Card className="gradient-card animate-fade-in">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <User className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Your Profile
              </CardTitle>
              <CardDescription>
                Personalize your account
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center sm:items-start sm:flex-row gap-4 sm:gap-6 pt-2">
              <AvatarUpload />
              <div className="w-full">
                <Separator className="my-4 sm:hidden" />
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 text-center sm:text-left">
                  Your profile picture will be displayed throughout the application and helps personalize your experience.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="gradient-card animate-fade-in">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Moon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the appearance of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center justify-between">
                <ThemeToggle showLabel={true} />
                <p className="text-xs text-muted-foreground">
                  {theme === 'dark' ? 'Dark mode is enabled' : 'Light mode is enabled'}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="gradient-card animate-fade-in">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl">Learning Languages</CardTitle>
              <CardDescription>
                Select the languages you want to learn
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-3 sm:space-y-4">
                {availableLanguages.map(language => <div key={language} className="flex items-center space-x-2">
                    <Checkbox id={`language-${language}`} checked={settings.learningLanguages.includes(language)} onCheckedChange={checked => handleLanguageToggle(language, checked as boolean)} disabled={updatingLanguage === language || settings.learningLanguages.length === 1 && settings.learningLanguages.includes(language)} />
                    <Label htmlFor={`language-${language}`} className="capitalize text-sm sm:text-base flex items-center">
                      <span className="mr-2">{getLanguageFlag(language)}</span>
                      {language}
                      {updatingLanguage === language && <Loader2 className="h-3 w-3 animate-spin ml-2 inline" />}
                    </Label>
                  </div>)}
              </div>
            </CardContent>
          </Card>
          
          <Card className="gradient-card animate-fade-in">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl">Active Language</CardTitle>
              <CardDescription>
                Choose your active language for practicing
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <RadioGroup value={settings.selectedLanguage} onValueChange={value => handleLanguageSelect(value as Language)}>
                {settings.learningLanguages.map(language => <div key={language} className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value={language} id={`active-${language}`} disabled={updatingLanguage === language} />
                    <Label htmlFor={`active-${language}`} className={`capitalize text-sm sm:text-base flex items-center ${settings.selectedLanguage === language ? 'font-medium text-primary' : ''}`}>
                      <span className="mr-2">{getLanguageFlag(language)}</span>
                      {language}
                      {updatingLanguage === language && <Loader2 className="h-3 w-3 animate-spin ml-2 inline" />}
                    </Label>
                  </div>)}
              </RadioGroup>
              
              <p className="text-xs sm:text-sm text-muted-foreground mt-4">
                Your active language determines which exercises and vocabulary items are displayed throughout the app.
                You can also quickly switch languages by clicking the language flag in the header.
              </p>
              
              <ResetLanguageProgress />
            </CardContent>
          </Card>
          
          <Card className="gradient-card animate-fade-in">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Mail className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Feedback
              </CardTitle>
              <CardDescription>
                Share your thoughts and suggestions
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <FeedbackForm />
              <div className="mt-4 text-xs text-muted-foreground">Your feedback helps us improve!</div>
            </CardContent>
          </Card>
          
          <Card className="gradient-card animate-fade-in">
            
          </Card>
        </div>
        
        {/* ... keep existing sections */}
      </div>
    </div>
  );
};

export default SettingsPage;
