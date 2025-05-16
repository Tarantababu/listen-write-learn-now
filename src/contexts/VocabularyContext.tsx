
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { VocabularyItem, Language } from '@/types';

interface VocabularyContextProps {
  vocabularyItems: VocabularyItem[];
  addVocabularyItem: (item: Omit<VocabularyItem, 'id'>) => Promise<VocabularyItem>;
  deleteVocabularyItem: (id: string) => Promise<void>;
  updateVocabularyItem: (id: string, item: Partial<VocabularyItem>) => Promise<void>;
  getVocabularyItemsByExercise: (exerciseId: string) => VocabularyItem[];
  getVocabularyByLanguage: (language: Language) => VocabularyItem[];
  vocabularyLimit: number;
  removeVocabularyItem: (id: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

const VocabularyContext = createContext<VocabularyContextProps | undefined>(undefined);

// Default vocabulary limit for free users
const DEFAULT_VOCABULARY_LIMIT = 50;

export const VocabularyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vocabularyItems, setVocabularyItems] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchVocabularyItems = async () => {
      if (!user) {
        setVocabularyItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('vocabulary')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        if (data) {
          const formattedItems: VocabularyItem[] = data.map(item => ({
            id: item.id,
            word: item.word,
            definition: item.definition,
            exampleSentence: item.example_sentence,
            language: item.language as Language, // Cast to Language type
            userId: item.user_id,
            createdAt: item.created_at,
            audioUrl: item.audio_url || undefined,
            exercise_id: item.exercise_id || undefined
          }));

          setVocabularyItems(formattedItems);
        }
      } catch (err) {
        console.error('Error fetching vocabulary items:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch vocabulary items'));
      } finally {
        setLoading(false);
      }
    };

    fetchVocabularyItems();
  }, [user]);

  const addVocabularyItem = async (item: Omit<VocabularyItem, 'id'>): Promise<VocabularyItem> => {
    if (!user) throw new Error('You must be logged in to add vocabulary items');

    try {
      const { data, error } = await supabase
        .from('vocabulary')
        .insert({
          word: item.word,
          definition: item.definition,
          example_sentence: item.exampleSentence,
          language: item.language,
          user_id: user.id,
          audio_url: item.audioUrl,
          exercise_id: item.exercise_id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const newItem: VocabularyItem = {
        id: data.id,
        word: data.word,
        definition: data.definition,
        exampleSentence: data.example_sentence,
        language: data.language as Language, // Cast to Language type
        userId: data.user_id,
        createdAt: data.created_at,
        audioUrl: data.audio_url || undefined,
        exercise_id: data.exercise_id || undefined
      };

      setVocabularyItems(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      console.error('Error adding vocabulary item:', err);
      throw err instanceof Error ? err : new Error('Failed to add vocabulary item');
    }
  };

  const deleteVocabularyItem = async (id: string): Promise<void> => {
    if (!user) throw new Error('You must be logged in to delete vocabulary items');

    try {
      const { error } = await supabase
        .from('vocabulary')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setVocabularyItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting vocabulary item:', err);
      throw err instanceof Error ? err : new Error('Failed to delete vocabulary item');
    }
  };

  const updateVocabularyItem = async (id: string, item: Partial<VocabularyItem>): Promise<void> => {
    if (!user) throw new Error('You must be logged in to update vocabulary items');

    try {
      // Convert from our types to database column names
      const dbItem: any = {
        ...(item.word && { word: item.word }),
        ...(item.definition && { definition: item.definition }),
        ...(item.exampleSentence && { example_sentence: item.exampleSentence }),
        ...(item.language && { language: item.language }),
        ...(item.audioUrl && { audio_url: item.audioUrl }),
        ...(item.exercise_id && { exercise_id: item.exercise_id }),
      };

      const { error } = await supabase
        .from('vocabulary')
        .update(dbItem)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setVocabularyItems(prev =>
        prev.map(vocabItem =>
          vocabItem.id === id ? { ...vocabItem, ...item } : vocabItem
        )
      );
    } catch (err) {
      console.error('Error updating vocabulary item:', err);
      throw err instanceof Error ? err : new Error('Failed to update vocabulary item');
    }
  };

  const getVocabularyItemsByExercise = (exerciseId: string): VocabularyItem[] => {
    return vocabularyItems.filter(item => item.exercise_id === exerciseId);
  };
  
  // Add the missing method to filter vocabulary by language
  const getVocabularyByLanguage = (language: Language): VocabularyItem[] => {
    return vocabularyItems.filter(item => item.language === language);
  };
  
  // Alias for deleteVocabularyItem to match the expected interface
  const removeVocabularyItem = deleteVocabularyItem;

  return (
    <VocabularyContext.Provider
      value={{
        vocabularyItems,
        addVocabularyItem,
        deleteVocabularyItem,
        updateVocabularyItem,
        getVocabularyItemsByExercise,
        getVocabularyByLanguage,
        removeVocabularyItem,
        vocabularyLimit: DEFAULT_VOCABULARY_LIMIT,
        loading,
        error
      }}
    >
      {children}
    </VocabularyContext.Provider>
  );
};

export const useVocabularyContext = () => {
  const context = useContext(VocabularyContext);
  if (!context) {
    throw new Error('useVocabularyContext must be used within a VocabularyProvider');
  }
  return context;
};
