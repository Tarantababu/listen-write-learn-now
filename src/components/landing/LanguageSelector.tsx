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
import { FlagIcon, FlagIconCode } from 'react-flag-kit';

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
          className="border-brand-primary text-brand-primary hover:bg-brand-primary/10 hover:border-brand-primary/70 flex items-center gap-2 transition-all duration-200 hover:shadow-md hover:scale-105"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">Language</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto bg-white rounded-2xl shadow-xl border-0 p-2 mt-2 animate-in slide-in-from-top-2 duration-200">
        <div className="text-sm text-gray-500 px-3 py-2 font-medium border-b border-gray-100 mb-1">I want to learn</div>
        {AVAILABLE_LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.name}
            onClick={() => handleLanguageSelect(language.name.toLowerCase())}
            className="flex items-center gap-3 cursor-pointer hover:bg-blue-50 rounded-xl px-3 py-2.5 mx-1 transition-all duration-150 hover:scale-[1.02] hover:shadow-sm group"
          >
            <div className="w-6 h-4 overflow-hidden flex-shrink-0 shadow-sm ring-1 ring-gray-200 group-hover:ring-blue-300 transition-all duration-150 flex items-center justify-center">
              <FlagIcon code={language.code} size={24} />
            </div>
            <span className="text-gray-900 font-medium group-hover:text-blue-900 transition-colors duration-150">{language.name}</span>
            {selectedLanguage.toLowerCase() === language.name.toLowerCase() && (
              <div className="ml-auto w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center animate-in zoom-in-50 duration-200">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
              </div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}