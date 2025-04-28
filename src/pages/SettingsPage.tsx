
import React from 'react';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Language } from '@/types';

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, selectLanguage, addLearningLanguage, removeLearningLanguage } = useUserSettingsContext();
  
  const availableLanguages: Language[] = ['english', 'german'];
  
  const handleLanguageToggle = (language: Language, isChecked: boolean) => {
    if (isChecked) {
      addLearningLanguage(language);
      toast.success(`Added ${language} to your learning languages`);
    } else {
      removeLearningLanguage(language);
      toast.success(`Removed ${language} from your learning languages`);
    }
  };
  
  const handleLanguageSelect = (language: Language) => {
    selectLanguage(language);
    toast.success(`Selected ${language} as your active language`);
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Customize your learning experience
        </p>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Learning Languages</CardTitle>
            <CardDescription>
              Select the languages you want to learn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availableLanguages.map(language => (
                <div key={language} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`language-${language}`}
                    checked={settings.learningLanguages.includes(language)}
                    onCheckedChange={(checked) => 
                      handleLanguageToggle(language, checked as boolean)
                    }
                    disabled={
                      settings.learningLanguages.length === 1 && 
                      settings.learningLanguages.includes(language)
                    }
                  />
                  <Label htmlFor={`language-${language}`} className="capitalize">
                    {language}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Language</CardTitle>
            <CardDescription>
              Choose your active language for practicing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={settings.selectedLanguage} 
              onValueChange={(value) => handleLanguageSelect(value as Language)}
            >
              {settings.learningLanguages.map(language => (
                <div key={language} className="flex items-center space-x-2">
                  <RadioGroupItem value={language} id={`active-${language}`} />
                  <Label htmlFor={`active-${language}`} className="capitalize">
                    {language}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
        
        <Card>
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
    </div>
  );
};

export default SettingsPage;
