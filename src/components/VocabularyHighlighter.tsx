
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { Exercise, Language } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Book, Loader2, Volume2 } from 'lucide-react';

interface VocabularyHighlighterProps {
  exercise: Exercise;
}

const VocabularyHighlighter: React.FC<VocabularyHighlighterProps> = ({ exercise }) => {
  const { addVocabularyItem } = useVocabularyContext();
  const [selectedWord, setSelectedWord] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGeneratingInfo, setIsGeneratingInfo] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedInfo, setGeneratedInfo] = useState<{
    definition: string;
    exampleSentence: string;
    audioUrl?: string;
  } | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Function to handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setSelectedWord(selection.toString().trim());
    }
  };

  // Function to generate vocabulary item info
  const generateVocabularyInfo = async (word: string, language: Language) => {
    setIsGeneratingInfo(true);
    try {
      toast({
        title: "Generating Info",
        description: "Generating vocabulary information..."
      });
      
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

      // After successfully getting definition and example, generate audio
      toast({
        title: "Generating Audio",
        description: "Generating audio for example sentence..."
      });
      setIsGeneratingAudio(true);
      
      const audioUrl = await generateExampleAudio(exampleSentence, language);
      
      return {
        definition,
        exampleSentence,
        audioUrl
      };
    } catch (error) {
      console.error('Error generating vocabulary info:', error);
      toast({
        title: "Error",
        description: "Failed to generate vocabulary information",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGeneratingInfo(false);
    }
  };

  // Generate audio for example sentence
  const generateExampleAudio = async (text: string, language: Language): Promise<string | undefined> => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, language }
      });

      if (error) {
        console.error('Error invoking text-to-speech function:', error);
        throw error;
      }

      if (!data || !data.audioContent) {
        throw new Error('No audio content received');
      }

      const audioContent = data.audioContent;
      const blob = await fetch(`data:audio/mp3;base64,${audioContent}`).then(res => res.blob());
      
      const fileName = `vocab_${Date.now()}.mp3`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio')
        .upload(fileName, blob, {
          contentType: 'audio/mp3'
        });

      if (uploadError) {
        console.error('Error uploading audio:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('audio')
        .getPublicUrl(fileName);

      toast({
        title: "Success",
        description: "Audio generated successfully"
      });
      return publicUrl;
    } catch (error) {
      console.error('Error generating audio:', error);
      toast({
        title: "Error",
        description: "Failed to generate audio for example sentence",
        variant: "destructive"
      });
      return undefined;
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleAddToVocabulary = async () => {
    if (!selectedWord) return;
    
    setIsDialogOpen(true);
    const info = await generateVocabularyInfo(selectedWord, exercise.language);
    
    if (info) {
      setGeneratedInfo(info);
      
      // Create audio element if URL is available
      if (info.audioUrl) {
        const audio = new Audio(info.audioUrl);
        setAudioElement(audio);
        
        // Add event listeners to track playing state
        audio.addEventListener('play', () => setIsPlaying(true));
        audio.addEventListener('pause', () => setIsPlaying(false));
        audio.addEventListener('ended', () => setIsPlaying(false));
      }
    }
  };

  const handlePlayAudio = () => {
    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play().catch(error => {
          console.error('Error playing audio:', error);
          toast({
            title: "Error",
            description: "Failed to play audio",
            variant: "destructive"
          });
        });
      }
    }
  };

  const handleSaveVocabularyItem = async () => {
    if (!generatedInfo) return;
    
    setIsSaving(true);
    try {
      await addVocabularyItem({
        word: selectedWord,
        definition: generatedInfo.definition,
        exampleSentence: generatedInfo.exampleSentence,
        audioUrl: generatedInfo.audioUrl,
        exerciseId: exercise.id,
        language: exercise.language
      });
      
      toast({
        title: "Success",
        description: "Word added to your vocabulary!"
      });
      
      // Clean up
      setIsDialogOpen(false);
      setSelectedWord('');
      setGeneratedInfo(null);
      setAudioElement(null);
    } catch (error) {
      console.error('Error saving vocabulary item:', error);
      toast({
        title: "Error",
        description: "Failed to add word to vocabulary",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDialogClose = () => {
    // Clean up audio
    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="mt-12 border-t pt-8 max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-background to-accent/5 p-6 rounded-xl shadow-sm border border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary/10 p-2 rounded-full">
            <Book className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-medium text-lg">Vocabulary Building</h3>
        </div>
        
        <div className="bg-muted/80 p-5 rounded-lg mb-5">
          <p className="text-sm mb-3 text-muted-foreground">Select any word or phrase from the text to add it to your vocabulary:</p>
          <div 
            className="p-4 bg-background rounded-md border text-sm cursor-text whitespace-pre-wrap animate-fade-in hover:border-primary/30 transition-colors"
            onMouseUp={handleTextSelection}
          >
            {exercise.text}
          </div>
        </div>
        
        <div className="flex gap-3 max-w-2xl mx-auto">
          <Input 
            value={selectedWord} 
            onChange={e => setSelectedWord(e.target.value)} 
            placeholder="Selected word or phrase"
            className="flex-grow"
          />
          <Button
            onClick={handleAddToVocabulary}
            disabled={!selectedWord.trim() || isGeneratingInfo}
            className="hover-glow"
          >
            {isGeneratingInfo ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Add to Vocabulary'
            )}
          </Button>
        </div>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Vocabulary</DialogTitle>
            <DialogDescription>
              Adding "{selectedWord}" to your vocabulary list
            </DialogDescription>
          </DialogHeader>
          
          {isGeneratingInfo || isGeneratingAudio ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                {isGeneratingInfo 
                  ? 'Generating vocabulary information...' 
                  : 'Creating audio for example sentence...'}
              </p>
            </div>
          ) : generatedInfo ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Definition (English):</h4>
                <p className="text-sm">{generatedInfo.definition}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Example:</h4>
                <div className="flex items-center gap-2">
                  <p className="text-sm italic flex-grow">{generatedInfo.exampleSentence}</p>
                  {generatedInfo.audioUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePlayAudio}
                      className="flex-shrink-0"
                    >
                      <Volume2 className={`h-4 w-4 ${isPlaying ? 'text-primary' : ''}`} />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveVocabularyItem} 
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save to Vocabulary'
                  )}
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
