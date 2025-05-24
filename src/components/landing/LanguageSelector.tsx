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
  { name: 'english', code: 'GB' },
  { name: 'spanish', code: 'ES' }, 
  { name: 'french', code: 'FR' },
  { name: 'german', code: 'DE' },
  { name: 'italian', code: 'IT' },
  { name: 'portuguese', code: 'PT' },
  { name: 'dutch', code: 'NL' },
  { name: 'turkish', code: 'TR' },
  { name: 'swedish', code: 'SE' },
  { name: 'norwegian', code: 'NO' }
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
            key={language.name}
            onClick={() => handleLanguageSelect(language.name)}
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50"
          >
            <FlagIcon code={language.code} size={18} />
            <span className="capitalize">{language.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}