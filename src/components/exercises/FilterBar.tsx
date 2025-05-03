
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Language } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { getLanguageFlag } from '@/utils/languageUtils';

interface FilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  allTags: string[];
  allLanguages: string[];
  selectedLanguage?: string | null;
  setSelectedLanguage?: (language: string | null) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  selectedTag,
  setSelectedTag,
  allTags,
  allLanguages,
  selectedLanguage,
  setSelectedLanguage
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col gap-3 mb-4 sm:mb-6">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search exercises..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <div className="flex flex-col sm:flex-row w-full gap-3">
        <Select
          value={selectedLanguage || "all-languages"}
          onValueChange={(value) => {
            if (setSelectedLanguage) {
              setSelectedLanguage(value === "all-languages" ? null : value);
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Languages" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all-languages">All Languages</SelectItem>
              {allLanguages.map(lang => (
                <SelectItem key={lang} value={lang}>
                  {getLanguageFlag(lang as Language)} {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        
        <Select
          value={selectedTag || "all-tags"}
          onValueChange={(value) => setSelectedTag(value === "all-tags" ? null : value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all-tags">All Tags</SelectItem>
              {allTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FilterBar;
