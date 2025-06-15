import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Mic, Brain, Plus, Copy, Search, Loader2, Volume2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { supabase } from '@/integrations/supabase/client';
import { Language } from '@/types';
import { analyzeTextSelection, cleanTextForExercise, TextSelectionInfo } from '@/utils/textSelection';
import { TextExpansionToggle } from '@/components/ui/text-expansion-toggle';
import { useTextExpansion } from '@/hooks/use-text-expansion';
import { cn } from '@/lib/utils';
import AudioPlayer from '@/components/AudioPlayer';

interface VocabularyInfo {
  definition: string;
  exampleSentence: string;
  audioUrl?: string;
}

interface TextSelectionPanelProps {
  text: string;
  onCreateDictation: (selectedText: string) => void;
  onCreateBidirectional: (selectedText: string) => void;
  exerciseId?: string;
  exerciseLanguage?: Language;
  enableVocabulary?: boolean;
  vocabularyIntegration?: boolean;
}

export const TextSelectionPanel: React.FC<TextSelectionPanelProps> = ({
  text,
  onCreateDictation,
  onCreateBidirectional,
  exerciseId,
  exerciseLanguage,
  enableVocabulary = false,
  vocabularyIntegration = false
}) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionInfo, setSelectionInfo] = useState<TextSelectionInfo | null>(null);
  const [vocabularyInfo, setVocabularyInfo] = useState<VocabularyInfo | null>(null);
  const [isGeneratingVocabulary, setIsGeneratingVocabulary] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { isTextExpanded, toggleTextExpansion } = useTextExpansion();
  const { addVocabularyItem, canCreateMore } = useVocabularyContext();

  const handleSelectionChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start !== end) {
      const selected = text.substring(start, end);
      const preservedText = selected.replace(/^\s+|\s+$/g, '');
      
      if (preservedText.length > 0) {
        console.log('TextSelectionPanel - Selected text:', JSON.stringify(preservedText));
        
        const analysis = analyzeTextSelection(preservedText);
        setSelectedText(preservedText);
        setSelectionInfo(analysis);
        setVocabularyInfo(null);
      } else {
        clearSelection();
      }
    } else {
      clearSelection();
    }
  }, [text]);

  const clearSelection = useCallback(() => {
    setSelectedText('');
    setSelectionInfo(null);
    setVocabularyInfo(null);
    setIsGeneratingVocabulary(false);
  }, []);

  // Generate vocabulary info
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
      
      if (!data || !data.definition || !data.exampleSentence) {
        throw new Error('Invalid response from generate-vocabulary-info function');
      }

      const audioUrl = await generateExampleAudio(data.exampleSentence, language);
      
      return {
        definition: data.definition,
        exampleSentence: data.exampleSentence,
        audioUrl
      };
    } catch (error) {
      console.error('Error generating vocabulary info:', error);
      toast.error('Failed to generate vocabulary information');
      return null;
    }
  };

  const generateExampleAudio = async (text: string, language: Language): Promise<string | undefined> => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, language }
      });

      if (error) {
        console.error('Error invoking text-to-speech function:', error);
        return undefined;
      }

      return data?.audio_url || data?.audioUrl;
    } catch (error) {
      console.error('Error generating audio:', error);
      return undefined;
    }
  };

  const handleCopyText = () => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
      toast.success('Text copied to clipboard');
    }
  };

  const handleSearchText = () => {
    if (selectedText) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(selectedText)}`;
      window.open(searchUrl, '_blank');
    }
  };

  const handleCreateDictation = () => {
    if (selectedText) {
      const cleanedText = cleanTextForExercise(selectedText, 'dictation');
      onCreateDictation(cleanedText);
      toast.success('Opening dictation exercise creation...');
      clearSelection();
    }
  };

  const handleCreateBidirectional = () => {
    if (selectedText) {
      const cleanedText = cleanTextForExercise(selectedText, 'translation');
      console.log('TextSelectionPanel - Creating bidirectional exercise for:', cleanedText);
      onCreateBidirectional(cleanedText);
      toast.success('Opening translation exercise creation...');
      clearSelection();
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
        // Check if the exerciseId exists in the exercises table before using it
        let validExerciseId = '';
        
        if (exerciseId) {
          console.log('Checking if exercise exists:', exerciseId);
          const { data: exerciseExists, error: checkError } = await supabase
            .from('exercises')
            .select('id')
            .eq('id', exerciseId)
            .maybeSingle();
          
          if (checkError) {
            console.error('Error checking exercise existence:', checkError);
          }
          
          // Only use the exerciseId if it exists in the exercises table
          if (exerciseExists) {
            validExerciseId = exerciseId;
            console.log('Exercise exists, using exerciseId:', validExerciseId);
          } else {
            console.log('Exercise does not exist in exercises table, using empty exerciseId');
            validExerciseId = '';
          }
        }
        
        await addVocabularyItem({
          word: cleanedText,
          definition: info.definition,
          exampleSentence: info.exampleSentence,
          audioUrl: info.audioUrl,
          exerciseId: validExerciseId,
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

  const shouldShowVocabulary = vocabularyIntegration && (enableVocabulary || vocabularyIntegration);

  const getDisplayText = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-4">
      {/* Text Display Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Reading Text
          </label>
          <TextExpansionToggle
            isExpanded={isTextExpanded}
            onToggle={toggleTextExpansion}
            size="sm"
          />
        </div>
        <Textarea
          ref={textareaRef}
          value={text}
          readOnly
          className={cn(
            "resize-y cursor-text transition-all duration-300",
            isTextExpanded 
              ? "min-h-[300px] text-xl leading-relaxed p-6" 
              : "min-h-[200px] text-base leading-relaxed"
          )}
          onSelect={handleSelectionChange}
          onMouseUp={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          placeholder="No text available"
        />
        <p className="text-xs text-gray-500">
          Select any text above to create exercises or add to vocabulary
        </p>
      </div>

      {/* Selection Actions Panel */}
      {selectedText && (
        <Card className="p-4 space-y-4 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
          {/* Selected Text Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Selected Text
              </h3>
              <Badge variant="outline" className="text-xs">
                {selectedText.split(' ').length} words
              </Badge>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
              <p className={cn(
                "font-medium text-gray-900 dark:text-gray-100 break-words transition-all duration-300",
                isTextExpanded ? "text-base" : "text-sm"
              )}>
                "{getDisplayText(selectedText, 60)}"
              </p>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Create Exercise
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={handleCreateDictation}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white justify-start"
              >
                <Mic className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Create Dictation Exercise</div>
                  <div className="text-xs opacity-90">Practice listening and typing</div>
                </div>
              </Button>
              
              <Button
                onClick={handleCreateBidirectional}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white justify-start"
              >
                <Brain className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Create Translation Exercise</div>
                  <div className="text-xs opacity-90">Practice translation skills</div>
                </div>
              </Button>
              
              {shouldShowVocabulary && (
                <Button
                  onClick={handleCreateVocabulary}
                  disabled={isGeneratingVocabulary || !canCreateMore}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white justify-start disabled:opacity-50"
                >
                  {isGeneratingVocabulary ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <div className="text-left">
                    <div className="font-medium">
                      {isGeneratingVocabulary ? 'Generating...' : 'Add to Vocabulary'}
                    </div>
                    <div className="text-xs opacity-90">
                      {canCreateMore ? 'Save word with definition and audio' : 'Vocabulary limit reached'}
                    </div>
                  </div>
                </Button>
              )}
            </div>

            <Separator />

            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Utilities
            </h4>
            <div className="flex gap-2">
              <Button onClick={handleCopyText} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button onClick={handleSearchText} variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* Vocabulary Information Display */}
          {vocabularyInfo && (
            <>
              <Separator />
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Added to Vocabulary!
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                      Definition:
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      {vocabularyInfo.definition}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                      Example:
                    </p>
                    <p className="text-sm italic text-green-800 dark:text-green-200 mb-2">
                      "{vocabularyInfo.exampleSentence}"
                    </p>
                    
                    {vocabularyInfo.audioUrl ? (
                      <AudioPlayer audioUrl={vocabularyInfo.audioUrl} />
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                        <Volume2 className="h-3 w-3" />
                        <span>Audio not available</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Loading state */}
          {isGeneratingVocabulary && (
            <>
              <Separator />
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Generating vocabulary information...
                </span>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
};
