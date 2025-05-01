
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

const VocabularyPage: React.FC = () => {
  const { vocabulary, removeVocabularyItem } = useVocabularyContext();
  const { settings } = useUserSettingsContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<VocabularyItem | null>(null);
  
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
    }
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
        <h1 className="text-2xl font-bold">Vocabulary</h1>
        <p className="text-muted-foreground">
          Review and manage your saved vocabulary items
        </p>
      </div>
      
      {/* Add the Vocabulary Playlist component */}
      <VocabularyPlaylist vocabularyItems={displayVocabulary} />
      
      <div className="mb-6">
        <Input
          placeholder="Search vocabulary..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {displayVocabulary.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg mb-2">Your vocabulary list is empty</p>
          <p className="text-muted-foreground mb-4">
            Practice exercises and save words to build your vocabulary
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayVocabulary.map(item => (
            <VocabularyCard
              key={item.id}
              item={item}
              onDelete={() => handleDeleteItem(item)}
            />
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
