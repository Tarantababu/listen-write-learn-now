import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { Exercise, VocabularyItem, Json } from '@/types';
import { toast } from 'sonner';

interface VocabularyHighlighterProps {
  exercise: Exercise;
}

const VocabularyHighlighter: React.FC<VocabularyHighlighterProps> = ({ exercise }) => {
  const { addVocabularyItem, vocabularyItems } = useVocabularyContext();
  const [selectedText, setSelectedText] = useState<string>('');
  const [definition, setDefinition] = useState<string>('');
  const [exampleSentence, setExampleSentence] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);

  useEffect(() => {
    // Reset form when exercise changes
    setSelectedText('');
    setDefinition('');
    setExampleSentence('');
    setShowForm(false);
  }, [exercise]);

  // Helper to get the sentence containing the selected text
  const getSentenceFromText = (text: string, selectedWord: string): string => {
    if (!text || !selectedWord) return '';
    
    const sentences = text.split(/(?<=[.!?;:])\s+/);
    const sentence = sentences.find(s => s.includes(selectedWord));
    return sentence || '';
  };

  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') return;

    const selectedText = selection.toString().trim();
    if (selectedText.length > 50) {
      toast.warning('Please select a shorter phrase (max 50 characters)');
      return;
    }

    setSelectedText(selectedText);
    
    // Get the sentence containing the selected word
    const extractedSentence = getSentenceFromText(exercise.text, selectedText);
    setExampleSentence(extractedSentence);
    
    // Show the form
    setShowForm(true);
  };

  // Generate AI definition
  const generateDefinition = async () => {
    if (!selectedText) return;

    setIsGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-vocabulary-info', {
        body: { 
          word: selectedText,
          context: exercise.text,
          language: exercise.language
        }
      });

      if (error) throw error;
      
      if (data && data.definition) {
        setDefinition(data.definition);
        if (data.example && !exampleSentence) {
          setExampleSentence(data.example);
        }
        toast.success('Definition generated');
      } else {
        toast.error('Could not generate definition');
      }
    } catch (error) {
      console.error('Error generating definition:', error);
      toast.error('Failed to generate definition');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Save vocabulary item
  const saveVocabularyItem = async () => {
    if (!selectedText || !definition || !exampleSentence) {
      toast.warning('Please fill in all fields');
      return;
    }

    try {
      // Make sure we're using the correct property name (userId) that matches VocabularyItem type
      await addVocabularyItem({
        word: selectedText,
        definition,
        exampleSentence,
        language: exercise.language,
        userId: exercise.userId,
        exercise_id: exercise.id, // Use exercise_id instead of exerciseId
      });
      
      toast.success('Vocabulary item saved');
      
      // Reset form
      setSelectedText('');
      setDefinition('');
      setExampleSentence('');
      setShowForm(false);
    } catch (error) {
      console.error('Error saving vocabulary item:', error);
      toast.error('Failed to save vocabulary item');
    }
  };

  // Check if word is already in vocabulary
  const isWordInVocabulary = (word: string): boolean => {
    return vocabularyItems.some(item => 
      item.word.toLowerCase() === word.toLowerCase() && 
      item.language === exercise.language
    );
  };

  // Close the form
  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedText('');
    setDefinition('');
    setExampleSentence('');
  };

  return (
    <div>
      <div 
        className="text-muted-foreground mb-4"
        onMouseUp={handleTextSelection} 
      >
        Select any word or phrase to add to your vocabulary list.
      </div>
      
      {showForm && (
        <div className="bg-muted/30 p-4 rounded-lg border mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Add to Vocabulary</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCloseForm}
            >
              ×
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="selected-word">Selected Word/Phrase</Label>
              <Input 
                id="selected-word" 
                value={selectedText} 
                onChange={(e) => setSelectedText(e.target.value)} 
                className="mt-1"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="definition">Definition</Label>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={generateDefinition}
                  disabled={isGeneratingAI}
                >
                  {isGeneratingAI ? 'Generating...' : 'Generate AI Definition'}
                </Button>
              </div>
              <Textarea 
                id="definition" 
                value={definition} 
                onChange={(e) => setDefinition(e.target.value)} 
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="example">Example Sentence</Label>
              <Textarea 
                id="example" 
                value={exampleSentence} 
                onChange={(e) => setExampleSentence(e.target.value)} 
                className="mt-1"
                rows={2}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                onClick={handleCloseForm}
                variant="outline"
              >
                Cancel
              </Button>
              <Button 
                onClick={saveVocabularyItem} 
                disabled={!selectedText || !definition || !exampleSentence || isWordInVocabulary(selectedText)}
              >
                {isWordInVocabulary(selectedText) ? 'Already in Vocabulary' : 'Add to Vocabulary'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VocabularyHighlighter;
