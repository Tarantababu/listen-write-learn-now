import React from 'react';
import { FlagIcon, FlagIconCode } from 'react-flag-kit';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  { name: 'Norwegian', code: 'NO' as FlagIconCode },
  { name: 'Danish', code: 'DK' as FlagIconCode },
  { name: 'Finnish', code: 'FI' as FlagIconCode },
  { name: 'Icelandic', code: 'IS' as FlagIconCode },
  { name: 'Russian', code: 'RU' as FlagIconCode },
  { name: 'Polish', code: 'PL' as FlagIconCode },
  { name: 'Czech', code: 'CZ' as FlagIconCode },
  { name: 'Slovak', code: 'SK' as FlagIconCode },
  { name: 'Hungarian', code: 'HU' as FlagIconCode },
  { name: 'Romanian', code: 'RO' as FlagIconCode },
  { name: 'Chinese', code: 'CN' as FlagIconCode },
  { name: 'Japanese', code: 'JP' as FlagIconCode },
  { name: 'Korean', code: 'KR' as FlagIconCode },
  { name: 'Arabic', code: 'SA' as FlagIconCode }
];

export function LanguageSelectionDropdown() {
  const { settings, selectLanguage, addLearningLanguage } = useUserSettingsContext();
  
  const currentLanguageFlagCode = getLanguageFlagCode(settings.selectedLanguage);
  
  const handleLanguageSelect = async (languageName: string) => {
    const languageKey = languageName.toLowerCase();
    try {
      await selectLanguage(languageKey as any);
      toast.success(`Switched to ${languageName}`, {
        description: `Active language changed to ${languageName}. Special character shortcuts are now available!`
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
        description: `${languageName} has been added to your learning languages with special character support`
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

  // Group languages by region for better organization
  const europeanLanguages = AVAILABLE_LANGUAGES.filter(lang => 
    ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Icelandic', 'Russian', 'Polish', 'Czech', 'Slovak', 'Hungarian', 'Romanian', 'Turkish'].includes(lang.name)
  );
  
  const asianLanguages = AVAILABLE_LANGUAGES.filter(lang => 
    ['Chinese', 'Japanese', 'Korean'].includes(lang.name)
  );
  
  const otherLanguages = AVAILABLE_LANGUAGES.filter(lang => 
    ['Arabic'].includes(lang.name)
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
            className="flex items-center justify-between px-3 py-2 cursor-pointer bg-primary/10"
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
            
            {/* European Languages */}
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-3 py-1 opacity-70">
              European Languages
            </DropdownMenuLabel>
            {availableToAdd.filter(lang => europeanLanguages.includes(lang)).map((language) => (
              <DropdownMenuItem
                key={language.name}
                onClick={() => handleAddLanguage(language.name)}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer"
              >
                <FlagIcon code={language.code} size={20} />
                <span className="font-medium">{language.name}</span>
              </DropdownMenuItem>
            ))}
            
            {/* Asian Languages */}
            {availableToAdd.some(lang => asianLanguages.includes(lang)) && (
              <>
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-3 py-1 opacity-70 mt-2">
                  Asian Languages
                </DropdownMenuLabel>
                {availableToAdd.filter(lang => asianLanguages.includes(lang)).map((language) => (
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
            
            {/* Other Languages */}
            {availableToAdd.some(lang => otherLanguages.includes(lang)) && (
              <>
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-3 py-1 opacity-70 mt-2">
                  Other Languages
                </DropdownMenuLabel>
                {availableToAdd.filter(lang => otherLanguages.includes(lang)).map((language) => (
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
          </>
        )}
        
        <DropdownMenuSeparator />
        <div className="px-3 py-2 text-xs text-muted-foreground">
          <p className="font-medium mb-1">✨ Enhanced Features:</p>
          <p>• Smart special character shortcuts</p>
          <p>• Language-specific punctuation</p>
          <p>• Cultural writing conventions</p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
