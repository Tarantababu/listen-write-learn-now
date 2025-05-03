
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
}

const DictationMicrophone: React.FC<DictationMicrophoneProps> = ({
  onTextReceived,
  language,
  isDisabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      setAudioChunks([]);
      
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      });

      recorder.addEventListener('stop', () => {
        if (isRecording && !isPaused) { // Only process if we're still in recording state (not canceled or paused)
          processAudio();
        }
      });

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setIsPaused(false);
      
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
      setIsPaused(true);
      
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
      setIsPaused(false);
      
      toast({
        title: "Recording resumed",
        description: "Continue speaking into your microphone",
        duration: 2000,
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      
      // Stop all audio tracks
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const cancelRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    stopRecording();
    setAudioChunks([]);
    
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
            // Pass the transcribed text to the parent component
            onTextReceived(data.text);
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
    // The processAudio function will be called by the stop event listener
  };

  return (
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
  );
};

export default DictationMicrophone;
