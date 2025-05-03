
import React, { useState } from 'react';
import { VocabularyItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { toast } from 'sonner';
import { PlayCircle, PauseCircle, XCircle } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import UpgradePrompt from './UpgradePrompt';

interface VocabularyPlaylistProps {
  vocabulary: VocabularyItem[];
  showForm: boolean;
  onCloseForm: () => void;
}

const VocabularyPlaylist = ({ vocabulary, showForm, onCloseForm }: VocabularyPlaylistProps) => {
  const { addVocabularyItem, canCreateMore } = useVocabularyContext();
  const { settings } = useUserSettingsContext();
  const { subscription } = useSubscription();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formData, setFormData] = useState({
    word: '',
    definition: '',
    exampleSentence: '',
  });

  const handlePlay = () => {
    if (!vocabulary.length) {
      toast.error('No vocabulary to play');
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canCreateMore) {
      toast.error('You have reached your vocabulary limit. Upgrade to premium for unlimited vocabulary.');
      return;
    }

    try {
      const { word, definition, exampleSentence } = formData;
      
      if (!word.trim() || !definition.trim() || !exampleSentence.trim()) {
        toast.error('Please fill in all fields');
        return;
      }

      const newItem = await addVocabularyItem({
        word,
        definition,
        exampleSentence,
        language: settings.selectedLanguage,
        exerciseId: '',
      });

      setFormData({
        word: '',
        definition: '',
        exampleSentence: '',
      });
      
      onCloseForm();
      toast.success('Vocabulary added successfully');
    } catch (error) {
      console.error('Error adding vocabulary:', error);
    }
  };

  // Show upgrade prompt if user reached limit and trying to add more
  if (showForm && !canCreateMore) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Add Vocabulary</CardTitle>
        </CardHeader>
        <CardContent>
          <UpgradePrompt
            title="Vocabulary Limit Reached"
            message={`You've reached the limit of ${subscription.isSubscribed ? 'unlimited' : '5'} vocabulary items. Upgrade to premium for unlimited vocabulary.`}
          />
          <Button
            variant="outline" 
            onClick={onCloseForm} 
            className="w-full mt-4"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Add Vocabulary</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="word">Word/Phrase</Label>
              <Input
                id="word"
                name="word"
                value={formData.word}
                onChange={handleInputChange}
                placeholder="Enter word or phrase"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="definition">Definition</Label>
              <Input
                id="definition"
                name="definition"
                value={formData.definition}
                onChange={handleInputChange}
                placeholder="Enter definition"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exampleSentence">Example Sentence</Label>
              <Textarea
                id="exampleSentence"
                name="exampleSentence"
                value={formData.exampleSentence}
                onChange={handleInputChange}
                placeholder="Enter an example sentence"
                required
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit">Add Word</Button>
              <Button variant="outline" type="button" onClick={onCloseForm}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Practice Playlist</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              {vocabulary.length === 0
                ? 'Add vocabulary words to practice'
                : `${vocabulary.length} words available for practice`}
            </p>
            <Button
              onClick={handlePlay}
              variant="outline"
              className="w-full"
              disabled={vocabulary.length === 0}
            >
              {isPlaying ? (
                <>
                  <PauseCircle className="mr-2 h-4 w-4" /> Pause Playback
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" /> Start Playback
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VocabularyPlaylist;
