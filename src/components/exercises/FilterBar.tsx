
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Language } from '@/types';

interface FilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  allTags: string[];
  allLanguages: string[];
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  selectedTag,
  setSelectedTag,
  allTags,
  allLanguages
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search exercises..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <div className="w-full md:w-48">
        <select
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value="all-languages"
          onChange={() => {}}
        >
          <option value="all-languages">All Languages</option>
          {allLanguages.map(lang => (
            <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
          ))}
        </select>
      </div>
      
      <div className="w-full md:w-48">
        <select
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={selectedTag || ''}
          onChange={(e) => setSelectedTag(e.target.value || null)}
        >
          <option value="">All Tags</option>
          {allTags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FilterBar;
