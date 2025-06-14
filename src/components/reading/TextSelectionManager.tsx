
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SelectionPopup } from './SelectionPopup';
import { TextHighlighter } from './TextHighlighter';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Language } from '@/types';

interface VocabularyInfo {
  definition: string;
  exampleSentence: string;
  audioUrl?: string;
}

interface TextSelectionManagerProps {
  children: React.ReactNode;
  onCreateDictation: (selectedText: string) => void;
  onCreateBidirectional: (selectedText: string) => void;
  disabled?: boolean;
  exerciseId?: string;
  exerciseLanguage?: Language;
  enableVocabulary?: boolean;
}

export const TextSelectionManager: React.FC<TextSelectionManagerProps> = ({
  children,
  onCreateDictation,
  onCreateBidirectional,
  disabled = false,
  exerciseId,
  exerciseLanguage,
  enableVocabulary = false
}) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [vocabularyInfo, setVocabularyInfo] = useState<VocabularyInfo | null>(null);
  const [isGeneratingVocabulary, setIsGeneratingVocabulary] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { addVocabularyItem, canCreateMore } = useVocabularyContext();

  const clearSelection = useCallback(() => {
    setSelectedText('');
    setSelectionRange(null);
    setSelectionPosition(null);
    setShowPopup(false);
    setVocabularyInfo(null);
    setIsGeneratingVocabulary(false);
    // Don't clear browser selection here - let user do it naturally
  }, []);

  const processSelection = useCallback(() => {
    if (disabled) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      clearSelection();
      return;
    }

    const range = selection.getRangeAt(0);
    const text = range.toString().trim();

    // Check if selection is within our container
    if (!containerRef.current?.contains(range.commonAncestorContainer)) {
      clearSelection();
      return;
    }

    if (text.length > 0) {
      // Get the bounding rectangle of the selection for positioning
      const rect = range.getBoundingClientRect();
      
      // Calculate optimal position for the popup (center horizontally, above selection)
      const x = rect.left + rect.width / 2;
      const y = rect.top;

      setSelectedText(text);
      setSelectionRange(range.cloneRange()); // Clone to avoid range mutation
      setSelectionPosition({ x, y });
      setShowPopup(true);
      // Reset vocabulary state when new selection is made
      setVocabularyInfo(null);
      setIsGeneratingVocabulary(false);
    } else {
      clearSelection();
    }
  }, [disabled, clearSelection]);

  // Generate vocabulary info using existing VocabularyHighlighter functions
  const generateVocabularyInfo = async (word: string, language: Language) => {
    try {
      console.log('Generating vocabulary info for:', word, 'in language:', language);
      
      // Using the dedicated vocabulary generation function
      const { data, error } = await supabase.functions.invoke('generate-vocabulary-info', {
        body: { text: word, language }
      });

      if (error) {
        console.error('Error invoking generate-vocabulary-info function:', error);
        throw error;
      }
      
      console.log('Response from vocabulary info function:', data);
      
      if (!data) {
        throw new Error('No data received from generate-vocabulary-info function');
      }
      
      // Extract the definition and example sentence from the response
      const definition = data.definition;
      const exampleSentence = data.exampleSentence;
      
      if (!definition || !exampleSentence) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response from generate-vocabulary-info function');
      }

      // Generate audio for example sentence
      console.log('Starting audio generation for example sentence:', exampleSentence);
      
      const audioUrl = await generateExampleAudio(exampleSentence, language);
      
      return {
        definition,
        exampleSentence,
        audioUrl
      };
    } catch (error) {
      console.error('Error generating vocabulary info:', error);
      toast.error('Failed to generate vocabulary information');
      return null;
    }
  };

  // Generate audio for example sentence
  const generateExampleAudio = async (text: string, language: Language): Promise<string | undefined> => {
    try {
      console.log('Calling text-to-speech function for:', text.substring(0, 50) + '...');
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, language }
      });

      if (error) {
        console.error('Error invoking text-to-speech function:', error);
        throw error;
      }

      console.log('Text-to-speech response received:', !!data);

      if (!data) {
        console.warn('No data received from text-to-speech function');
        return undefined;
      }

      // Handle the correct response format: { audio_url: "..." }
      if (data.audio_url) {
        console.log('Audio URL received:', data.audio_url);
        return data.audio_url;
      }

      // Legacy fallback for old response format (backward compatibility)
      if (data.audioUrl) {
        console.log('Audio URL received (legacy format):', data.audioUrl);
        return data.audioUrl;
      }

      console.warn('No audio URL in response:', data);
      return undefined;
      
    } catch (error) {
      console.error('Error generating audio:', error);
      return undefined;
    }
  };

  const handleCreateVocabulary = useCallback(async () => {
    if (!selectedText || !exerciseLanguage) return;
    
    // Check if user can create more vocabulary items
    if (!canCreateMore) {
      toast.error('You\'ve reached the vocabulary limit. Upgrade to premium for unlimited vocabulary.');
      return;
    }
    
    setIsGeneratingVocabulary(true);
    
    try {
      const info = await generateVocabularyInfo(selectedText, exerciseLanguage);
      
      if (info) {
        console.log('Saving vocabulary item with audio URL:', info.audioUrl);
        
        // Check if this is a bidirectional exercise (prefixed ID) and don't pass exerciseId
        const isBidirectionalExercise = exerciseId?.startsWith('bidirectional-');
        
        await addVocabularyItem({
          word: selectedText,
          definition: info.definition,
          exampleSentence: info.exampleSentence,
          audioUrl: info.audioUrl,
          exerciseId: isBidirectionalExercise ? '' : (exerciseId || ''), // Empty string for bidirectional exercises
          language: exerciseLanguage
        });
        
        setVocabularyInfo(info);
        toast.success('Word added to your vocabulary!');
      }
    } catch (error) {
      console.error('Error saving vocabulary item:', error);
      // Check if it's a vocabulary limit error
      if (error instanceof Error && error.message === 'Vocabulary limit reached') {
        toast.error('Vocabulary limit reached. Upgrade to premium for unlimited vocabulary.');
      } else {
        toast.error('Failed to add word to vocabulary');
      }
    } finally {
      setIsGeneratingVocabulary(false);
    }
  }, [selectedText, exerciseLanguage, exerciseId, canCreateMore, addVocabularyItem]);

  // Handle selection changes with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleSelectionChange = () => {
      // Clear previous timeout
      if (timeoutId) clearTimeout(timeoutId);
      
      // Debounce selection processing
      timeoutId = setTimeout(processSelection, 100);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [processSelection]);

  // Enhanced click outside detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Don't clear if clicking on the selection popup
      const isClickingOnPopup = target && (
        target.nodeType === Node.ELEMENT_NODE &&
        (target as Element).closest('[role="dialog"]')
      );
      
      if (isClickingOnPopup) return;
      
      // Clear selection if clicking outside container
      if (containerRef.current && !containerRef.current.contains(target)) {
        clearSelection();
      }
    };

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPopup, clearSelection]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showPopup) {
        clearSelection();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showPopup, clearSelection]);

  const handleCreateDictation = useCallback(() => {
    if (selectedText) {
      onCreateDictation(selectedText);
      clearSelection();
    }
  }, [selectedText, onCreateDictation, clearSelection]);

  const handleCreateBidirectional = useCallback(() => {
    if (selectedText) {
      onCreateBidirectional(selectedText);
      clearSelection();
    }
  }, [selectedText, onCreateBidirectional, clearSelection]);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ 
        userSelect: disabled ? 'none' : 'text',
        WebkitUserSelect: disabled ? 'none' : 'text',
        MozUserSelect: disabled ? 'none' : 'text'
      }}
    >
      <TextHighlighter
        selectedText={selectedText}
        selectionRange={selectionRange}
      >
        {children}
      </TextHighlighter>
      
      {/* Portal-based popup */}
      {selectionPosition && (
        <SelectionPopup
          position={selectionPosition}
          selectedText={selectedText}
          onCreateDictation={handleCreateDictation}
          onCreateBidirectional={handleCreateBidirectional}
          onCreateVocabulary={enableVocabulary ? handleCreateVocabulary : undefined}
          onClose={clearSelection}
          isVisible={showPopup}
          vocabularyInfo={vocabularyInfo}
          isGeneratingVocabulary={isGeneratingVocabulary}
          canCreateVocabulary={canCreateMore}
        />
      )}
    </div>
  );
};
