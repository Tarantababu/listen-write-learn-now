import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Exercise, Json } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ReadingAnalysisProps {
  exercise: Exercise;
  onComplete: () => void;
  existingAnalysisId?: string;
}

interface AnalysisSentence {
  text: string;
  analysis: {
    words: {
      word: string;
      definition: string;
      etymologyInsight?: string;
      englishCousin?: string;
    }[];
    grammarInsights: string[];
    structure: string;
  };
}

interface AnalysisContent {
  sentences: AnalysisSentence[];
  commonPatterns: string[];
  summary: string;
}

const ReadingAnalysis: React.FC<ReadingAnalysisProps> = ({
  exercise,
  onComplete,
  existingAnalysisId
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisContent | null>(null);
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState(0);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchOrGenerateAnalysis = async () => {
      setIsLoading(true);
      
      try {
        // If we have an existing analysis ID, fetch it from the database
        if (existingAnalysisId) {
          const { data, error } = await supabase
            .from('reading_analyses')
            .select('content')
            .eq('id', existingAnalysisId)
            .single();
            
          if (error) {
            throw error;
          }
          
          // Type assertion to ensure the content is treated as AnalysisContent
          setAnalysis(data.content as unknown as AnalysisContent);
          setIsLoading(false);
          return;
        }
        
        // Otherwise generate a new analysis
        const response = await supabase.functions.invoke('generate-vocabulary-info', {
          body: {
            text: exercise.text,
            language: exercise.language
          }
        });
        
        if (response.error) {
          throw new Error(response.error.message || 'Error generating analysis');
        }
        
        const analysisContent = response.data.analysis as AnalysisContent;
        setAnalysis(analysisContent);
        
        // Save the analysis to the database
        if (user) {
          // When saving to database, explicitly cast the analysisContent to unknown then Json
          // to satisfy TypeScript's type checking for the Supabase client
          const { error: saveError } = await supabase
            .from('reading_analyses')
            .insert({
              user_id: user.id,
              exercise_id: exercise.id,
              content: analysisContent as unknown as Json
            });
            
          if (saveError) {
            console.error('Error saving analysis:', saveError);
            // Continue even if saving fails
          } else {
            // Increment the reading_analyses_count for free users using a direct update
            // Instead of using RPC which has type issues, use a direct increment
            const { data: profileData, error: fetchError } = await supabase
              .from('profiles')
              .select('reading_analyses_count')
              .eq('id', user.id)
              .single();
              
            if (fetchError) {
              console.error('Error fetching profile:', fetchError);
            } else {
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
        }
      } catch (error) {
        console.error('Error in reading analysis:', error);
        toast.error('Failed to generate reading analysis. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrGenerateAnalysis();
  }, [exercise, existingAnalysisId, user]);
  
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
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Generating reading analysis...</p>
        <p className="text-sm text-muted-foreground mt-2">This may take a moment as we analyze the text.</p>
      </div>
    );
  }
  
  if (!analysis) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg font-medium text-destructive">Failed to generate analysis.</p>
        <Button onClick={onComplete} className="mt-4">
          Skip to Dictation
        </Button>
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
          <div className="bg-muted/30 p-4 rounded-lg">
            <p className="text-lg font-medium">
              Sentence {selectedSentenceIndex + 1} of {analysis.sentences.length}
            </p>
            <p className="text-xl mt-2 font-medium">{currentSentence.text}</p>
          </div>
          
          <ScrollArea className="h-[350px] rounded-md border p-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Key Words</h3>
                <div className="space-y-3 mt-2">
                  {currentSentence.analysis.words.map((word, i) => (
                    <div key={i} className="bg-background p-3 rounded-lg border">
                      <div className="flex justify-between">
                        <span className="font-bold text-primary">{word.word}</span>
                        <span className="text-muted-foreground">{word.definition}</span>
                      </div>
                      {word.englishCousin && (
                        <p className="text-sm mt-1">
                          <span className="font-semibold">English cousin:</span> {word.englishCousin}
                        </p>
                      )}
                      {word.etymologyInsight && (
                        <p className="text-sm mt-1">
                          <span className="font-semibold">Etymology:</span> {word.etymologyInsight}
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
          <ScrollArea className="h-[450px] rounded-md border p-4">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Common Patterns in this Text</h3>
              <ul className="space-y-3">
                {analysis.commonPatterns.map((pattern, i) => (
                  <li key={i} className="bg-muted/30 p-3 rounded-lg">
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
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Text Summary</h3>
              <p>{analysis.summary}</p>
            </div>
            
            <div className="bg-muted/10 p-4 rounded-lg border">
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
