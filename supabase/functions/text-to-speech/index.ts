
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, language } = await req.json();

    if (!text || !language) {
      throw new Error('Text and language are required');
    }
    
    // Language to model mapping for better localization
    // Each language is mapped to specific model settings and language code for more natural output
    const languageModelMap = {
      'english': { voice: 'onyx', model: 'tts-1-hd', code: 'en' },
      'german': { voice: 'alloy', model: 'tts-1-hd', code: 'de' },
      'french': { voice: 'nova', model: 'tts-1-hd', code: 'fr' },
      // Modified Spanish configuration to use a better suited voice
      'spanish': { voice: 'alloy', model: 'tts-1-hd', code: 'es' },
      'portuguese': { voice: 'echo', model: 'tts-1-hd', code: 'pt' },
      'italian': { voice: 'fable', model: 'tts-1-hd', code: 'it' },
      'dutch': { voice: 'alloy', model: 'tts-1-hd', code: 'nl' },
      'turkish': { voice: 'shimmer', model: 'tts-1-hd', code: 'tr' },
      'swedish': { voice: 'onyx', model: 'tts-1-hd', code: 'sv' },
      'norwegian': { voice: 'nova', model: 'tts-1-hd', code: 'no' },
      'russian': { voice: 'echo', model: 'tts-1-hd', code: 'ru' },
      'polish': { voice: 'fable', model: 'tts-1-hd', code: 'pl' },
      'chinese': { voice: 'nova', model: 'tts-1-hd', code: 'zh' },
      'japanese': { voice: 'shimmer', model: 'tts-1-hd', code: 'ja' },
      'korean': { voice: 'alloy', model: 'tts-1-hd', code: 'ko' },
      'arabic': { voice: 'onyx', model: 'tts-1-hd', code: 'ar' }
    };

    const langKey = language.toLowerCase();
    const { voice, model, code } = languageModelMap[langKey] || { voice: 'nova', model: 'tts-1-hd', code: 'en' };
    
    console.log(`Generating speech for language: ${language} (${code}), using voice: ${voice}, model: ${model}`);

    // Call OpenAI API with language-specific settings
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        voice: voice,
        input: text,
        response_format: 'mp3',
        // Enhanced Spanish voice settings for better pronunciation
        voice_settings: {
          stability: 0.5,  // Reduced stability for more expressive speech
          similarity_boost: 0.7, // Adjusted similarity for better Spanish pronunciation
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, response.statusText);
      console.error('OpenAI API error details:', errorText);
      throw new Error(`Failed to generate speech: ${errorText}`);
    }

    const audioContent = await response.arrayBuffer();
    
    // Convert ArrayBuffer to base64 string safely
    const uint8Array = new Uint8Array(audioContent);
    let binaryString = '';
    uint8Array.forEach(byte => {
      binaryString += String.fromCharCode(byte);
    });
    const base64Audio = btoa(binaryString);

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error generating speech:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
