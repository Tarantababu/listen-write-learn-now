
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface StandardFilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedFilter?: string | null;
  setSelectedFilter?: (filter: string | null) => void;
  filterOptions?: { value: string; label: string }[];
  filterPlaceholder?: string;
  searchPlaceholder?: string;
  showSelectedFilter?: boolean;
}

export const StandardFilterBar: React.FC<StandardFilterBarProps> = React.memo(({
  searchTerm,
  setSearchTerm,
  selectedFilter,
  setSelectedFilter,
  filterOptions = [],
  filterPlaceholder = "All items",
  searchPlaceholder = "Search...",
  showSelectedFilter = true
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-4 px-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Filter Dropdown */}
        {filterOptions.length > 0 && setSelectedFilter && (
          <Select value={selectedFilter || 'all'} onValueChange={(value) => setSelectedFilter(value === 'all' ? null : value)}>
            <SelectTrigger className="h-12 text-base">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder={filterPlaceholder} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{filterPlaceholder}</SelectItem>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Selected Filter Display */}
        {showSelectedFilter && selectedFilter && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm py-1 px-3">
              {filterOptions.find(opt => opt.value === selectedFilter)?.label || selectedFilter}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-2 hover:bg-transparent"
                onClick={() => setSelectedFilter && setSelectedFilter(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          </div>
        )}
      </div>
    );
  }

  // Desktop version
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      {filterOptions.length > 0 && setSelectedFilter && (
        <Select value={selectedFilter || 'all'} onValueChange={(value) => setSelectedFilter(value === 'all' ? null : value)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder={filterPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{filterPlaceholder}</SelectItem>
            {filterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
});

StandardFilterBar.displayName = 'StandardFilterBar';
