import React, { createContext, useContext, useState, useEffect } from 'react';
import { VocabularyItem, Language } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Free user limits
const FREE_USER_VOCABULARY_LIMIT = 5;

interface VocabularyContextProps {
  vocabulary: VocabularyItem[];
  addVocabularyItem: (item: Omit<VocabularyItem, 'id'>) => Promise<VocabularyItem>;
  removeVocabularyItem: (id: string) => Promise<void>;
  getVocabularyByExercise: (exerciseId: string) => VocabularyItem[];
  getVocabularyByLanguage: (language: Language) => VocabularyItem[];
  loading: boolean;
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
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { subscription } = useSubscription();
  
  // Check if user has premium subscription
  const isPremium = subscription.isSubscribed && subscription.subscriptionTier === 'premium';

  // Load vocabulary from Supabase when user changes
  useEffect(() => {
    const fetchVocabulary = async () => {
      if (!user) {
        // If not logged in, use local storage
        const savedVocabulary = localStorage.getItem('vocabulary');
        if (savedVocabulary) {
          try {
            setVocabulary(JSON.parse(savedVocabulary));
          } catch (error) {
            console.error('Error parsing stored vocabulary:', error);
            setVocabulary([]);
          }
        } else {
          setVocabulary([]);
        }
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('vocabulary')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          setVocabulary(data.map(item => ({
            id: item.id,
            word: item.word,
            definition: item.definition,
            exampleSentence: item.example_sentence,
            audioUrl: item.audio_url,
            exerciseId: item.exercise_id || '',
            language: item.language as Language
          })));
        }
      } catch (error) {
        console.error('Error fetching vocabulary:', error);
        toast.error('Failed to load vocabulary');
        setVocabulary([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVocabulary();
  }, [user]);

  // Save vocabulary to local storage for non-authenticated users
  useEffect(() => {
    if (!user) {
      localStorage.setItem('vocabulary', JSON.stringify(vocabulary));
    }
  }, [vocabulary, user]);

  const addVocabularyItem = async (item: Omit<VocabularyItem, 'id'>): Promise<VocabularyItem> => {
    try {
      // Check if user has reached their vocabulary limit
      if (!isPremium && vocabulary.length >= FREE_USER_VOCABULARY_LIMIT) {
        toast.error(
          <div className="flex flex-col gap-1">
            <span>You've reached the maximum number of vocabulary items (5) for free accounts.</span>
            <span>Upgrade to premium for unlimited vocabulary lists.</span>
          </div>
        );
        throw new Error("Vocabulary limit reached");
      }

      if (!user) {
        // Handle non-authenticated user
        const newItem: VocabularyItem = {
          ...item,
          id: crypto.randomUUID(),
        };
        
        setVocabulary(prev => [newItem, ...prev]);
        return newItem;
      }

      // Create vocabulary item in Supabase
      const { data, error } = await supabase
        .from('vocabulary')
        .insert({
          user_id: user.id,
          word: item.word,
          definition: item.definition,
          example_sentence: item.exampleSentence,
          audio_url: item.audioUrl,
          exercise_id: item.exerciseId,
          language: item.language
        })
        .select('*')
        .single();

      if (error) throw error;

      const newItem: VocabularyItem = {
        id: data.id,
        word: data.word,
        definition: data.definition,
        exampleSentence: data.example_sentence,
        audioUrl: data.audio_url,
        exerciseId: data.exercise_id || '',
        language: data.language as Language
      };

      setVocabulary(prev => [newItem, ...prev]);
      return newItem;
    } catch (error: any) {
      if (error.message !== "Vocabulary limit reached") {
        toast.error('Failed to create vocabulary item: ' + error.message);
      }
      throw error;
    }
  };

  const removeVocabularyItem = async (id: string) => {
    try {
      if (!user) {
        // Handle non-authenticated user
        setVocabulary(vocabulary.filter(item => item.id !== id));
        return;
      }

      // Delete vocabulary item from Supabase
      const { error } = await supabase
        .from('vocabulary')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setVocabulary(vocabulary.filter(item => item.id !== id));
    } catch (error: any) {
      toast.error('Failed to delete vocabulary item: ' + error.message);
      throw error;
    }
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
    getVocabularyByLanguage,
    loading
  };

  return (
    <VocabularyContext.Provider value={value}>
      {children}
    </VocabularyContext.Provider>
  );
};
