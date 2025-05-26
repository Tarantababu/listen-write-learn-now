import React from 'react';
import { FlagIcon, FlagIconCode } from 'react-flag-kit';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { getLanguageFlagCode } from '@/utils/languageUtils';
import { toast } from 'sonner';
import { Check } from 'lucide-react';

const AVAILABLE_LANGUAGES = [
  { name: 'English', code: 'GB' as FlagIconCode },
  { name: 'Spanish', code: 'ES' as FlagIconCode },
  { name: 'French', code: 'FR' as FlagIconCode },
  { name: 'German', code: 'DE' as FlagIconCode },
  { name: 'Italian', code: 'IT' as FlagIconCode },
  { name: 'Portuguese', code: 'PT' as FlagIconCode },
  { name: 'Dutch', code: 'NL' as FlagIconCode },
  { name: 'Turkish', code: 'TR' as FlagIconCode },
  { name: 'Swedish', code: 'SE' as FlagIconCode },
  { name: 'Norwegian', code: 'NO' as FlagIconCode }
];

export function LanguageSelectionDropdown() {
  const { settings, selectLanguage, addLearningLanguage } = useUserSettingsContext();
  
  const currentLanguageFlagCode = getLanguageFlagCode(settings.selectedLanguage);
  
  const handleLanguageSelect = async (languageName: string) => {
    const languageKey = languageName.toLowerCase();
    try {
      await selectLanguage(languageKey as any);
      toast.success(`Switched to ${languageName}`, {
        description: `Active language changed to ${languageName}`
      });
    } catch (error) {
      console.error('Error switching language:', error);
      toast.error('Failed to switch language');
    }
  };

  const handleAddLanguage = async (languageName: string) => {
    const languageKey = languageName.toLowerCase();
    try {
      await addLearningLanguage(languageKey as any);
      toast.success(`Added ${languageName}`, {
        description: `${languageName} has been added to your learning languages`
      });
    } catch (error) {
      console.error('Error adding language:', error);
      toast.error('Failed to add language');
    }
  };

  const currentLanguages = settings.learningLanguages.map(lang => 
    lang.charAt(0).toUpperCase() + lang.slice(1)
  );

  const availableToAdd = AVAILABLE_LANGUAGES.filter(lang => 
    !currentLanguages.includes(lang.name)
  );

  const currentLanguageDisplay = AVAILABLE_LANGUAGES.find(lang => 
    lang.name.toLowerCase() === settings.selectedLanguage
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="flex items-center justify-center h-8 w-8 animate-fade-in hover:scale-110 transition-transform rounded-full hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Language selection"
        >
          <FlagIcon code={currentLanguageFlagCode} size={24} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="text-sm font-semibold uppercase tracking-wide text-muted-foreground px-3 py-2">
          Change Learning Language
        </DropdownMenuLabel>
        
        {/* Current active language */}
        {currentLanguageDisplay && (
          <DropdownMenuItem
            onClick={() => handleLanguageSelect(currentLanguageDisplay.name)}
            className="flex items-center justify-between px-3 py-2 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FlagIcon code={currentLanguageDisplay.code} size={20} />
              <span className="font-medium">{currentLanguageDisplay.name}</span>
            </div>
            <Check className="h-4 w-4 text-primary" />
          </DropdownMenuItem>
        )}

        {/* Other learning languages */}
        {AVAILABLE_LANGUAGES
          .filter(lang => 
            currentLanguages.includes(lang.name) && 
            lang.name.toLowerCase() !== settings.selectedLanguage
          )
          .map((language) => (
            <DropdownMenuItem
              key={language.name}
              onClick={() => handleLanguageSelect(language.name)}
              className="flex items-center gap-3 px-3 py-2 cursor-pointer"
            >
              <FlagIcon code={language.code} size={20} />
              <span className="font-medium">{language.name}</span>
            </DropdownMenuItem>
          ))}

        {availableToAdd.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-sm font-semibold uppercase tracking-wide text-muted-foreground px-3 py-2">
              Add a New Learning Language
            </DropdownMenuLabel>
            
            {availableToAdd.map((language) => (
              <DropdownMenuItem
                key={language.name}
                onClick={() => handleAddLanguage(language.name)}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer"
              >
                <FlagIcon code={language.code} size={20} />
                <span className="font-medium">{language.name}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
