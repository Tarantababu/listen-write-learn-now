
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader, Pause, Play } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface DictationMicrophoneProps {
  onTextReceived: (text: string) => void;
  language: string;
  isDisabled?: boolean;
  existingText?: string;
}

// SpeechRecognition is not in the standard TypeScript definitions, so we need to define it
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
}

// Creating a namespace for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const DictationMicrophone: React.FC<DictationMicrophoneProps> = ({
  onTextReceived,
  language,
  isDisabled = false,
  existingText = ''
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState(existingText);
  const [currentSessionText, setCurrentSessionText] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const isMobile = useIsMobile();
  
  // Map language codes to BCP 47 language tags for the Web Speech API
  const getLanguageCode = (lang: string): string => {
    const langMap: Record<string, string> = {
      'english': 'en-US',
      'spanish': 'es-ES',
      'french': 'fr-FR',
      'german': 'de-DE',
      'italian': 'it-IT',
      'portuguese': 'pt-PT',
      'russian': 'ru-RU',
      'japanese': 'ja-JP',
      'korean': 'ko-KR',
      'chinese': 'zh-CN',
      'hindi': 'hi-IN',
      'arabic': 'ar-SA',
      'dutch': 'nl-NL',
      'turkish': 'tr-TR',
      'swedish': 'sv-SE',
      'polish': 'pl-PL'
    };
    
    return langMap[lang.toLowerCase()] || 'en-US';
  };

  // Initialize Web Speech Recognition
  const initSpeechRecognition = () => {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Try using a modern browser like Chrome.",
        variant: "destructive",
      });
      return null;
    }
    
    // Create speech recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    // Configure recognition
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = getLanguageCode(language);
    
    // Handle recognition results
    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result[0] && result[0].transcript) {
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
          } else {
            interimTranscript += result[0].transcript;
          }
        }
      }
      
      // Update current session text
      if (finalTranscript) {
        setCurrentSessionText(prev => prev + finalTranscript);
      }
      
      // Combine existing transcript with new text
      const combinedText = transcript + (currentSessionText + finalTranscript + interimTranscript).trim();
      
      // Send to parent component for immediate update
      onTextReceived(combinedText);
    };
    
    // Handle errors
    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event);
    };
    
    // Handle end of speech recognition
    recognitionInstance.onend = () => {
      // If recording was manually stopped or paused, don't restart
      if (isPaused || !isRecording) return;
      
      // If recording is still active but recognition ended on its own, restart it
      if (isRecording) {
        recognitionInstance.start();
      }
    };
    
    return recognitionInstance;
  };

  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      
      if (recognition) {
        recognition.stop();
      }
    };
  }, [mediaRecorder, recognition]);

  // Add dictation animation related state
  const [isAnimating, setIsAnimating] = useState(false);
  
  const startRecording = async () => {
    try {
      // Get access to microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      setAudioChunks([]);
      // Keep existing transcript when starting new recording
      setCurrentSessionText('');
      
      // Start animation when recording starts
      setIsAnimating(true);
      
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      });

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setIsPaused(false);
      
      // Initialize and start speech recognition
      const recognitionInstance = initSpeechRecognition();
      if (recognitionInstance) {
        setRecognition(recognitionInstance);
        recognitionInstance.start();
      }
      
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone access error",
        description: "Please allow microphone access to use this feature",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      if (recognition) {
        recognition.stop();
      }
      setIsPaused(true);
      // Pause animation when recording is paused
      setIsAnimating(false);
      
      // When paused, update the transcript with current session text
      // This is crucial for accumulating text between pause/resume cycles
      setTranscript(prev => {
        const updatedTranscript = prev + (currentSessionText ? ' ' + currentSessionText.trim() : '');
        return updatedTranscript.trim() + ' ';
      });
      setCurrentSessionText('');
      
      toast({
        title: "Recording paused",
        description: "Press resume when you're ready to continue",
        duration: 2000,
      });
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      if (recognition) {
        recognition.start();
      }
      setIsPaused(false);
      // Resume animation when recording resumes
      setIsAnimating(true);
      
      // Important: currentSessionText is reset when paused, 
      // and transcript now contains all previous text
      
      toast({
        title: "Recording resumed",
        description: "Continue speaking into your microphone",
        duration: 2000,
      });
    }
  };

  const stopRecording = () => {
    // Stop media recorder
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      
      // Stop all audio tracks
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    }
    
    // Stop speech recognition
    if (recognition) {
      recognition.stop();
    }
    
    // Stop animation when recording stops
    setIsAnimating(false);
    
    // When stopping, update the transcript with current session text
    setTranscript(prev => {
      const updatedTranscript = prev + (currentSessionText ? ' ' + currentSessionText.trim() : '');
      return updatedTranscript.trim() + ' ';
    });
    setCurrentSessionText('');
  };

  const cancelRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    stopRecording();
    setAudioChunks([]);
    // Stop animation
    setIsAnimating(false);
    // Do not reset transcript on cancel
    
    toast({
      title: "Recording cancelled",
      duration: 2000,
    });
  };

  const processAudio = async () => {
    if (audioChunks.length === 0) {
      setIsRecording(false);
      setIsPaused(false);
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create audio blob
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      
      // Convert to base64
      const reader = new FileReader();
      
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          const base64Audio = reader.result.split(',')[1];
          
          console.log(`Processing audio with language: ${language}`);
          
          // Send to Supabase Edge Function with language parameter
          const { data, error } = await supabase.functions.invoke('speech-to-text', {
            body: { audio: base64Audio, language }
          });
          
          if (error) {
            console.error('Speech-to-text function error:', error);
            throw error;
          }
          
          if (data?.text) {
            // Combine with transcript and pass to the parent component
            const fullTranscript = transcript + ' ' + data.text;
            setTranscript(fullTranscript.trim() + ' ');
            onTextReceived(fullTranscript);
            
            toast({
              title: "Transcription complete",
              description: "Your speech has been converted to text",
              duration: 2000,
            });
          } else {
            console.error('No text in response:', data);
            toast({
              title: "Transcription error",
              description: "No text was recognized. Please try again.",
              variant: "destructive",
            });
          }
        }
      };
      
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Transcription failed",
        description: "An error occurred while processing your speech",
        variant: "destructive",
      });
    } finally {
      setIsRecording(false);
      setIsPaused(false);
      setIsProcessing(false);
    }
  };

  const handleDone = () => {
    // When "Done" is clicked, stop recording and process the audio
    setIsRecording(false);
    setIsPaused(false);
    stopRecording();
    
    // Update with the current accumulated text
    const accumulatedText = transcript.trim() + (currentSessionText ? ' ' + currentSessionText.trim() : '');
    onTextReceived(accumulatedText);
    
    // Process the recorded audio for higher accuracy if needed
    if (audioChunks.length > 0) {
      processAudio();
    }
  };

  return (
    <div className="flex flex-col">
      {isRecording && (
        <div className="mb-2 flex items-center">
          <div className="flex space-x-1">
            <span 
              className={cn(
                "inline-block h-2 w-2 rounded-full bg-red-500",
                isAnimating && "animate-pulse"
              )}
            />
            <span 
              className={cn(
                "inline-block h-2 w-2 rounded-full bg-red-500",
                isAnimating && "animate-pulse delay-150"
              )}
            />
            <span 
              className={cn(
                "inline-block h-2 w-2 rounded-full bg-red-500",
                isAnimating && "animate-pulse delay-300"
              )}
            />
          </div>
          <span className="ml-2 text-sm font-medium text-primary">
            {isAnimating ? "Listening..." : "Paused"}
          </span>
        </div>
      )}
      <div className="flex items-center gap-2">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            size="sm"
            variant="outline"
            disabled={isDisabled || isProcessing}
            className={cn(
              "flex gap-2 items-center",
              isMobile ? "w-full justify-center" : ""
            )}
          >
            {isProcessing ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 text-red-500" />
                <span>{isMobile ? "Dictate" : "Dictate with microphone"}</span>
              </>
            )}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            {isPaused ? (
              <Button 
                onClick={resumeRecording}
                size="sm"
                variant="outline"
                className="flex gap-2 items-center bg-green-50 border-green-200 hover:bg-green-100"
              >
                <Play className="h-4 w-4 text-green-600" />
                <span>Resume</span>
              </Button>
            ) : (
              <Button 
                onClick={pauseRecording}
                size="sm"
                variant="outline"
                className="flex gap-2 items-center bg-amber-50 border-amber-200 hover:bg-amber-100"
              >
                <Pause className="h-4 w-4 text-amber-600" />
                <span>Pause</span>
              </Button>
            )}
            
            <Button
              onClick={handleDone}
              size="sm" 
              variant="default"
              className="bg-red-500 hover:bg-red-600"
            >
              <span>Done</span>
            </Button>
            
            <Button
              onClick={cancelRecording}
              size="sm"
              variant="outline"
            >
              <MicOff className="h-4 w-4 mr-2" />
              <span>Cancel</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DictationMicrophone;
