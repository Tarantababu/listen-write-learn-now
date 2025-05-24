
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
import { getLanguageFlag } from '@/utils/languageUtils';

const AVAILABLE_LANGUAGES = [
  'english',
  'spanish', 
  'french',
  'german',
  'italian',
  'portuguese',
  'dutch',
  'russian',
  'chinese',
  'japanese',
  'korean',
  'arabic',
  'turkish',
  'swedish',
  'norwegian',
  'danish',
  'finnish',
  'greek',
  'polish',
  'czech',
  'hungarian',
  'romanian',
  'bulgarian',
  'croatian',
  'serbian',
  'slovak',
  'slovenian',
  'estonian',
  'latvian',
  'lithuanian',
  'ukrainian',
  'belarusian',
  'moldovan',
  'albanian',
  'macedonian',
  'bosnian',
  'montenegrin'
];

export function LanguageSelector() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
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
      <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto bg-white z-50">
        {AVAILABLE_LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language}
            onClick={() => handleLanguageSelect(language)}
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50"
          >
            <span className="text-lg">{getLanguageFlag(language)}</span>
            <span className="capitalize">{language}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
