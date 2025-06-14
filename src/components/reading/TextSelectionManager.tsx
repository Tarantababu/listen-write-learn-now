import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SelectionPopup } from './SelectionPopup';
import { TextHighlighter } from './TextHighlighter';
import { TextSelectionContextMenu } from './TextSelectionContextMenu';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Language } from '@/types';
import { analyzeTextSelection, cleanTextForExercise, TextSelectionInfo } from '@/utils/textSelection';

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
  enhancedHighlighting?: boolean;
  vocabularyIntegration?: boolean;
  enableContextMenu?: boolean;
  isReadingMode?: boolean;
}

export const TextSelectionManager: React.FC<TextSelectionManagerProps> = ({
  children,
  onCreateDictation,
  onCreateBidirectional,
  disabled = false,
  exerciseId,
  exerciseLanguage,
  enableVocabulary = false,
  enhancedHighlighting = false,
  vocabularyIntegration = false,
  enableContextMenu = true,
  isReadingMode = false
}) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [vocabularyInfo, setVocabularyInfo] = useState<VocabularyInfo | null>(null);
  const [isGeneratingVocabulary, setIsGeneratingVocabulary] = useState(false);
  const [selectionInfo, setSelectionInfo] = useState<TextSelectionInfo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { addVocabularyItem, canCreateMore } = useVocabularyContext();

  const clearSelection = useCallback(() => {
    setSelectedText('');
    setSelectionRange(null);
    setSelectionPosition(null);
    setShowPopup(false);
    setVocabularyInfo(null);
    setIsGeneratingVocabulary(false);
    setSelectionInfo(null);
  }, []);

  const processSelection = useCallback(() => {
    if (disabled) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      clearSelection();
      return;
    }

    const range = selection.getRangeAt(0);
    const rawText = range.toString();

    // Improved containment check for Reading Mode
    if (isReadingMode) {
      // For reading mode, check if the selection is within our container more reliably
      const startContainer = range.startContainer;
      const endContainer = range.endContainer;
      
      const isStartWithinContainer = containerRef.current?.contains(startContainer);
      const isEndWithinContainer = containerRef.current?.contains(endContainer);
      
      if (!isStartWithinContainer || !isEndWithinContainer) {
        console.log('Selection outside container in reading mode');
        clearSelection();
        return;
      }
    } else {
      // Original containment check for other modes
      if (!containerRef.current?.contains(range.commonAncestorContainer)) {
        clearSelection();
        return;
      }
    }

    if (rawText.length > 0) {
      // Only trim leading/trailing whitespace, preserve ALL internal spacing
      const preservedText = rawText.replace(/^\s+|\s+$/g, '');
      
      console.log('Raw selected text:', JSON.stringify(rawText));
      console.log('Preserved selected text:', JSON.stringify(preservedText));
      
      const rect = range.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top;

      // Analyze the selection using the preserved text
      const analysis = analyzeTextSelection(preservedText);
      
      setSelectedText(preservedText);
      setSelectionRange(range.cloneRange());
      setSelectionPosition({ x, y });
      setSelectionInfo(analysis);
      setShowPopup(true);
      setVocabularyInfo(null);
      setIsGeneratingVocabulary(false);
    } else {
      clearSelection();
    }
  }, [disabled, clearSelection, isReadingMode]);

  // Generate vocabulary info using existing VocabularyHighlighter functions
  const generateVocabularyInfo = async (word: string, language: Language) => {
    try {
      console.log('Generating vocabulary info for:', word, 'in language:', language);
      
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
      
      const definition = data.definition;
      const exampleSentence = data.exampleSentence;
      
      if (!definition || !exampleSentence) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response from generate-vocabulary-info function');
      }

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

      if (data.audio_url) {
        console.log('Audio URL received:', data.audio_url);
        return data.audio_url;
      }

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
    
    if (!canCreateMore) {
      toast.error('You\'ve reached the vocabulary limit. Upgrade to premium for unlimited vocabulary.');
      return;
    }
    
    setIsGeneratingVocabulary(true);
    
    try {
      const cleanedText = cleanTextForExercise(selectedText, 'vocabulary');
      const info = await generateVocabularyInfo(cleanedText, exerciseLanguage);
      
      if (info) {
        console.log('Saving vocabulary item with audio URL:', info.audioUrl);
        
        const isBidirectionalExercise = exerciseId?.startsWith('bidirectional-');
        
        await addVocabularyItem({
          word: cleanedText,
          definition: info.definition,
          exampleSentence: info.exampleSentence,
          audioUrl: info.audioUrl,
          exerciseId: isBidirectionalExercise ? '' : (exerciseId || ''),
          language: exerciseLanguage
        });
        
        setVocabularyInfo(info);
        toast.success('Word added to your vocabulary!');
      }
    } catch (error) {
      console.error('Error saving vocabulary item:', error);
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
      if (timeoutId) clearTimeout(timeoutId);
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
      
      const isClickingOnPopup = target && (
        target.nodeType === Node.ELEMENT_NODE &&
        (target as Element).closest('[role="dialog"]')
      );
      
      if (isClickingOnPopup) return;
      
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
      const cleanedText = cleanTextForExercise(selectedText, 'dictation');
      onCreateDictation(cleanedText);
      clearSelection();
    }
  }, [selectedText, onCreateDictation, clearSelection]);

  const handleCreateBidirectional = useCallback(() => {
    if (selectedText) {
      const cleanedText = cleanTextForExercise(selectedText, 'translation');
      onCreateBidirectional(cleanedText);
      clearSelection();
    }
  }, [selectedText, onCreateBidirectional, clearSelection]);

  // Determine which vocabulary features to show based on props
  const shouldShowVocabulary = vocabularyIntegration && (enableVocabulary || vocabularyIntegration);

  const content = (
    <div
      ref={containerRef}
      className="relative"
      style={{ 
        userSelect: disabled ? 'none' : 'text',
        WebkitUserSelect: disabled ? 'none' : 'text',
        MozUserSelect: disabled ? 'none' : 'text'
      }}
    >
      {/* Skip TextHighlighter completely in Reading Mode to avoid DOM interference */}
      {isReadingMode ? (
        children
      ) : (
        <TextHighlighter
          selectedText={selectedText}
          selectionRange={selectionRange}
          enhancedHighlighting={enhancedHighlighting}
        >
          {children}
        </TextHighlighter>
      )}
      
      {/* Main interactive popup - shown immediately on selection */}
      {selectionPosition && showPopup && (
        <SelectionPopup
          position={selectionPosition}
          selectedText={selectedText}
          onCreateDictation={handleCreateDictation}
          onCreateBidirectional={handleCreateBidirectional}
          onCreateVocabulary={shouldShowVocabulary ? handleCreateVocabulary : undefined}
          onClose={clearSelection}
          isVisible={showPopup}
          vocabularyInfo={vocabularyInfo}
          isGeneratingVocabulary={isGeneratingVocabulary}
          canCreateVocabulary={canCreateMore}
        />
      )}
    </div>
  );

  // Conditionally wrap with context menu for right-click options
  if (enableContextMenu && selectedText) {
    return (
      <TextSelectionContextMenu
        selectedText={selectedText}
        onCreateDictation={handleCreateDictation}
        onCreateBidirectional={handleCreateBidirectional}
        onCreateVocabulary={shouldShowVocabulary ? handleCreateVocabulary : undefined}
        disabled={disabled}
        enableVocabulary={shouldShowVocabulary}
      >
        {content}
      </TextSelectionContextMenu>
    );
  }

  return content;
};
