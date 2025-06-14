
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, Volume2, Brain, Sparkles } from 'lucide-react';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { readingExerciseService } from '@/services/readingExerciseService';
import { toast } from 'sonner';

interface ReadingExerciseModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TOPIC_SUGGESTIONS = [
  { value: 'daily-routines', label: 'Daily Routines', description: 'Morning habits, work schedules, evening activities' },
  { value: 'travel-culture', label: 'Travel & Culture', description: 'Exploring new places, cultural experiences' },
  { value: 'food-cooking', label: 'Food & Cooking', description: 'Recipes, restaurants, culinary traditions' },
  { value: 'technology', label: 'Technology', description: 'Digital life, social media, gadgets' },
  { value: 'environment', label: 'Environment', description: 'Climate change, sustainability, nature' },
  { value: 'health-fitness', label: 'Health & Fitness', description: 'Exercise, nutrition, mental wellness' },
  { value: 'education', label: 'Education', description: 'Learning, schools, academic life' },
  { value: 'business', label: 'Business', description: 'Work life, entrepreneurship, economics' },
  { value: 'hobbies', label: 'Hobbies & Interests', description: 'Sports, arts, music, reading' },
  { value: 'family-relationships', label: 'Family & Relationships', description: 'Social connections, friendships, family life' }
];

const GRAMMAR_SUGGESTIONS = [
  { value: 'past-tense', label: 'Past Tense', description: 'Simple past, past continuous, past perfect' },
  { value: 'future-tense', label: 'Future Tense', description: 'Will, going to, future continuous' },
  { value: 'conditionals', label: 'Conditionals', description: 'If clauses, hypothetical situations' },
  { value: 'passive-voice', label: 'Passive Voice', description: 'Passive constructions and usage' },
  { value: 'subjunctive', label: 'Subjunctive Mood', description: 'Wishes, hypotheticals, formal speech' },
  { value: 'articles', label: 'Articles', description: 'Definite and indefinite articles' },
  { value: 'prepositions', label: 'Prepositions', description: 'Time, place, and direction prepositions' },
  { value: 'pronouns', label: 'Pronouns', description: 'Personal, possessive, reflexive pronouns' }
];

export const ReadingExerciseModal: React.FC<ReadingExerciseModalProps> = ({
  isOpen,
  onOpenChange,
  onSuccess
}) => {
  const { settings } = useUserSettingsContext();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTopicSuggestion, setSelectedTopicSuggestion] = useState('');
  const [selectedGrammarSuggestion, setSelectedGrammarSuggestion] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    difficulty_level: 'beginner' as const,
    target_length: 120,
    grammar_focus: ''
  });

  const handleTopicSuggestionSelect = (value: string) => {
    setSelectedTopicSuggestion(value);
    const suggestion = TOPIC_SUGGESTIONS.find(t => t.value === value);
    if (suggestion) {
      setFormData(prev => ({ 
        ...prev, 
        topic: suggestion.label,
        title: prev.title || `${suggestion.label} Practice`
      }));
    }
  };

  const handleGrammarSuggestionSelect = (value: string) => {
    setSelectedGrammarSuggestion(value);
    const suggestion = GRAMMAR_SUGGESTIONS.find(g => g.value === value);
    if (suggestion) {
      setFormData(prev => ({ 
        ...prev, 
        grammar_focus: suggestion.label
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await readingExerciseService.createReadingExercise({
        ...formData,
        language: settings.selectedLanguage
      });
      
      toast.success('Reading exercise created successfully!');
      onSuccess();
      onOpenChange(false);
      setFormData({
        title: '',
        topic: '',
        difficulty_level: 'beginner',
        target_length: 120,
        grammar_focus: ''
      });
      setSelectedTopicSuggestion('');
      setSelectedGrammarSuggestion('');
    } catch (error) {
      console.error('Error creating reading exercise:', error);
      toast.error('Failed to create reading exercise. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Create AI-Powered Reading & Listening Exercise
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Feature highlights */}
          <div className="grid gap-3 md:grid-cols-3">
            <Card className="p-4">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  AI-Generated Content
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <CardDescription className="text-xs">
                  Custom reading passages tailored to your level and interests
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-green-500" />
                  Interactive Audio
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <CardDescription className="text-xs">
                  Click any word for pronunciation and meaning
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  Deep Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <CardDescription className="text-xs">
                  Word definitions, grammar explanations, and translations
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Exercise Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Daily Routines in Paris"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label>Topic Suggestions</Label>
                  <Select value={selectedTopicSuggestion} onValueChange={handleTopicSuggestionSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose from popular topics..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TOPIC_SUGGESTIONS.map((topic) => (
                        <SelectItem key={topic.value} value={topic.value}>
                          <div>
                            <div className="font-medium">{topic.label}</div>
                            <div className="text-xs text-muted-foreground">{topic.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="space-y-2">
                    <Label htmlFor="custom-topic">Or enter custom topic</Label>
                    <Input
                      id="custom-topic"
                      value={formData.topic}
                      onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                      placeholder="e.g., sustainable living, digital nomads, cooking traditions"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={formData.difficulty_level}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, difficulty_level: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">
                        <div>
                          <div className="font-medium">Beginner (A1-A2)</div>
                          <div className="text-xs text-muted-foreground">Simple vocabulary and basic grammar</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="intermediate">
                        <div>
                          <div className="font-medium">Intermediate (B1-B2)</div>
                          <div className="text-xs text-muted-foreground">Complex sentences and varied vocabulary</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="advanced">
                        <div>
                          <div className="font-medium">Advanced (C1-C2)</div>
                          <div className="text-xs text-muted-foreground">Sophisticated language and cultural nuances</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="length">Reading Length</Label>
                  <Select
                    value={formData.target_length.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, target_length: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="80">
                        <div>
                          <div className="font-medium">Quick Read (80 words)</div>
                          <div className="text-xs text-muted-foreground">~30 seconds • Perfect for daily practice</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="120">
                        <div>
                          <div className="font-medium">Standard (120 words)</div>
                          <div className="text-xs text-muted-foreground">~45 seconds • Balanced length</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="200">
                        <div>
                          <div className="font-medium">Extended (200 words)</div>
                          <div className="text-xs text-muted-foreground">~1 minute • Deep dive into topics</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="300">
                        <div>
                          <div className="font-medium">Comprehensive (300 words)</div>
                          <div className="text-xs text-muted-foreground">~1.5 minutes • Full story experience</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Grammar Focus (Optional)</Label>
                  <Select value={selectedGrammarSuggestion} onValueChange={handleGrammarSuggestionSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Target specific grammar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {GRAMMAR_SUGGESTIONS.map((grammar) => (
                        <SelectItem key={grammar.value} value={grammar.value}>
                          <div>
                            <div className="font-medium">{grammar.label}</div>
                            <div className="text-xs text-muted-foreground">{grammar.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="space-y-2">
                    <Label htmlFor="custom-grammar">Or specify custom focus</Label>
                    <Input
                      id="custom-grammar"
                      value={formData.grammar_focus}
                      onChange={(e) => setFormData(prev => ({ ...prev, grammar_focus: e.target.value }))}
                      placeholder="e.g., reflexive verbs, modal verbs, question formation"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Exercise
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
