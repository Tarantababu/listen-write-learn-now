import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, ChevronDown } from 'lucide-react';
import { FlagIcon } from 'react-flag-kit';

const AVAILABLE_LANGUAGES = [
  { name: 'English', code: 'GB' },
  { name: 'Spanish', code: 'ES' },
  { name: 'French', code: 'FR' },
  { name: 'German', code: 'DE' },
  { name: 'Italian', code: 'IT' },
  { name: 'Portuguese', code: 'PT' },
  { name: 'Dutch', code: 'NL' },
  { name: 'Turkish', code: 'TR' },
  { name: 'Swedish', code: 'SE' },
  { name: 'Norwegian', code: 'NO' }
];

export function LanguageSelector() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const navigate = useNavigate();

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    // Redirect to signup with language parameter
    navigate(`/signup?lang=${encodeURIComponent(language)}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-brand-primary text-brand-primary hover:bg-brand-primary/10 flex items-center gap-2"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">Language</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto bg-white rounded-2xl shadow-lg border-0 p-2 mt-2">
        <div className="text-sm text-gray-500 px-3 py-2 font-medium">Site Language</div>
        {AVAILABLE_LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.name}
            onClick={() => handleLanguageSelect(language.name.toLowerCase())}
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-xl px-3 py-2.5 mx-1"
          >
            <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
              <FlagIcon code={language.code} size={20} />
            </div>
            <span className="text-gray-900 font-medium">{language.name}</span>
            {selectedLanguage.toLowerCase() === language.name.toLowerCase() && (
              <div className="ml-auto w-4 h-4 rounded-full border-2 border-blue-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              </div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}