
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  Volume2, 
  Brain, 
  Sparkles, 
  Play, 
  Settings,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { EnhancedInteractiveText } from './EnhancedInteractiveText';
import { getReadingFeatureFlags } from '@/utils/featureFlags';
import { toast } from 'sonner';

interface EnhancedReadingDemoProps {
  onStartFullExercise?: () => void;
}

export const EnhancedReadingDemo: React.FC<EnhancedReadingDemoProps> = ({
  onStartFullExercise
}) => {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const featureFlags = getReadingFeatureFlags();

  const demoText = "The fascinating world of artificial intelligence continues to evolve rapidly. Machine learning algorithms are becoming increasingly sophisticated, enabling computers to process natural language with remarkable accuracy. This technological advancement opens new possibilities for human-computer interaction and automated text analysis.";

  const demoWords = [
    { word: "fascinating", definition: "extremely interesting", partOfSpeech: "adjective" },
    { word: "artificial", definition: "made by humans; not natural", partOfSpeech: "adjective" },
    { word: "intelligence", definition: "the ability to learn and understand", partOfSpeech: "noun" },
    { word: "sophisticated", definition: "advanced and complex", partOfSpeech: "adjective" },
    { word: "algorithms", definition: "step-by-step procedures for calculations", partOfSpeech: "noun" }
  ];

  const features = [
    {
      id: 'textSelection',
      name: 'Smart Text Selection',
      icon: Sparkles,
      enabled: featureFlags.enableTextSelection,
      description: 'Select any text to create exercises',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'wordSync',
      name: 'Word Synchronization',
      icon: Volume2,
      enabled: featureFlags.enableWordSynchronization,
      description: 'Audio synced with word highlighting',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      id: 'contextMenu',
      name: 'Context Menus',
      icon: Brain,
      enabled: featureFlags.enableContextMenu,
      description: 'Right-click for instant options',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      id: 'feedback',
      name: 'Live Feedback',
      icon: CheckCircle,
      enabled: featureFlags.enableSelectionFeedback,
      description: 'Real-time selection guidance',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    }
  ];

  const handleCreateDictation = (selectedText: string) => {
    toast.success(`Dictation exercise created for: "${selectedText.substring(0, 30)}..."`);
  };

  const handleCreateBidirectional = (selectedText: string) => {
    toast.success(`Translation exercise created for: "${selectedText.substring(0, 30)}..."`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="text-center p-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-xl">Enhanced Reading Experience</CardTitle>
          </div>
          <CardDescription>
            Experience all the advanced features working together in perfect harmony
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    activeFeature === feature.id 
                      ? `${feature.bgColor} border-current ${feature.color}` 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveFeature(activeFeature === feature.id ? null : feature.id)}
                >
                  <Icon className={`h-5 w-5 mx-auto mb-2 ${feature.enabled ? feature.color : 'text-gray-400'}`} />
                  <div className="text-xs font-medium">{feature.name}</div>
                  <Badge 
                    variant={feature.enabled ? "default" : "secondary"} 
                    className="text-xs mt-1"
                  >
                    {feature.enabled ? "Active" : "Coming Soon"}
                  </Badge>
                </div>
              );
            })}
          </div>
          
          {activeFeature && (
            <div className="text-left bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold mb-2">
                {features.find(f => f.id === activeFeature)?.name}
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                {features.find(f => f.id === activeFeature)?.description}
              </p>
              <div className="text-xs text-gray-500">
                {activeFeature === 'textSelection' && "Try selecting any part of the text below to see the magic happen!"}
                {activeFeature === 'wordSync' && "Audio playback highlights each word as it's spoken."}
                {activeFeature === 'contextMenu' && "Right-click on selected text to see available actions."}
                {activeFeature === 'feedback' && "Get instant feedback on your text selections with helpful tips."}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive Demo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Interactive Demo Text</CardTitle>
              <CardDescription>
                Try selecting text, right-clicking, or hovering over highlighted words
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
              <Button variant="outline" size="sm">
                <Play className="h-4 w-4 mr-1" />
                Play Audio
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EnhancedInteractiveText
            text={demoText}
            words={demoWords}
            language="English"
            enableTooltips={true}
            enableBidirectionalCreation={true}
            enableTextSelection={featureFlags.enableTextSelection}
            vocabularyIntegration={featureFlags.enableVocabularyIntegration}
            enhancedHighlighting={featureFlags.enableEnhancedHighlighting}
            enableContextMenu={featureFlags.enableContextMenu}
            enableSelectionFeedback={featureFlags.enableSelectionFeedback}
            enableSmartTextProcessing={featureFlags.enableSmartTextProcessing}
            onCreateDictation={handleCreateDictation}
            onCreateBidirectional={handleCreateBidirectional}
          />
        </CardContent>
      </Card>

      {/* Feature Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Feature Implementation Status</CardTitle>
          <CardDescription>
            Current rollout phase and available features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(featureFlags).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                </div>
                <Badge variant={enabled ? "default" : "secondary"}>
                  {enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Ready to experience the full enhanced reading environment?
            </p>
            <Button onClick={onStartFullExercise} className="w-full">
              <ArrowRight className="h-4 w-4 mr-2" />
              Start Full Reading Exercise
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
