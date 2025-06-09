
import React from 'react';
import { FlagIcon } from 'react-flag-kit';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getLanguageFlagCode } from '@/utils/languageUtils';

interface LanguageOption {
  value: string;
  label: string;
  flagCode?: string;
}

interface LanguageSelectWithFlagProps {
  value: string;
  onValueChange: (value: string) => void;
  options: LanguageOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const LanguageSelectWithFlag: React.FC<LanguageSelectWithFlagProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Select a language",
  disabled = false,
  className = ""
}) => {
  const selectedOption = options.find(option => option.value === value);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {selectedOption && (
            <div className="flex items-center gap-2">
              <FlagIcon 
                code={getLanguageFlagCode(selectedOption.value)} 
                size={16} 
              />
              <span>{selectedOption.label}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              <FlagIcon 
                code={getLanguageFlagCode(option.value)} 
                size={16} 
              />
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
