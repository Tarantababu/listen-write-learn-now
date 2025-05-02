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
import { Loader2, Settings, Mail, User } from 'lucide-react';
import FeedbackForm from '@/components/FeedbackForm';
import AvatarUpload from '@/components/AvatarUpload';
import { Separator } from '@/components/ui/separator';
const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    selectLanguage,
    addLearningLanguage,
    removeLearningLanguage,
    loading
  } = useUserSettingsContext();
  const availableLanguages: Language[] = ['english', 'german'];
  const [updatingLanguage, setUpdatingLanguage] = useState<string | null>(null);
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
    return <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>;
  }
  return <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent flex items-center">
          <Settings className="mr-2 h-6 w-6" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Customize your learning experience
        </p>
      </div>
      
      <div className="space-y-6">
        <Card className="gradient-card animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Your Profile
            </CardTitle>
            <CardDescription>
              Personalize your account
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center sm:items-start sm:flex-row gap-6">
            <AvatarUpload />
            <div className="w-full">
              <Separator className="my-4 sm:hidden" />
              <p className="text-sm text-muted-foreground mb-4">
                Your profile picture will be displayed throughout the application and helps personalize your experience.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="gradient-card animate-fade-in">
          <CardHeader>
            <CardTitle>Learning Languages</CardTitle>
            <CardDescription>
              Select the languages you want to learn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availableLanguages.map(language => <div key={language} className="flex items-center space-x-2">
                  <Checkbox id={`language-${language}`} checked={settings.learningLanguages.includes(language)} onCheckedChange={checked => handleLanguageToggle(language, checked as boolean)} disabled={updatingLanguage === language || settings.learningLanguages.length === 1 && settings.learningLanguages.includes(language)} />
                  <Label htmlFor={`language-${language}`} className="capitalize">
                    {language}
                    {updatingLanguage === language && <Loader2 className="h-3 w-3 animate-spin ml-2 inline" />}
                  </Label>
                </div>)}
            </div>
            
            <Alert className="mt-4">
              <AlertTitle>Want more languages?</AlertTitle>
              <AlertDescription>
                This application is designed to easily add new languages. Currently, English and German are supported.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
        
        <Card className="gradient-card animate-fade-in">
          <CardHeader>
            <CardTitle>Active Language</CardTitle>
            <CardDescription>
              Choose your active language for practicing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={settings.selectedLanguage} onValueChange={value => handleLanguageSelect(value as Language)}>
              {settings.learningLanguages.map(language => <div key={language} className="flex items-center space-x-2">
                  <RadioGroupItem value={language} id={`active-${language}`} disabled={updatingLanguage === language} />
                  <Label htmlFor={`active-${language}`} className="capitalize">
                    {language}
                    {updatingLanguage === language && <Loader2 className="h-3 w-3 animate-spin ml-2 inline" />}
                  </Label>
                </div>)}
            </RadioGroup>
            
            <p className="text-sm text-muted-foreground mt-4">
              Your active language determines which exercises and vocabulary items are displayed throughout the app.
            </p>
          </CardContent>
        </Card>
        
        <Card className="gradient-card animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              Feedback
            </CardTitle>
            <CardDescription>
              Share your thoughts and suggestions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FeedbackForm />
            <div className="mt-4 text-xs text-muted-foreground">Your feedback helps us improve!</div>
          </CardContent>
        </Card>
        
        <Card className="gradient-card animate-fade-in">
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>
              Application information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">ListenWriteLearn</h3>
              <p className="text-sm text-muted-foreground">
                Version 1.0.0
              </p>
            </div>
            <p className="text-sm">
              Improve your language skills with the dictation method. 
              Listen to exercises, write what you hear, and build your vocabulary.
            </p>
            <div className="pt-4">
              <Button variant="outline">
                Visit Support Site
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default SettingsPage;