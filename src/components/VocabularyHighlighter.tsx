
// Create a fixed version of VocabularyHighlighter

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { Exercise, VocabularyItem, Language } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface VocabularyHighlighterProps {
  exercise: Exercise;
}

const VocabularyHighlighter: React.FC<VocabularyHighlighterProps> = ({ exercise }) => {
  const { user } = useAuth();
  const { vocabularyItems, addVocabularyItem } = useVocabularyContext();

  const [selectedWord, setSelectedWord] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [definition, setDefinition] = useState<string>('');
  const [example, setExample] = useState<string>('');
  const [sentence, setSentence] = useState<string>('');

  // Reset the form when the dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setDefinition('');
      setExample('');
      setShowAddForm(false);
    }
  }, [isDialogOpen]);

  const handleTextSelection = () => {
    const selectedText = window.getSelection()?.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      // Get the sentence context
      const fullText = exercise.text;
      const wordIndex = fullText.indexOf(selectedText);
      
      if (wordIndex !== -1) {
        // Extract a reasonable context (up to 100 chars before and after)
        const sentenceStart = Math.max(0, wordIndex - 100);
        const sentenceEnd = Math.min(fullText.length, wordIndex + selectedText.length + 100);
        const extractedSentence = fullText.substring(sentenceStart, sentenceEnd);
        
        setSelectedWord(selectedText);
        setSentence(extractedSentence);
        setIsDialogOpen(true);
      }
    }
  };

  const handleAddVocabulary = async () => {
    if (!user) return;

    try {
      // Create vocabulary item
      await addVocabularyItem({
        word: selectedWord,
        definition: definition,
        exampleSentence: example || sentence,
        language: exercise.language,
        userId: user.id,
        createdAt: new Date().toISOString(),
        exercise_id: exercise.id
      });

      setIsDialogOpen(false);
      setShowAddForm(false);
      
      // Reset form
      setDefinition('');
      setExample('');
    } catch (error) {
      console.error('Error adding vocabulary:', error);
    }
  };

  // Get existing vocabulary for this word in this exercise
  const existingVocabulary = vocabularyItems?.filter(
    (item) => item.word.toLowerCase() === selectedWord.toLowerCase() && 
              item.language === exercise.language
  );

  return (
    <div className="mt-4">
      <div
        className="prose max-w-none dark:prose-invert cursor-text"
        onClick={handleTextSelection}
      >
        <p>{exercise.text}</p>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedWord ? `"${selectedWord}"` : 'Selected Word'}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {existingVocabulary && existingVocabulary.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Already in your vocabulary:</h3>
                  {existingVocabulary.map((item) => (
                    <div key={item.id} className="mt-2 p-3 border rounded-md">
                      <p className="font-medium">{item.word}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.definition}
                      </p>
                      <p className="text-xs italic mt-2">{item.exampleSentence}</p>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAddForm(true)}
                >
                  Add a new definition
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p>
                  Add <strong>{selectedWord}</strong> to your vocabulary:
                </p>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Definition:
                  </label>
                  <Textarea
                    value={definition}
                    onChange={(e) => setDefinition(e.target.value)}
                    placeholder="Enter the definition"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Example sentence:
                  </label>
                  <Textarea
                    value={example}
                    onChange={(e) => setExample(e.target.value)}
                    placeholder={sentence}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    You can use the context or write your own example
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddVocabulary} disabled={!definition.trim()}>
                    Add to Vocabulary
                  </Button>
                </div>
              </div>
            )}

            {showAddForm && (
              <div className="space-y-4 mt-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    New Definition:
                  </label>
                  <Textarea
                    value={definition}
                    onChange={(e) => setDefinition(e.target.value)}
                    placeholder="Enter another definition"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Example sentence:
                  </label>
                  <Textarea
                    value={example}
                    onChange={(e) => setExample(e.target.value)}
                    placeholder={sentence}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddVocabulary} disabled={!definition.trim()}>
                    Add to Vocabulary
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VocabularyHighlighter;
