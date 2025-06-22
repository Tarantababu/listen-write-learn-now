import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Exercise, Json } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { AlertTriangle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import ReadingAnalysisProgress from '@/components/ReadingAnalysisProgress';
import { MobileReadingNavigation } from '@/components/reading/MobileReadingNavigation';
import { MobileReadingTabs } from '@/components/reading/MobileReadingTabs';
import { MobileWordCard } from '@/components/reading/MobileWordCard';
import { AudioPlayButton } from '@/components/reading/AudioPlayButton';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface ReadingAnalysisProps {
  exercise: Exercise;
  onComplete: () => void;
  existingAnalysisId?: string;
}

interface AnalysisWord {
  word: string;
  definition: string;
  exampleSentence: string;
}

interface AnalysisSentence {
  text: string;
  analysis: {
    words: AnalysisWord[];
    grammarInsights: string[];
    structure: string;
  };
}

interface AnalysisContent {
  sentences: AnalysisSentence[];
  commonPatterns: string[];
  summary: string;
  englishTranslation: string;
}

const ReadingAnalysis: React.FC<ReadingAnalysisProps> = ({
  exercise,
  onComplete,
  existingAnalysisId
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisContent | null>(null);
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('sentence');
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Audio player hook
  const { isPlaying, isLoading: isAudioLoading, playText, stopAudio } = useAudioPlayer();
  
  useEffect(() => {
    const fetchOrGenerateAnalysis = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // If we have an existing analysis ID, fetch it from the database
        if (existingAnalysisId) {
          try {
            const { data, error } = await supabase
              .from('reading_analyses')
              .select('content')
              .eq('id', existingAnalysisId)
              .maybeSingle();
              
            if (error) {
              console.error('Error fetching analysis:', error);
              // If we can't fetch the existing analysis, we'll generate a new one
              throw error;
            }
            
            if (data && data.content) {
              // Type assertion to ensure the content is treated as AnalysisContent
              const analysisContent = data.content as unknown as AnalysisContent;
              
              // Validate the analysis content structure
              if (validateAnalysisContent(analysisContent)) {
                setAnalysis(analysisContent);
                setIsLoading(false);
                return;
              } else {
                throw new Error('Invalid analysis data format');
              }
            } else {
              throw new Error('No analysis data found');
            }
          } catch (err) {
            console.error('Failed to fetch existing analysis, will generate new one:', err);
            // Continue to generate a new analysis
          }
        }
        
        // Generate a new analysis
        console.log('Generating new analysis for exercise:', exercise.id);
        
        // Using the new dedicated reading analysis function
        const response = await supabase.functions.invoke('generate-reading-analysis', {
          body: {
            text: exercise.text,
            language: exercise.language
          }
        });
        
        console.log('Edge function response:', response);
        
        if (response.error || !response.data) {
          console.error('Error from edge function:', response.error);
          throw new Error(response.error?.message || 'Error generating analysis');
        }
        
        // Validate response data
        if (!response.data.analysis) {
          console.error('Invalid response data:', response.data);
          throw new Error('Invalid response data format');
        }
        
        const analysisContent = response.data.analysis as AnalysisContent;
        
        // Validate the analysis content structure
        if (!validateAnalysisContent(analysisContent)) {
          console.error('Invalid analysis content:', analysisContent);
          throw new Error('Invalid analysis data received');
        }
        
        setAnalysis(analysisContent);
        
        // Save the analysis to the database
        if (user) {
          try {
            // When saving to database, explicitly cast the analysisContent to unknown then Json
            // to satisfy TypeScript's type checking for the Supabase client
            const { error: saveError, data: savedData } = await supabase
              .from('reading_analyses')
              .insert({
                user_id: user.id,
                exercise_id: exercise.id,
                content: analysisContent as unknown as Json
              })
              .select('id')
              .single();
              
            if (saveError) {
              console.error('Error saving analysis:', saveError);
              // Continue even if saving fails
            } else {
              console.log('Analysis saved with ID:', savedData.id);
              
              // Increment the reading_analyses_count for free users using a direct update
              const { data: profileData, error: fetchError } = await supabase
                .from('profiles')
                .select('reading_analyses_count')
                .eq('id', user.id)
                .maybeSingle();
                
              if (fetchError) {
                console.error('Error fetching profile:', fetchError);
              } else if (profileData) {
                const currentCount = profileData.reading_analyses_count || 0;
                const newCount = currentCount + 1;
                
                const { error: updateError } = await supabase
                  .from('profiles')
                  .update({ reading_analyses_count: newCount })
                  .eq('id', user.id);
                  
                if (updateError) {
                  console.error('Error updating analysis count:', updateError);
                }
              }
            }
          } catch (error) {
            console.error('Error saving analysis to database:', error);
            // Continue even if saving fails - user can still see the analysis
          }
        }
      } catch (error) {
        console.error('Error in reading analysis:', error);
        setError(error.message || 'Failed to generate reading analysis');
        toast({
          title: "Error",
          description: "Failed to generate reading analysis. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrGenerateAnalysis();
  }, [exercise, existingAnalysisId, user]);
  
  // Validate that the analysis content has the expected structure
  const validateAnalysisContent = (content: any): content is AnalysisContent => {
    if (!content) return false;
    
    // Check that sentences array exists
    if (!Array.isArray(content.sentences) || content.sentences.length === 0) {
      return false;
    }
    
    // Validate first sentence to ensure it has the expected structure
    const firstSentence = content.sentences[0];
    if (!firstSentence.text || !firstSentence.analysis) {
      return false;
    }
    
    // Check that analysis has words array
    if (!Array.isArray(firstSentence.analysis.words)) {
      return false;
    }
    
    // Check that analysis has grammarInsights array
    if (!Array.isArray(firstSentence.analysis.grammarInsights)) {
      return false;
    }
    
    // Check that analysis has structure string
    if (typeof firstSentence.analysis.structure !== 'string') {
      return false;
    }
    
    // Check that commonPatterns array exists
    if (!Array.isArray(content.commonPatterns)) {
      return false;
    }
    
    // Check that summary string exists
    if (typeof content.summary !== 'string') {
      return false;
    }
    
    return true;
  };
  
  const handleNext = () => {
    if (analysis && selectedSentenceIndex < analysis.sentences.length - 1) {
      stopAudio(); // Stop audio when navigating
      setSelectedSentenceIndex(selectedSentenceIndex + 1);
    }
  };
  
  const handlePrevious = () => {
    if (selectedSentenceIndex > 0) {
      stopAudio(); // Stop audio when navigating
      setSelectedSentenceIndex(selectedSentenceIndex - 1);
    }
  };
  
  const handleRetry = () => {
    // Retry fetching or generating analysis
    stopAudio(); // Stop any playing audio
    setAnalysis(null);
    setIsLoading(true);
    setError(null);
    
    // Force re-run of the useEffect
    if (existingAnalysisId) {
      // Clear existingAnalysisId to force regeneration
      onComplete(); // Go to dictation mode to reset the flow
    } else {
      // Re-run the useEffect
      const fetchOrGenerateAnalysis = async () => {
        try {
          const response = await supabase.functions.invoke('generate-reading-analysis', {
            body: {
              text: exercise.text,
              language: exercise.language
            }
          });
          
          if (response.error || !response.data) {
            throw new Error(response.error?.message || 'Error generating analysis');
          }
          
          const analysisContent = response.data.analysis as AnalysisContent;
          
          if (!validateAnalysisContent(analysisContent)) {
            throw new Error('Invalid analysis data received');
          }
          
          setAnalysis(analysisContent);
          setIsLoading(false);
        } catch (error) {
          console.error('Error in reading analysis retry:', error);
          setError(error.message || 'Failed to generate reading analysis');
          toast({
            title: "Error",
            description: "Failed to generate reading analysis. Please try again.",
            variant: "destructive"
          });
          setIsLoading(false);
        }
      };
      
      fetchOrGenerateAnalysis();
    }
  };
  
  const handlePlaySentence = () => {
    if (analysis) {
      const currentSentence = analysis.sentences[selectedSentenceIndex];
      playText(currentSentence.text, exercise.language);
    }
  };
  
  if (isLoading) {
    return (
      <ReadingAnalysisProgress 
        isGenerating={true}
        onComplete={() => {
          // Progress component handles the UI, actual completion handled by useEffect
        }}
      />
    );
  }
  
  if (error || !analysis) {
    return (
      <div className={`${isMobile ? 'p-4' : 'p-6'} space-y-4`}>
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-start">
          <AlertTriangle className="h-5 w-5 text-destructive mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Failed to generate analysis</p>
            <p className="text-sm mt-1 text-destructive/80">{error || 'Unknown error occurred'}</p>
          </div>
        </div>
        
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-between'}`}>
          <Button 
            variant="outline" 
            onClick={handleRetry}
            className={isMobile ? 'w-full min-h-[48px] touch-manipulation' : ''}
          >
            Try Again
          </Button>
          <Button 
            onClick={onComplete}
            className={isMobile ? 'w-full min-h-[48px] touch-manipulation' : ''}
          >
            Skip to Dictation
          </Button>
        </div>
      </div>
    );
  }
  
  const currentSentence = analysis.sentences[selectedSentenceIndex];
  
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Mobile Header */}
        <div className="flex-shrink-0 bg-background border-b border-border p-4 safe-area-top">
          <h2 className="text-lg font-bold truncate mb-2">{exercise.title}</h2>
          <span className="text-sm text-muted-foreground">Reading Analysis</span>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="flex-shrink-0 p-4 bg-background">
          <MobileReadingTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'sentence' && (
            <div className="h-full flex flex-col">
              {/* Current Sentence Display with Audio Button */}
              <div className="flex-shrink-0 bg-muted/30 p-4 border-b border-border">
                <div className="text-center mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Sentence {selectedSentenceIndex + 1} of {analysis.sentences.length}
                  </span>
                </div>
                <p className="text-lg font-medium leading-relaxed text-center mb-3">
                  {currentSentence.text}
                </p>
                {/* Audio Play Button */}
                <div className="flex justify-center">
                  <AudioPlayButton
                    isPlaying={isPlaying}
                    isLoading={isAudioLoading}
                    onPlay={handlePlaySentence}
                    onStop={stopAudio}
                    size="sm"
                    variant="outline"
                  />
                </div>
              </div>

              {/* Scrollable Analysis Content */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-6 pb-20">
                  {/* Key Words Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      Key Words
                      <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {currentSentence.analysis.words.length}
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {currentSentence.analysis.words.map((word, i) => (
                        <MobileWordCard key={i} word={word} index={i} />
                      ))}
                    </div>
                  </div>
                  
                  {/* Grammar Insights */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Grammar Insights</h3>
                    <div className="space-y-2">
                      {currentSentence.analysis.grammarInsights.map((insight, i) => (
                        <div key={i} className="bg-card/50 border border-border/50 p-3 rounded-lg">
                          <p className="text-sm leading-relaxed">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Sentence Structure */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Sentence Structure</h3>
                    <div className="bg-card/50 border border-border/50 p-3 rounded-lg">
                      <p className="text-sm leading-relaxed">{currentSentence.analysis.structure}</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}

          {activeTab === 'patterns' && (
            <ScrollArea className="h-full p-4">
              <div className="space-y-4 pb-20">
                <h3 className="text-xl font-semibold mb-4">Common Patterns</h3>
                <div className="space-y-3">
                  {analysis.commonPatterns.map((pattern, i) => (
                    <div key={i} className="bg-card/50 border border-border/50 p-4 rounded-lg">
                      <p className="text-sm leading-relaxed">{pattern}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}

          {activeTab === 'summary' && (
            <ScrollArea className="h-full p-4">
              <div className="space-y-6 pb-20">
                <div className="bg-card/50 border border-border/50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Text Summary</h3>
                  <p className="text-sm leading-relaxed">{analysis.summary}</p>
                </div>
                
                {analysis.englishTranslation && (
                  <div className="bg-card/50 border border-border/50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">English Translation</h3>
                    <p className="text-sm leading-relaxed">{analysis.englishTranslation}</p>
                  </div>
                )}
                
                <div className="bg-muted/30 border border-border/30 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Full Text</h3>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{exercise.text}</p>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        {activeTab === 'sentence' ? (
          <MobileReadingNavigation
            currentStep={selectedSentenceIndex + 1}
            totalSteps={analysis.sentences.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onComplete={onComplete}
            canGoNext={selectedSentenceIndex < analysis.sentences.length - 1}
            canGoPrevious={selectedSentenceIndex > 0}
            isLastStep={selectedSentenceIndex === analysis.sentences.length - 1}
          />
        ) : (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 safe-area-bottom">
            <Button 
              onClick={onComplete} 
              className="w-full min-h-[48px] touch-manipulation bg-primary"
            >
              Continue to Dictation
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Desktop view with audio functionality
  return (
    <div className="p-6 space-y-6">
      <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-2 md:mb-4`}>{exercise.title} - Reading Analysis</h2>
      
      <Tabs defaultValue="sentence" className="w-full">
        <TabsList className={`${isMobile 
          ? 'flex flex-wrap w-full h-auto p-1' 
          : 'grid w-full grid-cols-3'
        } rounded-lg bg-muted text-muted-foreground dark:bg-muted/80`}>
          <TabsTrigger 
            value="sentence" 
            className={`${isMobile 
              ? 'flex-1 min-w-0 text-xs px-2 py-2 whitespace-nowrap' 
              : ''
            }`}
          >
            {isMobile ? 'Sentence' : 'Sentence by Sentence'}
          </TabsTrigger>
          <TabsTrigger 
            value="patterns"
            className={`${isMobile 
              ? 'flex-1 min-w-0 text-xs px-2 py-2 whitespace-nowrap' 
              : ''
            }`}
          >
            {isMobile ? 'Patterns' : 'Common Patterns'}
          </TabsTrigger>
          <TabsTrigger 
            value="summary"
            className={`${isMobile 
              ? 'flex-1 min-w-0 text-xs px-2 py-2 whitespace-nowrap' 
              : ''
            }`}
          >
            Summary
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="sentence" className={`space-y-3 md:space-y-4 mt-3 md:mt-4`}>
          <div className={`bg-muted/30 ${isMobile ? 'p-3' : 'p-4'} rounded-lg dark:bg-muted/10`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`${isMobile ? 'text-base' : 'text-lg'} font-medium`}>
                Sentence {selectedSentenceIndex + 1} of {analysis.sentences.length}
              </p>
              <AudioPlayButton
                isPlaying={isPlaying}
                isLoading={isAudioLoading}
                onPlay={handlePlaySentence}
                onStop={stopAudio}
                size="sm"
                variant="outline"
              />
            </div>
            <p className={`${isMobile ? 'text-lg' : 'text-xl'} mt-2 font-medium leading-relaxed`}>{currentSentence.text}</p>
          </div>
          
          <ScrollArea className={`${isMobile ? 'h-[300px]' : 'h-[350px]'} rounded-md border ${isMobile ? 'p-3' : 'p-4'} dark:border-muted/30`}>
            <div className={`space-y-3 md:space-y-4`}>
              <div>
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>Key Words</h3>
                <div className={`space-y-2 md:space-y-3 mt-2`}>
                  {currentSentence.analysis.words.map((word, i) => (
                    <div key={i} className={`bg-background ${isMobile ? 'p-2' : 'p-3'} rounded-lg border dark:border-muted/20 dark:bg-muted/5`}>
                      <div className="flex flex-col gap-1">
                        <span className={`font-bold text-primary ${isMobile ? 'text-sm' : ''}`}>{word.word}</span>
                        <span className={`text-foreground ${isMobile ? 'text-sm' : ''}`}>{word.definition}</span>
                      </div>
                      {word.exampleSentence && (
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} mt-1`}>
                          <span className="font-semibold">Example:</span> {word.exampleSentence}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>Grammar Insights</h3>
                <ul className={`list-disc list-inside space-y-1 mt-2`}>
                  {currentSentence.analysis.grammarInsights.map((insight, i) => (
                    <li key={i} className={`${isMobile ? 'text-xs' : 'text-sm'}`}>{insight}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>Sentence Structure</h3>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} mt-1`}>{currentSentence.analysis.structure}</p>
              </div>
            </div>
          </ScrollArea>
          
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between'} pt-2`}>
            <Button 
              onClick={handlePrevious}
              disabled={selectedSentenceIndex === 0}
              variant="outline"
              className={isMobile ? 'w-full' : ''}
            >
              Previous Sentence
            </Button>
            
            {selectedSentenceIndex < analysis.sentences.length - 1 ? (
              <Button 
                onClick={handleNext}
                className={isMobile ? 'w-full' : ''}
              >
                Next Sentence
              </Button>
            ) : (
              <Button 
                onClick={onComplete} 
                className={`bg-primary ${isMobile ? 'w-full' : ''}`}
              >
                Continue to Dictation
              </Button>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="patterns">
          <ScrollArea className={`${isMobile ? 'h-[400px]' : 'h-[450px]'} rounded-md border ${isMobile ? 'p-3' : 'p-4'} dark:border-muted/30`}>
            <div className={`space-y-3 md:space-y-4`}>
              <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>Common Patterns in this Text</h3>
              <ul className={`space-y-2 md:space-y-3`}>
                {analysis.commonPatterns.map((pattern, i) => (
                  <li key={i} className={`bg-muted/30 ${isMobile ? 'p-2 text-sm' : 'p-3'} rounded-lg dark:bg-muted/10`}>
                    {pattern}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollArea>
          
          <div className={`flex justify-end mt-3 md:mt-4`}>
            <Button 
              onClick={onComplete} 
              className={`bg-primary ${isMobile ? 'w-full' : ''}`}
            >
              Continue to Dictation
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="summary">
          <div className={`space-y-3 md:space-y-4`}>
            <div className={`bg-muted/30 ${isMobile ? 'p-3' : 'p-4'} rounded-lg dark:bg-muted/10`}>
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-2`}>Text Summary</h3>
              <p className={isMobile ? 'text-sm' : ''}>{analysis.summary}</p>
            </div>
            
            {analysis.englishTranslation && (
              <div className={`bg-muted/30 ${isMobile ? 'p-3' : 'p-4'} rounded-lg dark:bg-muted/10`}>
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-2`}>English Translation</h3>
                <p className={isMobile ? 'text-sm' : ''}>{analysis.englishTranslation}</p>
              </div>
            )}
            
            <div className={`bg-muted/10 ${isMobile ? 'p-3' : 'p-4'} rounded-lg border dark:border-muted/30 dark:bg-muted/5`}>
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-2`}>Full Text</h3>
              <p className={`whitespace-pre-wrap ${isMobile ? 'text-sm' : ''}`}>{exercise.text}</p>
            </div>
          </div>
          
          <div className={`flex justify-end mt-3 md:mt-4`}>
            <Button 
              onClick={onComplete} 
              className={`bg-primary ${isMobile ? 'w-full' : ''}`}
            >
              Continue to Dictation
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReadingAnalysis;
