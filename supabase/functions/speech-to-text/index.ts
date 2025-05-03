
// Importing necessary dependencies
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define CORS headers to allow cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Language code mapping function (converts language names to ISO codes)
function getLanguageCode(language: string): string {
  const languageMap: Record<string, string> = {
    'english': 'en',
    'spanish': 'es',
    'french': 'fr',
    'german': 'de',
    'italian': 'it',
    'portuguese': 'pt',
    'russian': 'ru',
    'japanese': 'ja',
    'korean': 'ko',
    'chinese': 'zh',
    'hindi': 'hi',
    'arabic': 'ar',
    'dutch': 'nl',
    'turkish': 'tr',
    'swedish': 'sv',
    'polish': 'pl',
  };

  return languageMap[language.toLowerCase()] || 'en';
}

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("[SPEECH-TO-TEXT] Function called");
    const { audio, language } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    const languageCode = language ? getLanguageCode(language) : 'en';
    console.log(`[SPEECH-TO-TEXT] Processing audio for language: ${language} (code: ${languageCode})`);
    
    // Process audio in chunks to avoid memory issues
    const binaryAudio = processBase64Chunks(audio);
    
    // Prepare form data for OpenAI API
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    
    // Add language parameter if provided
    if (language && language.toLowerCase() !== 'english') {
      console.log(`[SPEECH-TO-TEXT] Setting language parameter: ${languageCode}`);
      formData.append('language', languageCode);
    }

    // Send to OpenAI for transcription
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    console.log("[SPEECH-TO-TEXT] Sending request to OpenAI");
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SPEECH-TO-TEXT] OpenAI API error: ${errorText}`);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    console.log(`[SPEECH-TO-TEXT] Transcription successful: ${result.text.substring(0, 50)}...`);
    
    return new Response(
      JSON.stringify({ text: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`[SPEECH-TO-TEXT] Error: ${error.message}`);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
