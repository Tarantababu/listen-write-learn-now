
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HelpCircle, Zap } from 'lucide-react';
import { getLanguageShortcuts, SpecialCharacterShortcut } from '@/utils/specialCharacters';

interface SpecialCharacterHintsProps {
  language: string;
}

const SpecialCharacterHints: React.FC<SpecialCharacterHintsProps> = ({ language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const shortcuts = getLanguageShortcuts(language);
  
  if (shortcuts.length === 0) {
    return null;
  }

  // Enhanced grouping logic for better organization
  const groupShortcuts = (shortcuts: SpecialCharacterShortcut[]) => {
    const groups = {
      accents: shortcuts.filter(s => 
        s.shortcut.includes('++') || 
        s.shortcut.includes('`') || 
        s.shortcut.includes('^^')
      ),
      diacritics: shortcuts.filter(s => 
        s.shortcut.includes('::') || 
        s.shortcut.includes('~~') || 
        s.shortcut.includes(',,') ||
        s.shortcut.includes('..')
      ),
      punctuation: shortcuts.filter(s => 
        ['<<', '>>', '??', '!!', '""', "''", ',,', '..', '--', ';;', '::', '((', '))', '**'].some(punct => s.shortcut === punct) ||
        s.shortcut.includes('"') ||
        s.shortcut.includes("'")
      ),
      letters: shortcuts.filter(s => 
        s.shortcut.includes('/') ||
        ['aa', 'oo', 'uu', 'AA', 'OO', 'UU', 'ij++', 'IJ++', 'ae++', 'AE++', 'oe++', 'OE++', 'th++', 'TH++', 'zh++', 'ch++', 'sh++', 'sch++', 'yu++', 'ya++', 'yo++', 'eh++', 'sb++', 'hb++'].includes(s.shortcut)
      ),
      cyrillic: shortcuts.filter(s => 
        language.toLowerCase() === 'russian' && 
        (s.shortcut.length === 3 && s.shortcut.endsWith('++')) &&
        !['<<', '>>', 'sb++', 'hb++', 'yo++', 'zh++', 'ch++', 'sh++', 'sch++', 'yu++', 'ya++', 'eh++'].includes(s.shortcut)
      ),
      other: shortcuts.filter(s => 
        !s.shortcut.includes('++') && 
        !s.shortcut.includes('`') && 
        !s.shortcut.includes('^^') &&
        !s.shortcut.includes('::') && 
        !s.shortcut.includes('~~') && 
        !s.shortcut.includes(',,') &&
        !s.shortcut.includes('..') &&
        !s.shortcut.includes('/') &&
        !['<<', '>>', '??', '!!', '""', "''", ',,', '..', '--', ';;', '::', '((', '))', '**', 'aa', 'oo', 'uu', 'AA', 'OO', 'UU', 'ij++', 'IJ++', 'ae++', 'AE++', 'oe++', 'OE++', 'th++', 'TH++'].includes(s.shortcut) &&
        !(language.toLowerCase() === 'russian' && s.shortcut.length === 3 && s.shortcut.endsWith('++')) &&
        !s.shortcut.includes('"') &&
        !s.shortcut.includes("'")
      )
    };
    
    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  };

  const groupedShortcuts = groupShortcuts(shortcuts);

  const getGroupIcon = (groupName: string) => {
    switch (groupName) {
      case 'accents': return '◆';
      case 'diacritics': return '◈';
      case 'punctuation': return '※';
      case 'letters': return '◉';
      case 'cyrillic': return '◎';
      case 'other': return '◦';
      default: return '◦';
    }
  };

  const getGroupLabel = (groupName: string) => {
    switch (groupName) {
      case 'accents': return 'Accents & Circumflex';
      case 'diacritics': return 'Diacritics & Marks';
      case 'punctuation': return 'Punctuation & Quotes';
      case 'letters': return 'Special Letters';
      case 'cyrillic': return 'Cyrillic Letters';
      case 'other': return 'Other Characters';
      default: return groupName.charAt(0).toUpperCase() + groupName.slice(1);
    }
  };

  const getLanguageDisplayName = (lang: string) => {
    const displayNames: Record<string, string> = {
      'german': 'German',
      'french': 'French',
      'spanish': 'Spanish',
      'portuguese': 'Portuguese',
      'italian': 'Italian',
      'dutch': 'Dutch',
      'turkish': 'Turkish',
      'swedish': 'Swedish',
      'norwegian': 'Norwegian',
      'danish': 'Danish',
      'finnish': 'Finnish',
      'icelandic': 'Icelandic',
      'russian': 'Russian',
      'polish': 'Polish',
      'czech': 'Czech',
      'slovak': 'Slovak',
      'hungarian': 'Hungarian',
      'romanian': 'Romanian',
      'chinese': 'Chinese',
      'japanese': 'Japanese',
      'korean': 'Korean',
      'arabic': 'Arabic',
      'english': 'English'
    };
    return displayNames[lang.toLowerCase()] || lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Zap className="h-3 w-3 mr-1" />
          Special Characters ({shortcuts.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4" align="start">
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              {getLanguageDisplayName(language)} Special Characters
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Type these shortcuts while writing to get special characters automatically:
            </p>
          </div>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {groupedShortcuts.map(([groupName, groupShortcuts]) => (
              <div key={groupName} className="space-y-2">
                <h5 className="text-xs font-medium text-muted-foreground capitalize border-b pb-1 flex items-center gap-1">
                  <span className="text-primary">{getGroupIcon(groupName)}</span>
                  {getGroupLabel(groupName)}
                </h5>
                <div className="grid grid-cols-2 gap-1">
                  {groupShortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/20 hover:bg-muted/40 transition-colors">
                      <span className="font-mono text-xs text-blue-600 font-medium">{shortcut.shortcut}</span>
                      <span className="mx-1 text-xs text-muted-foreground">→</span>
                      <span className="text-lg font-semibold">{shortcut.character}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-xs text-muted-foreground pt-2 border-t space-y-1">
            <p className="font-medium">💡 Quick Reference:</p>
            <p>• Double plus (++) for acute accents: a++ → á</p>
            <p>• Double colons (::) for umlauts/diaeresis: o:: → ö</p>
            <p>• Backtick (`) for grave accents: e` → è</p>
            <p>• Circumflex (^^) for ô, â, etc.: a^^ → â</p>
            <p>• Tilde (~~) for ñ, ã, etc.: n~~ → ñ</p>
            <p>• Comma (,,) for cedilla: c,, → ç</p>
            <p>• Angle brackets for quotes: << → « or „</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SpecialCharacterHints;
