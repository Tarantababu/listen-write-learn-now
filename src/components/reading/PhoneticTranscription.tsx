
import React, { useState, useEffect } from 'react';
import { phoneticTranscriptionService } from '@/services/phoneticTranscriptionService';
import { Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhoneticTranscriptionProps {
  text: string;
  language: string;
  className?: string;
}

export const PhoneticTranscription: React.FC<PhoneticTranscriptionProps> = ({
  text,
  language,
  className = ''
}) => {
  const [transcription, setTranscription] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateTranscription = async () => {
      if (!text || !language) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await phoneticTranscriptionService.generateTranscription(text, language);
        setTranscription(result);
      } catch (err) {
        console.error('Error generating phonetic transcription:', err);
        setError('Failed to generate phonetic transcription');
      } finally {
        setIsLoading(false);
      }
    };

    generateTranscription();
  }, [text, language]);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Generating phonetic transcription...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        <span>Phonetic transcription unavailable</span>
      </div>
    );
  }

  if (!transcription) {
    return null;
  }

  return (
    <div className={`bg-muted/20 border border-border/30 p-3 rounded-lg ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Volume2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Phonetic Transcription</span>
      </div>
      <p className="text-sm font-mono text-foreground leading-relaxed">
        {transcription}
      </p>
    </div>
  );
};
