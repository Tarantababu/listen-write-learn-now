
import React, { useState } from 'react';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import VocabularyCard from '@/components/VocabularyCard';
import VocabularyPlaylist from '@/components/VocabularyPlaylist';
import { VocabularyItem } from '@/types';
import { toast } from 'sonner';
import { FileDown, Info } from 'lucide-react';
import { downloadAnkiImport } from '@/utils/ankiExport';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const VocabularyPage: React.FC = () => {
  const { vocabulary, removeVocabularyItem } = useVocabularyContext();
  const { settings } = useUserSettingsContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<VocabularyItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest'|'oldest'|'alphabetical'>('newest');
  
  // Filter vocabulary by current language and search term
  const filteredVocabulary = vocabulary
    .filter(item => item.language === settings.selectedLanguage)
    .filter(item => {
      if (!searchTerm) return true;
      
      const search = searchTerm.toLowerCase();
      return (
        item.word.toLowerCase().includes(search) ||
        item.definition.toLowerCase().includes(search) ||
        item.exampleSentence.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      if (sortOrder === 'alphabetical') {
        return a.word.localeCompare(b.word);
      } else if (sortOrder === 'oldest') {
        return a.id.localeCompare(b.id);
      } else {
        // newest first is default
        return b.id.localeCompare(a.id);
      }
    });
  
  const handleDeleteItem = (item: VocabularyItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (itemToDelete) {
      removeVocabularyItem(itemToDelete.id);
      toast.success('Vocabulary item removed');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      // Also remove from selected items if present
      setSelectedItems(prev => prev.filter(id => id !== itemToDelete.id));
    }
  };
  
  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  
  const handleExportAnki = async () => {
    try {
      setIsExporting(true);
      
      // If no items are selected, export all filtered items
      const itemsToExport = selectedItems.length > 0
        ? filteredVocabulary.filter(item => selectedItems.includes(item.id))
        : filteredVocabulary;
        
      if (itemsToExport.length === 0) {
        toast.error('No vocabulary items to export');
        return;
      }
      
      await downloadAnkiImport(
        itemsToExport, 
        `${settings.selectedLanguage}_vocabulary_${new Date().toISOString().split('T')[0]}`
      );
      
      toast.success(
        <div className="flex flex-col gap-1">
          <div>Vocabulary exported successfully</div>
          <div className="text-sm font-light">Follow the README.txt file in the ZIP for import instructions</div>
        </div>
      );
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export vocabulary');
    } finally {
      setIsExporting(false);
    }
  };
  
  const selectAll = () => {
    setSelectedItems(filteredVocabulary.map(item => item.id));
  };
  
  const deselectAll = () => {
    setSelectedItems([]);
  };
  
  // Since we don't have actual vocabulary items in the demo, let's create some examples
  const demoVocabulary: VocabularyItem[] = [
    {
      id: '1',
      word: 'Serendipity',
      definition: 'The occurrence and development of events by chance in a happy or beneficial way.',
      exampleSentence: 'The discovery was a perfect example of serendipity.',
      language: 'english',
      exerciseId: '1'
    },
    {
      id: '2',
      word: 'Ephemeral',
      definition: 'Lasting for a very short time.',
      exampleSentence: 'The ephemeral nature of fashion trends is well known.',
      language: 'english',
      exerciseId: '1'
    },
    {
      id: '3',
      word: 'Zeitgeist',
      definition: 'The defining spirit or mood of a particular period of history as shown by the ideas and beliefs of the time.',
      exampleSentence: 'The series captured the zeitgeist of the early 2000s.',
      language: 'german',
      exerciseId: '2'
    }
  ];
  
  // Use demo vocabulary if there are no real items
  const displayVocabulary = vocabulary.length > 0 ? filteredVocabulary : 
    demoVocabulary.filter(item => item.language === settings.selectedLanguage);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Vocabulary</h1>
        <p className="text-muted-foreground">
          Review and manage your saved vocabulary items
        </p>
      </div>
      
      {/* Add the Vocabulary Playlist component */}
      <VocabularyPlaylist vocabularyItems={displayVocabulary} />
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search vocabulary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="w-full md:w-48">
          <Select
            value={sortOrder}
            onValueChange={(value) => setSortOrder(value as 'newest'|'oldest'|'alphabetical')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm"
            onClick={selectAll}
            className="whitespace-nowrap"
            disabled={displayVocabulary.length === 0}
          >
            Select All
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={deselectAll}
            className="whitespace-nowrap"
            disabled={selectedItems.length === 0}
          >
            Deselect All
          </Button>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleExportAnki}
                  disabled={isExporting || displayVocabulary.length === 0}
                  className="whitespace-nowrap bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  {isExporting ? "Exporting..." : "Export Vocabulary"}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Exports a ZIP file containing a text file for Anki import and audio files (if available)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="mb-4 text-sm text-muted-foreground">
        {selectedItems.length > 0 ? (
          <p>{selectedItems.length} of {displayVocabulary.length} items selected</p>
        ) : (
          <p>Select items to export or use the Export button to export all visible items</p>
        )}
      </div>
      
      {displayVocabulary.length === 0 ? (
        <div className="text-center py-12 gradient-card rounded-lg">
          <p className="text-lg mb-2">Your vocabulary list is empty</p>
          <p className="text-muted-foreground mb-4">
            Practice exercises and save words to build your vocabulary
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayVocabulary.map(item => (
            <div key={item.id} className="relative">
              <div className="absolute top-2 right-2 z-10">
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={() => toggleSelectItem(item.id)}
                  aria-label="Select vocabulary item"
                />
              </div>
              <VocabularyCard
                key={item.id}
                item={item}
                onDelete={() => handleDeleteItem(item)}
              />
            </div>
          ))}
        </div>
      )}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove vocabulary item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{itemToDelete?.word}" from your vocabulary list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VocabularyPage;
