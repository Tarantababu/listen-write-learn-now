
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Exercise, Json } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';

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
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchOrGenerateAnalysis = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // If we have an existing analysis ID, fetch it from the database
        if (existingAnalysisId) {
          try {
            // Cast the existingAnalysisId to proper type for Supabase
            const { data, error } = await supabase
              .from('reading_analyses')
              .select('content')
              .eq('id', existingAnalysisId as unknown as DbId)
              .maybeSingle();
              
            if (error) {
              console.error('Error fetching analysis:', error);
              // If we can't fetch the existing analysis, we'll generate a new one
              throw error;
            }
            
            if (data && 'content' in data) {
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
            // Explicitly cast types when saving to database to satisfy TypeScript
            const jsonContent = analysisContent as unknown as Json;
            
            // When saving to database, properly type cast the insert data
            const { error: saveError, data: savedData } = await supabase
              .from('reading_analyses')
              .insert({
                user_id: user.id as unknown as DbId,
                exercise_id: exercise.id as unknown as DbId,
                content: jsonContent
              } as any)
              .select('id')
              .single();
              
            if (saveError) {
              console.error('Error saving analysis:', saveError);
              // Continue even if saving fails
            } else if (savedData && 'id' in savedData) {
              console.log('Analysis saved with ID:', savedData.id);
              
              // Increment the reading_analyses_count for free users using a direct update
              try {
                const { data: profileData, error: fetchError } = await supabase
                  .from('profiles')
                  .select('reading_analyses_count')
                  .eq('id', user.id as unknown as DbId)
                  .maybeSingle();
                  
                if (fetchError) {
                  console.error('Error fetching profile:', fetchError);
                } else if (profileData && 'reading_analyses_count' in profileData) {
                  // Check if data exists and has reading_analyses_count
                  const currentCount = profileData?.reading_analyses_count || 0;
                  const newCount = currentCount + 1;
                  
                  // Properly type the update data
                  const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ reading_analyses_count: newCount } as any)
                    .eq('id', user.id as unknown as DbId);
                    
                  if (updateError) {
                    console.error('Error updating analysis count:', updateError);
                  }
                }
              } catch (error) {
                console.error('Error updating profile counts:', error);
              }
            }
          } catch (error) {
            console.error('Error saving analysis to database:', error);
            // Continue even if saving fails - user can still see the analysis
          }
        }
      } catch (error: any) {
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
      setSelectedSentenceIndex(selectedSentenceIndex + 1);
    }
  };
  
  const handlePrevious = () => {
    if (selectedSentenceIndex > 0) {
      setSelectedSentenceIndex(selectedSentenceIndex - 1);
    }
  };
  
  const handleRetry = () => {
    // Retry fetching or generating analysis
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
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Generating reading analysis...</p>
        <p className="text-sm text-muted-foreground mt-2">This may take a moment as we analyze the text.</p>
      </div>
    );
  }
  
  if (error || !analysis) {
    return (
      <div className="p-6 space-y-4">
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-start">
          <AlertTriangle className="h-5 w-5 text-destructive mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Failed to generate analysis</p>
            <p className="text-sm mt-1 text-destructive/80">{error || 'Unknown error occurred'}</p>
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleRetry}>
            Try Again
          </Button>
          <Button onClick={onComplete}>
            Skip to Dictation
          </Button>
        </div>
      </div>
    );
  }
  
  const currentSentence = analysis.sentences[selectedSentenceIndex];
  
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">{exercise.title} - Reading Analysis</h2>
      
      <Tabs defaultValue="sentence" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sentence">Sentence by Sentence</TabsTrigger>
          <TabsTrigger value="patterns">Common Patterns</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sentence" className="space-y-4">
          <div className="bg-muted/30 p-4 rounded-lg dark:bg-muted/10">
            <p className="text-lg font-medium">
              Sentence {selectedSentenceIndex + 1} of {analysis.sentences.length}
            </p>
            <p className="text-xl mt-2 font-medium">{currentSentence.text}</p>
          </div>
          
          <ScrollArea className="h-[350px] rounded-md border p-4 dark:border-muted/30">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Key Words</h3>
                <div className="space-y-3 mt-2">
                  {currentSentence.analysis.words.map((word, i) => (
                    <div key={i} className="bg-background p-3 rounded-lg border dark:border-muted/20 dark:bg-muted/5">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1">
                        <span className="font-bold text-primary">{word.word}</span>
                        <span className="text-foreground md:text-right">{word.definition}</span>
                      </div>
                      {word.exampleSentence && (
                        <p className="text-sm mt-1">
                          <span className="font-semibold">Example:</span> {word.exampleSentence}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">Grammar Insights</h3>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {currentSentence.analysis.grammarInsights.map((insight, i) => (
                    <li key={i} className="text-sm">{insight}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">Sentence Structure</h3>
                <p className="text-sm mt-1">{currentSentence.analysis.structure}</p>
              </div>
            </div>
          </ScrollArea>
          
          <div className="flex justify-between pt-2">
            <Button 
              onClick={handlePrevious}
              disabled={selectedSentenceIndex === 0}
              variant="outline"
            >
              Previous Sentence
            </Button>
            
            {selectedSentenceIndex < analysis.sentences.length - 1 ? (
              <Button onClick={handleNext}>
                Next Sentence
              </Button>
            ) : (
              <Button onClick={onComplete} className="bg-primary">
                Continue to Dictation
              </Button>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="patterns">
          <ScrollArea className="h-[450px] rounded-md border p-4 dark:border-muted/30">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Common Patterns in this Text</h3>
              <ul className="space-y-3">
                {analysis.commonPatterns.map((pattern, i) => (
                  <li key={i} className="bg-muted/30 p-3 rounded-lg dark:bg-muted/10">
                    {pattern}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollArea>
          
          <div className="flex justify-end mt-4">
            <Button onClick={onComplete} className="bg-primary">
              Continue to Dictation
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="summary">
          <div className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-lg dark:bg-muted/10">
              <h3 className="text-lg font-semibold mb-2">Text Summary</h3>
              <p>{analysis.summary}</p>
            </div>
            
            {analysis.englishTranslation && (
              <div className="bg-muted/30 p-4 rounded-lg dark:bg-muted/10">
                <h3 className="text-lg font-semibold mb-2">English Translation</h3>
                <p>{analysis.englishTranslation}</p>
              </div>
            )}
            
            <div className="bg-muted/10 p-4 rounded-lg border dark:border-muted/30 dark:bg-muted/5">
              <h3 className="text-lg font-semibold mb-2">Full Text</h3>
              <p className="whitespace-pre-wrap">{exercise.text}</p>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button onClick={onComplete} className="bg-primary">
              Continue to Dictation
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReadingAnalysis;
