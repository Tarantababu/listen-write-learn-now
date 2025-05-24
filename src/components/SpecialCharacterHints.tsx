
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HelpCircle } from 'lucide-react';
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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <HelpCircle className="h-3 w-3 mr-1" />
          Special Characters
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Special Character Shortcuts</h4>
          <p className="text-xs text-muted-foreground">
            Type these shortcuts while writing to get special characters:
          </p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between p-1 rounded bg-muted/30">
                <span className="font-mono text-primary">{shortcut.shortcut}</span>
                <span className="mx-1">→</span>
                <span className="font-semibold">{shortcut.character}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Shortcuts are applied automatically as you type.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SpecialCharacterHints;
