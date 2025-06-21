
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

  // Group shortcuts by type for better organization
  const groupShortcuts = (shortcuts: SpecialCharacterShortcut[]) => {
    const groups = {
      accents: shortcuts.filter(s => s.shortcut.includes('++') || s.shortcut.includes('`') || s.shortcut.includes('^^')),
      diacritics: shortcuts.filter(s => s.shortcut.includes('::') || s.shortcut.includes('~~') || s.shortcut.includes(',,')),
      punctuation: shortcuts.filter(s => ['<<', '>>', '??', '!!', '""', "''", ',,', '..'].includes(s.shortcut)),
      other: shortcuts.filter(s => 
        !s.shortcut.includes('++') && 
        !s.shortcut.includes('`') && 
        !s.shortcut.includes('^^') &&
        !s.shortcut.includes('::') && 
        !s.shortcut.includes('~~') && 
        !s.shortcut.includes(',,') &&
        !['<<', '>>', '??', '!!', '""', "''", ',,', '..'].includes(s.shortcut)
      )
    };
    
    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  };

  const groupedShortcuts = groupShortcuts(shortcuts);

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
              Special Character Shortcuts
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Type these shortcuts while writing to get special characters automatically:
            </p>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {groupedShortcuts.map(([groupName, groupShortcuts]) => (
              <div key={groupName} className="space-y-2">
                <h5 className="text-xs font-medium text-muted-foreground capitalize border-b pb-1">
                  {groupName === 'accents' && '✦ Accents & Grave'}
                  {groupName === 'diacritics' && '◈ Diacritics & Special'}
                  {groupName === 'punctuation' && '※ Punctuation'}
                  {groupName === 'other' && '◦ Other'}
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
            <p className="font-medium">💡 Tips:</p>
            <p>• Double symbols (++) for acute accents: e++ → é</p>
            <p>• Double colons (::) for umlauts: o:: → ö</p>
            <p>• Backtick (`) for grave accents: e` → è</p>
            <p>• Now conflict-free with contractions like "po'"!</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SpecialCharacterHints;
