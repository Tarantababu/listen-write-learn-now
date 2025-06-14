
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { Exercise, Language } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Book, Loader2, Volume2, Crown } from 'lucide-react';
import UpgradePrompt from '@/components/UpgradePrompt';
import AudioPlayer from '@/components/AudioPlayer';

interface VocabularyHighlighterProps {
  exercise: Exercise;
}

const VocabularyHighlighter: React.FC<VocabularyHighlighterProps> = ({ exercise }) => {
  const { addVocabularyItem, canCreateMore, vocabularyLimit } = useVocabularyContext();
  const [selectedWord, setSelectedWord] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGeneratingInfo, setIsGeneratingInfo] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
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
    setIsGeneratingInfo(true);
    setIsGeneratingAudio(false);
    setGeneratedInfo(null);
    
    try {
      console.log('Generating vocabulary info for:', word, 'in language:', language);
      
      toast("Generating Info", {
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

      setIsGeneratingInfo(false);

      // After successfully getting definition and example, generate audio
      console.log('Starting audio generation for example sentence:', exampleSentence);
      setIsGeneratingAudio(true);
      
      toast("Generating Audio", {
        description: "Generating audio for example sentence..."
      });
      
      const audioUrl = await generateExampleAudio(exampleSentence, language);
      
      return {
        definition,
        exampleSentence,
        audioUrl
      };
    } catch (error) {
      console.error('Error generating vocabulary info:', error);
      toast("Error", {
        description: "Failed to generate vocabulary information",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGeneratingInfo(false);
      setIsGeneratingAudio(false);
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

      // The updated function now returns { audio_url: "storage_url" } consistently
      if (data.audio_url) {
        console.log('Audio URL received:', data.audio_url);
        toast("Success", {
          description: "Audio generated successfully!"
        });
        return data.audio_url;
      }

      console.warn('No audio_url in response:', data);
      return undefined;
      
    } catch (error) {
      console.error('Error generating audio:', error);
      toast("Warning", {
        description: "Audio generation failed, but vocabulary will still be saved without audio",
        variant: "default"
      });
      return undefined;
    }
  };

  const handleAddToVocabulary = async () => {
    if (!selectedWord) return;
    
    // Check if user can create more vocabulary items before generating info
    if (!canCreateMore) {
      setShowUpgradePrompt(true);
      return;
    }
    
    setIsDialogOpen(true);
    const info = await generateVocabularyInfo(selectedWord, exercise.language);
    
    if (info) {
      setGeneratedInfo(info);
    }
  };

  const handleSaveVocabularyItem = async () => {
    if (!generatedInfo) return;
    
    setIsSaving(true);
    try {
      console.log('Saving vocabulary item with audio URL:', generatedInfo.audioUrl);
      
      // Check if this is a bidirectional exercise (prefixed ID) and don't pass exerciseId
      const isBidirectionalExercise = exercise.id.startsWith('bidirectional-');
      
      await addVocabularyItem({
        word: selectedWord,
        definition: generatedInfo.definition,
        exampleSentence: generatedInfo.exampleSentence,
        audioUrl: generatedInfo.audioUrl,
        exerciseId: isBidirectionalExercise ? '' : exercise.id, // Empty string for bidirectional exercises
        language: exercise.language
      });
      
      toast("Success", {
        description: "Word added to your vocabulary!"
      });
      
      // Clean up
      setIsDialogOpen(false);
      setSelectedWord('');
      setGeneratedInfo(null);
    } catch (error) {
      console.error('Error saving vocabulary item:', error);
      // Check if it's a vocabulary limit error
      if (error instanceof Error && error.message === 'Vocabulary limit reached') {
        setIsDialogOpen(false);
        setShowUpgradePrompt(true);
      } else {
        toast("Error", {
          description: "Failed to add word to vocabulary",
          variant: "destructive"
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  return (
    <div className="mt-12 border-t pt-8 max-w-4xl mx-auto">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="vocabulary-builder">
          <AccordionTrigger className="text-left hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Book className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium text-lg">Vocabulary Building</h3>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="bg-gradient-to-r from-background to-accent/5 p-6 rounded-xl shadow-sm border border-border/50">
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
                    <>
                      {!canCreateMore && <Crown className="mr-2 h-4 w-4" />}
                      Add to Vocabulary
                    </>
                  )}
                </Button>
              </div>
              
              {!canCreateMore && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 text-center">
                    You've reached the limit of {vocabularyLimit} vocabulary items. 
                    <span className="font-medium"> Upgrade to premium for unlimited vocabulary!</span>
                  </p>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      {/* Vocabulary Generation Dialog */}
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
                  : isGeneratingAudio
                  ? 'Creating audio for example sentence...'
                  : 'Processing...'}
              </p>
            </div>
          ) : generatedInfo ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Definition:</h4>
                <p className="text-sm">{generatedInfo.definition}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Example:</h4>
                <p className="text-sm italic mb-2">"{generatedInfo.exampleSentence}"</p>
                
                {/* Audio Player Section */}
                <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                  {generatedInfo.audioUrl ? (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Listen to pronunciation:</p>
                      <AudioPlayer audioUrl={generatedInfo.audioUrl} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Volume2 className="h-4 w-4" />
                      <span>Audio not available</span>
                    </div>
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
      
      {/* Upgrade Prompt Dialog */}
      <Dialog open={showUpgradePrompt} onOpenChange={setShowUpgradePrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Vocabulary Limit Reached
            </DialogTitle>
            <DialogDescription>
              You've reached the maximum of {vocabularyLimit} vocabulary items for free accounts.
            </DialogDescription>
          </DialogHeader>
          
          <UpgradePrompt
            title=""
            message="Upgrade to premium to add unlimited vocabulary items and unlock all premium features!"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VocabularyHighlighter;
