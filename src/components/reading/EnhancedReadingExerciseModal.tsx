
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, BookOpen, Volume2, Brain, Sparkles, X } from 'lucide-react';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { readingExerciseService } from '@/services/readingExerciseService';
import { TopicMandala } from './TopicMandala';
import { toast } from 'sonner';

interface EnhancedReadingExerciseModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TARGET_LENGTH_OPTIONS = [
  { value: 80, label: 'Quick Read', time: '30s', description: 'Perfect for daily practice' },
  { value: 120, label: 'Standard', time: '45s', description: 'Balanced length for learning' },
  { value: 200, label: 'Extended', time: '1m', description: 'Deep dive into topics' },
  { value: 300, label: 'Comprehensive', time: '1.5m', description: 'Full story experience' },
  { value: 500, label: 'Immersive', time: '2.5m', description: 'Advanced reading practice' },
];

const GRAMMAR_FOCUS_OPTIONS = [
  { id: 'past-tense', label: 'Past Tense', description: 'Simple past, past continuous, past perfect' },
  { id: 'future-tense', label: 'Future Tense', description: 'Will, going to, future continuous' },
  { id: 'conditionals', label: 'Conditionals', description: 'If clauses, hypothetical situations' },
  { id: 'passive-voice', label: 'Passive Voice', description: 'Passive constructions and usage' },
  { id: 'subjunctive', label: 'Subjunctive Mood', description: 'Wishes, hypotheticals, formal speech' },
  { id: 'articles', label: 'Articles', description: 'Definite and indefinite articles' },
  { id: 'prepositions', label: 'Prepositions', description: 'Time, place, and direction prepositions' },
  { id: 'pronouns', label: 'Pronouns', description: 'Personal, possessive, reflexive pronouns' },
  { id: 'modal-verbs', label: 'Modal Verbs', description: 'Can, could, should, must, might' },
  { id: 'relative-clauses', label: 'Relative Clauses', description: 'Who, which, that, where, when' },
];

export const EnhancedReadingExerciseModal: React.FC<EnhancedReadingExerciseModalProps> = ({
  isOpen,
  onOpenChange,
  onSuccess
}) => {
  const { settings } = useUserSettingsContext();
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('topic');
  const [selectedGrammarFocus, setSelectedGrammarFocus] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    difficulty_level: 'beginner' as const,
    target_length: 120,
    custom_grammar_focus: ''
  });

  const handleTopicSelect = (topic: string) => {
    setFormData(prev => ({ 
      ...prev, 
      topic,
      title: prev.title || `${topic} Practice`
    }));
    setCurrentTab('details');
  };

  const handleGrammarToggle = (grammarId: string) => {
    setSelectedGrammarFocus(prev => 
      prev.includes(grammarId) 
        ? prev.filter(id => id !== grammarId)
        : [...prev, grammarId]
    );
  };

  const removeGrammarFocus = (grammarId: string) => {
    setSelectedGrammarFocus(prev => prev.filter(id => id !== grammarId));
  };

  const getSelectedGrammarLabels = () => {
    return GRAMMAR_FOCUS_OPTIONS
      .filter(option => selectedGrammarFocus.includes(option.id))
      .map(option => option.label);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const grammarFocus = [
        ...getSelectedGrammarLabels(),
        ...(formData.custom_grammar_focus ? [formData.custom_grammar_focus] : [])
      ].join(', ');

      await readingExerciseService.createReadingExercise({
        ...formData,
        language: settings.selectedLanguage,
        grammar_focus: grammarFocus || undefined
      });
      
      toast.success('Reading exercise created successfully!');
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        title: '',
        topic: '',
        difficulty_level: 'beginner',
        target_length: 120,
        custom_grammar_focus: ''
      });
      setSelectedGrammarFocus([]);
      setCurrentTab('topic');
    } catch (error) {
      console.error('Error creating reading exercise:', error);
      toast.error('Failed to create reading exercise. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentTab) {
      case 'topic': return !!formData.topic;
      case 'details': return !!formData.title;
      case 'grammar': return true; // Grammar is optional
      default: return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Create AI-Powered Reading & Listening Exercise
          </DialogTitle>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="topic">1. Choose Topic</TabsTrigger>
            <TabsTrigger value="details" disabled={!formData.topic}>
              2. Configure
            </TabsTrigger>
            <TabsTrigger value="grammar" disabled={!formData.title}>
              3. Grammar Focus
            </TabsTrigger>
          </TabsList>

          <TabsContent value="topic" className="space-y-6">
            <TopicMandala 
              onTopicSelect={handleTopicSelect}
              selectedTopic={formData.topic}
            />
            
            <div className="space-y-3">
              <Label htmlFor="custom-topic">Or enter a custom topic</Label>
              <Input
                id="custom-topic"
                value={formData.topic}
                onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="e.g., sustainable living, digital nomads, cooking traditions"
              />
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => setCurrentTab('details')}
                disabled={!canProceedToNext()}
              >
                Next: Configure Exercise
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
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

              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>Reading Length</Label>
                  <div className="grid gap-2">
                    {TARGET_LENGTH_OPTIONS.map((option) => (
                      <Card 
                        key={option.value}
                        className={`cursor-pointer transition-all hover:shadow-sm ${
                          formData.target_length === option.value 
                            ? 'ring-2 ring-primary bg-primary/5' 
                            : 'hover:bg-muted/30'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, target_length: option.value }))}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{option.label} ({option.value} words)</div>
                              <div className="text-xs text-muted-foreground">
                                ~{option.time} • {option.description}
                              </div>
                            </div>
                            <div className="text-xs bg-muted px-2 py-1 rounded">
                              {option.time}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentTab('topic')}>
                Back: Topic
              </Button>
              <Button 
                onClick={() => setCurrentTab('grammar')}
                disabled={!canProceedToNext()}
              >
                Next: Grammar Focus
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="grammar" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Grammar Focus (Optional)</h3>
                <p className="text-sm text-muted-foreground">
                  Select specific grammar points to emphasize in your reading exercise
                </p>
              </div>

              {selectedGrammarFocus.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Grammar Points</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedGrammarFocus.map((grammarId) => {
                      const option = GRAMMAR_FOCUS_OPTIONS.find(opt => opt.id === grammarId);
                      return (
                        <Badge 
                          key={grammarId} 
                          variant="secondary" 
                          className="flex items-center gap-1"
                        >
                          {option?.label}
                          <X 
                            className="h-3 w-3 cursor-pointer hover:text-destructive" 
                            onClick={() => removeGrammarFocus(grammarId)}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                {GRAMMAR_FOCUS_OPTIONS.map((option) => (
                  <Card key={option.id} className="cursor-pointer hover:bg-muted/30">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedGrammarFocus.includes(option.id)}
                          onCheckedChange={() => handleGrammarToggle(option.id)}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{option.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-grammar">Custom Grammar Focus</Label>
                <Input
                  id="custom-grammar"
                  value={formData.custom_grammar_focus}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_grammar_focus: e.target.value }))}
                  placeholder="e.g., reflexive verbs, modal verbs, question formation"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentTab('details')}>
                Back: Configure
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
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
          </TabsContent>
        </Tabs>

        <div className="grid gap-3 md:grid-cols-3 pt-6 border-t">
          <Card className="p-3">
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

          <Card className="p-3">
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

          <Card className="p-3">
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
      </DialogContent>
    </Dialog>
  );
};
