
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, Eye, Mic, Settings, X } from 'lucide-react';
import { Exercise, Language } from '@/types';
import { EnhancedInteractiveText } from './EnhancedInteractiveText';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface EnhancedReadingExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise;
  onCreateDictation?: (selectedText: string) => void;
  onCreateBidirectional?: (selectedText: string) => void;
  // Feature flags for gradual rollout
  enableTextSelection?: boolean;
  enableVocabularyIntegration?: boolean;
  enableEnhancedHighlighting?: boolean;
  enableAdvancedFeatures?: boolean;
}

export const EnhancedReadingExerciseModal: React.FC<EnhancedReadingExerciseModalProps> = ({
  isOpen,
  onClose,
  exercise,
  onCreateDictation,
  onCreateBidirectional,
  // Default feature flags to false for backward compatibility
  enableTextSelection = false,
  enableVocabularyIntegration = false,
  enableEnhancedHighlighting = false,
  enableAdvancedFeatures = false
}) => {
  const [activeView, setActiveView] = useState<'read' | 'practice'>('read');
  const [userPreferences, setUserPreferences] = useState({
    textSelection: enableTextSelection,
    vocabularyIntegration: enableVocabularyIntegration,
    enhancedHighlighting: enableEnhancedHighlighting,
  });
  const isMobile = useIsMobile();

  // Handle backward compatibility
  useEffect(() => {
    if (!enableAdvancedFeatures) {
      // Reset to basic functionality if advanced features are disabled
      setUserPreferences({
        textSelection: false,
        vocabularyIntegration: false,
        enhancedHighlighting: false,
      });
    }
  }, [enableAdvancedFeatures]);

  const handleCreateDictation = (selectedText: string) => {
    if (onCreateDictation) {
      onCreateDictation(selectedText);
    } else {
      // Default behavior - show success message
      toast.success(`Ready to create dictation exercise for: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`);
    }
  };

  const handleCreateBidirectional = (selectedText: string) => {
    if (onCreateBidirectional) {
      onCreateBidirectional(selectedText);
    } else {
      // Default behavior - show success message
      toast.success(`Ready to create translation exercise for: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`);
    }
  };

  const togglePreference = (key: keyof typeof userPreferences) => {
    if (!enableAdvancedFeatures) return;
    
    setUserPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'w-full h-full max-w-full max-h-full m-0 rounded-none' : 'max-w-6xl max-h-[90vh]'} overflow-hidden flex flex-col`}>
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Book className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">{exercise.title}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {exercise.language}
                  </Badge>
                  {enableAdvancedFeatures && (
                    <Badge variant="outline" className="text-xs">
                      Enhanced
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden md:p-6 md:bg-muted/5">
          {enableAdvancedFeatures ? (
            isMobile ? (
            <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'read' | 'practice')} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                <TabsTrigger value="read" className="flex items-center gap-2">
                  <Book className="h-4 w-4" />
                  Reading
                </TabsTrigger>
                <TabsTrigger value="practice" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Practice
                </TabsTrigger>
              </TabsList>

              <TabsContent value="read" className="flex-1 overflow-auto mt-4">
                <Card className="p-6 h-full">
                  <EnhancedInteractiveText
                    text={exercise.text}
                    language={exercise.language}
                    enableTooltips={true}
                    enableBidirectionalCreation={true}
                    enableTextSelection={userPreferences.textSelection}
                    vocabularyIntegration={userPreferences.vocabularyIntegration}
                    enhancedHighlighting={userPreferences.enhancedHighlighting}
                    exerciseId={exercise.id}
                    onCreateDictation={handleCreateDictation}
                    onCreateBidirectional={handleCreateBidirectional}
                  />
                </Card>
              </TabsContent>

              <TabsContent value="practice" className="flex-1 overflow-auto mt-4">
                <Card className="p-6 h-full">
                  <div className="text-center text-gray-500">
                    <Mic className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Practice mode integration coming soon...</p>
                    <p className="text-sm mt-2">This will integrate with the existing practice modal.</p>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                <div className="lg:col-span-2 h-full overflow-hidden flex flex-col">
                    <Card className="p-6 h-full overflow-y-auto">
                        <EnhancedInteractiveText
                            text={exercise.text}
                            language={exercise.language}
                            enableTooltips={true}
                            enableBidirectionalCreation={true}
                            enableTextSelection={userPreferences.textSelection}
                            vocabularyIntegration={userPreferences.vocabularyIntegration}
                            enhancedHighlighting={userPreferences.enhancedHighlighting}
                            exerciseId={exercise.id}
                            onCreateDictation={handleCreateDictation}
                            onCreateBidirectional={handleCreateBidirectional}
                        />
                    </Card>
                </div>
                <div className="lg:col-span-1 h-full overflow-y-auto space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Mic className="h-5 w-5" />
                            Practice Mode
                        </h3>
                        <div className="text-center text-muted-foreground border rounded-lg p-6 bg-muted/20">
                            <Mic className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                            <p className="font-medium">Coming Soon</p>
                            <p className="text-sm mt-1">Interactive practice will be available here.</p>
                        </div>
                    </Card>
                    <Card>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Display Options
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="text-selection" className="flex flex-col space-y-1 pr-4">
                                        <span>Text Selection</span>
                                        <span className="font-normal leading-snug text-muted-foreground text-xs">
                                            Highlight text to create new exercises.
                                        </span>
                                    </Label>
                                    <Switch id="text-selection" checked={userPreferences.textSelection} onCheckedChange={() => togglePreference('textSelection')} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="vocab-integration" className="flex flex-col space-y-1 pr-4">
                                        <span>Vocabulary Help</span>
                                        <span className="font-normal leading-snug text-muted-foreground text-xs">
                                            Show definitions for known vocabulary.
                                        </span>
                                    </Label>
                                    <Switch id="vocab-integration" checked={userPreferences.vocabularyIntegration} onCheckedChange={() => togglePreference('vocabularyIntegration')} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="enhanced-highlighting" className="flex flex-col space-y-1 pr-4">
                                        <span>Enhanced Highlighting</span>
                                        <span className="font-normal leading-snug text-muted-foreground text-xs">
                                            Apply advanced visual styles to highlights.
                                        </span>
                                    </Label>
                                    <Switch id="enhanced-highlighting" checked={userPreferences.enhancedHighlighting} onCheckedChange={() => togglePreference('enhancedHighlighting')} />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
            )
          ) : (
            // Fallback to basic reading view for backward compatibility
            <div className="h-full overflow-auto p-6">
              <Card className="p-6 h-full">
                <EnhancedInteractiveText
                  text={exercise.text}
                  language={exercise.language}
                  enableTooltips={true}
                  enableBidirectionalCreation={true}
                  // All advanced features disabled for backward compatibility
                  enableTextSelection={false}
                  vocabularyIntegration={false}
                  enhancedHighlighting={false}
                  exerciseId={exercise.id}
                  onCreateDictation={handleCreateDictation}
                  onCreateBidirectional={handleCreateBidirectional}
                />
              </Card>
            </div>
          )}
        </div>

        {/* Mobile preferences panel */}
        {enableAdvancedFeatures && isMobile && (
          <div className="flex-shrink-0 border-t p-4 bg-gray-50">
            <div className="flex justify-center gap-2">
              <Button
                variant={userPreferences.textSelection ? 'default' : 'outline'}
                size="sm"
                onClick={() => togglePreference('textSelection')}
              >
                <Eye className="h-4 w-4 mr-1" />
                Selection
              </Button>
              <Button
                variant={userPreferences.vocabularyIntegration ? 'default' : 'outline'}
                size="sm"
                onClick={() => togglePreference('vocabularyIntegration')}
              >
                <Book className="h-4 w-4 mr-1" />
                Vocab
              </Button>
              <Button
                variant={userPreferences.enhancedHighlighting ? 'default' : 'outline'}
                size="sm"
                onClick={() => togglePreference('enhancedHighlighting')}
              >
                <Settings className="h-4 w-4 mr-1" />
                Highlight
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
