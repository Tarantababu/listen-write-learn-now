
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { Exercise, Language } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Book, Loader2 } from 'lucide-react';

interface VocabularyHighlighterProps {
  exercise: Exercise;
}

const VocabularyHighlighter: React.FC<VocabularyHighlighterProps> = ({ exercise }) => {
  const { addVocabularyItem } = useVocabularyContext();
  const [selectedWord, setSelectedWord] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedInfo, setGeneratedInfo] = useState<{
    definition: string;
    exampleSentence: string;
    audioUrl?: string;
  } | null>(null);

  // Function to handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setSelectedWord(selection.toString().trim());
    }
  };

  // Function to generate vocabulary item info using OpenAI
  const generateVocabularyInfo = async (word: string, language: Language) => {
    setIsLoading(true);
    try {
      // Call the function to generate definition and example
      const { data, error } = await supabase.functions.invoke('generate-vocabulary-info', {
        body: { word, language }
      });

      if (error) throw error;

      // Generate audio for the example sentence
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
    } finally {
      setIsLoading(false);
    }
  };

  // Generate audio for example sentence
  const generateExampleAudio = async (text: string, language: Language): Promise<string | undefined> => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, language }
      });

      if (error) throw error;

      const audioContent = data.audioContent;
      const blob = await fetch(`data:audio/mp3;base64,${audioContent}`).then(res => res.blob());
      
      const fileName = `vocab_${Date.now()}.mp3`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio')
        .upload(fileName, blob, {
          contentType: 'audio/mp3'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('audio')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error generating audio:', error);
      return undefined;
    }
  };

  const handleAddToVocabulary = async () => {
    if (!selectedWord) return;
    
    setIsDialogOpen(true);
    const info = await generateVocabularyInfo(selectedWord, exercise.language);
    
    if (info) {
      setGeneratedInfo(info);
    }
  };

  const handleSaveVocabularyItem = () => {
    if (!generatedInfo) return;
    
    addVocabularyItem({
      word: selectedWord,
      definition: generatedInfo.definition,
      exampleSentence: generatedInfo.exampleSentence,
      audioUrl: generatedInfo.audioUrl,
      exerciseId: exercise.id,
      language: exercise.language
    });
    
    setIsDialogOpen(false);
    setSelectedWord('');
    setGeneratedInfo(null);
    
    toast.success('Word added to your vocabulary!');
  };

  return (
    <div className="mt-8 border-t pt-6">
      <div className="flex items-center gap-2 mb-4">
        <Book className="h-5 w-5" />
        <h3 className="font-medium">Vocabulary Building</h3>
      </div>
      
      <div className="bg-muted p-4 rounded-md mb-4">
        <p className="text-sm mb-2">Select any word or phrase from the text to add it to your vocabulary:</p>
        <div 
          className="p-3 bg-background rounded border text-sm cursor-text whitespace-pre-wrap"
          onMouseUp={handleTextSelection}
        >
          {exercise.text}
        </div>
      </div>
      
      <div className="flex gap-2">
        <Input 
          value={selectedWord} 
          onChange={e => setSelectedWord(e.target.value)} 
          placeholder="Selected word or phrase"
        />
        <Button
          onClick={handleAddToVocabulary}
          disabled={!selectedWord.trim()}
        >
          Add to Vocabulary
        </Button>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Vocabulary</DialogTitle>
            <DialogDescription>
              Adding "{selectedWord}" to your vocabulary list
            </DialogDescription>
          </DialogHeader>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Generating information...</p>
            </div>
          ) : generatedInfo ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Definition:</h4>
                <p className="text-sm">{generatedInfo.definition}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Example:</h4>
                <p className="text-sm italic">{generatedInfo.exampleSentence}</p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveVocabularyItem}>
                  Save to Vocabulary
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              Failed to generate information
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VocabularyHighlighter;
