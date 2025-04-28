
import React, { createContext, useContext, useState, useEffect } from 'react';
import { VocabularyItem, Language } from '@/types';

interface VocabularyContextProps {
  vocabulary: VocabularyItem[];
  addVocabularyItem: (item: Omit<VocabularyItem, 'id'>) => void;
  removeVocabularyItem: (id: string) => void;
  getVocabularyByExercise: (exerciseId: string) => VocabularyItem[];
  getVocabularyByLanguage: (language: Language) => VocabularyItem[];
}

const VocabularyContext = createContext<VocabularyContextProps | undefined>(undefined);

export const useVocabularyContext = () => {
  const context = useContext(VocabularyContext);
  if (!context) {
    throw new Error('useVocabularyContext must be used within a VocabularyProvider');
  }
  return context;
};

export const VocabularyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>(() => {
    const savedVocabulary = localStorage.getItem('vocabulary');
    return savedVocabulary ? JSON.parse(savedVocabulary) : [];
  });

  useEffect(() => {
    localStorage.setItem('vocabulary', JSON.stringify(vocabulary));
  }, [vocabulary]);

  const addVocabularyItem = (item: Omit<VocabularyItem, 'id'>) => {
    const newItem: VocabularyItem = {
      ...item,
      id: crypto.randomUUID(),
    };
    
    setVocabulary([...vocabulary, newItem]);
    
    // Here we would generate audio for the example sentence using ChatGPT API
    console.log(`Audio would be generated for example: ${newItem.exampleSentence}`);
    
    return newItem;
  };

  const removeVocabularyItem = (id: string) => {
    setVocabulary(vocabulary.filter(item => item.id !== id));
  };

  const getVocabularyByExercise = (exerciseId: string) => {
    return vocabulary.filter(item => item.exerciseId === exerciseId);
  };

  const getVocabularyByLanguage = (language: Language) => {
    return vocabulary.filter(item => item.language === language);
  };

  const value = {
    vocabulary,
    addVocabularyItem,
    removeVocabularyItem,
    getVocabularyByExercise,
    getVocabularyByLanguage
  };

  return (
    <VocabularyContext.Provider value={value}>
      {children}
    </VocabularyContext.Provider>
  );
};
