
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, SkipForward, RotateCcw, Volume2 } from 'lucide-react';
import { AnticipationLesson, AnticipationProgress, LessonSection } from '@/types/anticipation';
import { AnticipationService } from '@/services/anticipationService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AnticipationLessonPlayerProps {
  lesson: AnticipationLesson;
  onClose: () => void;
}

export const AnticipationLessonPlayer: React.FC<AnticipationLessonPlayerProps> = ({
  lesson,
  onClose
}) => {
  const { user } = useAuth();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [progress, setProgress] = useState<AnticipationProgress | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAnticipation, setShowAnticipation] = useState(false);
  const [userGuess, setUserGuess] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const currentSection = lesson.content.sections[currentSectionIndex];
  const currentItem = currentSection?.content[currentItemIndex];
  const totalSections = lesson.content.sections.length;

  useEffect(() => {
    loadProgress();
  }, [lesson.id, user?.id]);

  const loadProgress = async () => {
    if (!user?.id) return;
    
    try {
      const progressData = await AnticipationService.getLessonProgress(user.id, lesson.id);
      if (progressData) {
        setProgress(progressData);
        setCurrentSectionIndex(progressData.current_section);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const updateProgress = async () => {
    if (!user?.id) return;

    try {
      await AnticipationService.updateProgress(
        user.id,
        lesson.id,
        currentSectionIndex,
        totalSections
      );
      await loadProgress();
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const playAudio = (text: string) => {
    if (audio) {
      audio.pause();
    }

    // For now, we'll use speech synthesis as a fallback
    // In a production app, you'd use the generated audio URLs
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lesson.language === 'spanish' ? 'es-ES' : 'en-US';
    speechSynthesis.speak(utterance);
    
    setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
  };

  const handleNextItem = () => {
    if (currentItemIndex < currentSection.content.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
      setShowAnticipation(false);
      setShowAnswer(false);
      setUserGuess('');
    } else {
      handleNextSection();
    }
  };

  const handleNextSection = async () => {
    if (currentSectionIndex < totalSections - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentItemIndex(0);
      setShowAnticipation(false);
      setShowAnswer(false);
      setUserGuess('');
      await updateProgress();
    } else {
      // Lesson completed
      toast.success('Congratulations! You completed the lesson!');
      await updateProgress();
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      const prevSection = lesson.content.sections[currentSectionIndex - 1];
      setCurrentItemIndex(prevSection.content.length - 1);
    }
    setShowAnticipation(false);
    setShowAnswer(false);
    setUserGuess('');
  };

  const handleShowAnticipation = () => {
    setShowAnticipation(true);
  };

  const handleRevealAnswer = () => {
    setShowAnswer(true);
  };

  const renderSectionContent = () => {
    if (!currentSection || !currentItem) return null;

    switch (currentSection.type) {
      case 'introduction':
      case 'cultural_insight':
      case 'recap':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium bg-primary/10 px-2 py-1 rounded">
                {currentItem.speaker}
              </span>
            </div>
            <p className="text-lg leading-relaxed">{currentItem.text}</p>
            <Button
              onClick={() => playAudio(currentItem.text)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Volume2 className="h-4 w-4" />
              Play Audio
            </Button>
          </div>
        );

      case 'vocabulary':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">English</h4>
                <p className="text-lg">{currentItem.english}</p>
                <p className="text-sm text-muted-foreground mt-2">{currentItem.exampleEN}</p>
              </div>
              
              {!showAnticipation ? (
                <div className="flex items-center justify-center">
                  <Button onClick={handleShowAnticipation} variant="outline">
                    Try to Guess
                  </Button>
                </div>
              ) : (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    {lesson.language.charAt(0).toUpperCase() + lesson.language.slice(1)}
                  </h4>
                  {!showAnswer ? (
                    <div className="space-y-3">
                      <p className="text-sm text-primary">{currentItem.anticipationPrompt}</p>
                      <input
                        type="text"
                        value={userGuess}
                        onChange={(e) => setUserGuess(e.target.value)}
                        placeholder="Your guess..."
                        className="w-full p-2 border rounded"
                      />
                      <Button onClick={handleRevealAnswer} size="sm">
                        Reveal Answer
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-lg font-medium">{currentItem.target}</p>
                      <p className="text-sm text-muted-foreground">{currentItem.exampleTL}</p>
                      <Button
                        onClick={() => playAudio(currentItem.target)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Volume2 className="h-4 w-4" />
                        Listen
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'dialogue':
        return (
          <div className="space-y-4">
            <div className="bg-accent/20 p-4 rounded-lg">
              <p className="text-lg font-medium">{currentItem.targetText}</p>
              <p className="text-sm text-muted-foreground mt-2">{currentItem.englishMeaning}</p>
            </div>
            
            {currentItem.anticipationPrompt && (
              <div className="bg-primary/5 p-3 rounded border-l-4 border-primary">
                <p className="text-sm text-primary font-medium">{currentItem.anticipationPrompt}</p>
              </div>
            )}
            
            <Button
              onClick={() => playAudio(currentItem.targetText)}
              variant="outline"
              className="gap-2"
            >
              <Volume2 className="h-4 w-4" />
              Play Audio
            </Button>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <p className="text-lg">{JSON.stringify(currentItem, null, 2)}</p>
          </div>
        );
    }
  };

  const progressPercentage = ((currentSectionIndex + 1) / totalSections) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{lesson.title}</CardTitle>
              <p className="text-muted-foreground">
                {currentSection?.title} • Section {currentSectionIndex + 1} of {totalSections}
              </p>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
          <Progress value={progressPercentage} className="mt-4" />
        </CardHeader>

        <CardContent className="space-y-6">
          {renderSectionContent()}

          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              onClick={handlePrevious}
              variant="outline"
              disabled={currentSectionIndex === 0 && currentItemIndex === 0}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              Item {currentItemIndex + 1} of {currentSection?.content.length || 0}
            </div>

            <Button
              onClick={handleNextItem}
              className="gap-2"
            >
              Next
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
