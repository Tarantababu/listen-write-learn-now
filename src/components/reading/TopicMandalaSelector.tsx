
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Plus, X } from 'lucide-react';

interface TopicMandalaSelectorProps {
  selectedTopic: string;
  onTopicSelect: (topic: string) => void;
  language: string;
}

const TOPIC_SUGGESTIONS = [
  'Travel & Culture',
  'Food & Cooking',
  'Technology',
  'Health & Fitness',
  'Environment',
  'History',
  'Science',
  'Art & Literature',
  'Business',
  'Sports',
  'Education',
  'Family & Relationships'
];

export const TopicMandalaSelector: React.FC<TopicMandalaSelectorProps> = ({
  selectedTopic,
  onTopicSelect,
  language
}) => {
  const [customTopic, setCustomTopic] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleTopicClick = (topic: string) => {
    onTopicSelect(topic);
  };

  const handleCustomSubmit = () => {
    if (customTopic.trim()) {
      onTopicSelect(customTopic.trim());
      setCustomTopic('');
      setShowCustomInput(false);
    }
  };

  const clearSelection = () => {
    onTopicSelect('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">Topic Selection</Label>
          <p className="text-sm text-muted-foreground">
            Choose a topic for your {language} reading exercise
          </p>
        </div>
        {selectedTopic && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {selectedTopic && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Selected Topic:</span>
            <Badge variant="default">{selectedTopic}</Badge>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Suggested Topics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {TOPIC_SUGGESTIONS.map((topic) => (
              <Badge
                key={topic}
                variant={selectedTopic === topic ? "default" : "outline"}
                className="cursor-pointer p-2 justify-center hover:bg-muted transition-colors"
                onClick={() => handleTopicClick(topic)}
              >
                {topic}
              </Badge>
            ))}
          </div>

          <div className="pt-2 border-t">
            {!showCustomInput ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCustomInput(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Topic
              </Button>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter your custom topic..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
                  autoFocus
                />
                <Button size="sm" onClick={handleCustomSubmit} disabled={!customTopic.trim()}>
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomTopic('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
