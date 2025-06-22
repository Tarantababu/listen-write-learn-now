
import { supabase } from '@/integrations/supabase/client';

interface PhoneticTranscriptionRequest {
  text: string;
  language: string;
}

interface PhoneticTranscriptionResponse {
  transcription: string;
  error?: string;
}

export const phoneticTranscriptionService = {
  async generateTranscription(text: string, language: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-phonetic-transcription', {
        body: { text, language }
      });

      if (error) {
        console.error('Error generating phonetic transcription:', error);
        return '';
      }

      return data?.transcription || '';
    } catch (error) {
      console.error('Error calling phonetic transcription service:', error);
      return '';
    }
  }
};
