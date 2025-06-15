
import { useState, useEffect } from 'react';
import { ReadingExercise } from '@/types/reading';
import { readingExerciseService } from '@/services/readingExerciseService';
import { AudioUtils } from '@/utils/audioUtils';
import { toast } from 'sonner';

interface UseReadingAudioOptions {
  exercise: ReadingExercise | null;
  enabled?: boolean;
  autoInitialize?: boolean;
}

interface UseReadingAudioReturn {
  audioUrl: string;
  isGenerating: boolean;
  isInitialized: boolean;
  isPlaying: boolean;
  currentPosition: number;
  duration: number;
  generateAudio: () => Promise<void>;
  retryGeneration: () => Promise<void>;
  setIsPlaying: (playing: boolean) => void;
  setCurrentPosition: (position: number) => void;
  setDuration: (duration: number) => void;
}

export const useReadingAudio = ({
  exercise,
  enabled = true,
  autoInitialize = true
}: UseReadingAudioOptions): UseReadingAudioReturn => {
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!exercise || !enabled || !autoInitialize) {
      setAudioUrl('');
      setIsInitialized(false);
      return;
    }

    initializeAudio();
  }, [exercise?.id, enabled, autoInitialize]);

  const initializeAudio = async () => {
    if (!exercise) return;

    console.log('[READING AUDIO] Initializing for exercise:', exercise.id);
    
    try {
      // Check for existing audio URL
      const preferredAudioUrl = AudioUtils.getPreferredAudioUrl(exercise);
      
      if (preferredAudioUrl) {
        console.log('[READING AUDIO] Found existing URL:', preferredAudioUrl);
        
        const isAccessible = await AudioUtils.validateAudioAccessibility(preferredAudioUrl);
        if (isAccessible) {
          setAudioUrl(preferredAudioUrl);
          setIsInitialized(true);
          return;
        }
      }

      // Handle generation status
      switch (exercise.audio_generation_status) {
        case 'completed':
          if (!preferredAudioUrl) {
            await generateAudio();
          }
          break;
          
        case 'generating':
          setIsGenerating(true);
          pollForCompletion();
          break;
          
        case 'pending':
        default:
          await generateAudio();
          break;
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('[READING AUDIO] Initialization failed:', error);
      setIsInitialized(true);
    }
  };

  const generateAudio = async () => {
    if (!exercise) return;
    
    try {
      setIsGenerating(true);
      
      const fullText = exercise.content.sentences.map(s => s.text).join(' ');
      if (!fullText.trim()) {
        throw new Error('No text content available');
      }
      
      const url = await readingExerciseService.generateAudio(fullText, exercise.language);
      setAudioUrl(url);
      toast.success('Audio generated successfully');
    } catch (error) {
      console.error('[READING AUDIO] Generation failed:', error);
      toast.error('Failed to generate audio');
    } finally {
      setIsGenerating(false);
    }
  };

  const retryGeneration = async () => {
    if (!exercise) return;
    
    try {
      setIsGenerating(true);
      setAudioUrl('');
      
      await readingExerciseService.retryAudioGeneration(exercise.id);
      pollForCompletion();
      toast.success('Audio regeneration started');
    } catch (error) {
      console.error('[READING AUDIO] Retry failed:', error);
      toast.error('Failed to retry audio generation');
      setIsGenerating(false);
    }
  };

  const pollForCompletion = async () => {
    if (!exercise) return;
    
    const maxAttempts = 30;
    let attempts = 0;
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        setIsGenerating(false);
        return;
      }
      
      try {
        const updatedExercise = await readingExerciseService.getReadingExercise(exercise.id);
        const audioUrl = AudioUtils.getPreferredAudioUrl(updatedExercise);
        
        if (updatedExercise.audio_generation_status === 'completed' && audioUrl) {
          setAudioUrl(audioUrl);
          setIsGenerating(false);
          return;
        }
        
        if (updatedExercise.audio_generation_status === 'failed') {
          setIsGenerating(false);
          return;
        }
        
        attempts++;
        setTimeout(poll, 1000);
      } catch (error) {
        console.error('[READING AUDIO] Polling error:', error);
        setIsGenerating(false);
      }
    };
    
    poll();
  };

  return {
    audioUrl,
    isGenerating,
    isInitialized,
    isPlaying,
    currentPosition,
    duration,
    generateAudio,
    retryGeneration,
    setIsPlaying,
    setCurrentPosition,
    setDuration
  };
};
