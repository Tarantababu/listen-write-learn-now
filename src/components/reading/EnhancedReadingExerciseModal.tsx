
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, Eye, Mic, Settings, X } from 'lucide-react';
import { Exercise, Language } from '@/types';
import { EnhancedInteractiveText } from './EnhancedInteractiveText';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

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
      <DialogContent className={`${isMobile ? 'w-full h-full max-w-full max-h-full m-0 rounded-none' : 'max-w-4xl max-h-[90vh]'} overflow-hidden flex flex-col`}>
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
            
            {enableAdvancedFeatures && !isMobile && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePreference('textSelection')}
                  className={userPreferences.textSelection ? 'bg-blue-50 text-blue-600' : ''}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Selection
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePreference('vocabularyIntegration')}
                  className={userPreferences.vocabularyIntegration ? 'bg-green-50 text-green-600' : ''}
                >
                  <Book className="h-4 w-4 mr-1" />
                  Vocab
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePreference('enhancedHighlighting')}
                  className={userPreferences.enhancedHighlighting ? 'bg-purple-50 text-purple-600' : ''}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Highlight
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {enableAdvancedFeatures ? (
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
