
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { text, language, exerciseId, audioType } = await req.json();

    if (!text || !language) {
      throw new Error('Text and language are required');
    }
    
    // Define language-specific voice settings
    const voiceSettings = getVoiceSettingsForLanguage(language.toLowerCase());
    
    console.log(`Generating speech for text (length: ${text.length}), using voice: ${voiceSettings.voice}, model: ${voiceSettings.model}`);

    // Split long text into chunks if needed (max 300 chars)
    const textChunks = splitTextIntoChunks(text, 300);
    const audioBuffers = [];

    for (const chunk of textChunks) {
      // Call OpenAI API with language-specific settings
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: voiceSettings.model,
          voice: voiceSettings.voice,
          input: chunk,
          response_format: 'mp3',
          speed: voiceSettings.speed
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, response.statusText);
        console.error('OpenAI API error details:', errorText);
        
        // If the requested model fails, try with tts-1-hd and nova voice as fallback
        if (voiceSettings.model === 'gpt-4o-mini-tts') {
          console.log('Falling back to tts-1-hd model with nova voice');
          const fallbackResponse = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'tts-1-hd',
              voice: 'nova',
              input: chunk,
              response_format: 'mp3',
              speed: voiceSettings.speed
            }),
          });
          
          if (!fallbackResponse.ok) {
            const fallbackErrorText = await fallbackResponse.text();
            throw new Error(`Failed to generate speech with fallback: ${fallbackErrorText}`);
          }
          
          const audioContent = await fallbackResponse.arrayBuffer();
          audioBuffers.push(new Uint8Array(audioContent));
        } else {
          throw new Error(`Failed to generate speech: ${errorText}`);
        }
      } else {
        const audioContent = await response.arrayBuffer();
        audioBuffers.push(new Uint8Array(audioContent));
      }
    }

    // Combine audio chunks if multiple
    let finalAudio;
    if (audioBuffers.length === 1) {
      finalAudio = audioBuffers[0];
    } else {
      finalAudio = concatUint8Arrays(audioBuffers);
    }

    // Store audio file in Supabase storage if exerciseId and audioType are provided
    let audioUrl = null;
    if (exerciseId && audioType) {
      try {
        // Initialize Supabase client with service role key to bypass RLS
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Generate filename
        const filename = `${exerciseId}/${audioType}_${Date.now()}.mp3`;
        
        // Upload audio file directly without checking bucket existence
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('audio')
          .upload(filename, finalAudio, {
            contentType: 'audio/mpeg',
            upsert: true
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          console.log('Proceeding without storage, returning base64 audio only');
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('audio')
            .getPublicUrl(filename);
          
          audioUrl = urlData.publicUrl;
          console.log(`Audio stored successfully: ${audioUrl}`);
        }
      } catch (storageError) {
        console.error('Storage operation failed:', storageError);
        console.log('Proceeding without storage, returning base64 audio only');
      }
    }
    
    // Convert to base64 string safely for backward compatibility
    let binaryString = '';
    finalAudio.forEach(byte => {
      binaryString += String.fromCharCode(byte);
    });
    const base64Audio = btoa(binaryString);

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        audioUrl: audioUrl
      }),
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

// Function to determine voice settings based on language
function getVoiceSettingsForLanguage(language: string) {
  const model = 'gpt-4o-mini-tts'; // Using requested model with fallback
  let voice = 'nova';  // Default voice
  let speed = 1.0;     // Default speed
  
  // Select appropriate voices for each language
  switch (language) {
    case 'english':
      voice = 'nova';  // English voice
      break;
    case 'spanish':
      voice = 'shimmer';  // Spanish voice
      break;
    case 'french':
      voice = 'alloy';  // French voice
      break;
    case 'german':
      voice = 'echo';   // German voice
      break;
    case 'italian':
      voice = 'fable';  // Italian voice
      break;
    case 'portuguese':
      voice = 'shimmer';  // Portuguese voice
      break;
    case 'turkish':
      voice = 'onyx';   // Turkish voice
      break;
    case 'swedish':
      voice = 'nova';   // Swedish voice
      break;
    case 'dutch':
      voice = 'echo';   // Dutch voice
      break;
    case 'norwegian':
      voice = 'alloy';  // Norwegian voice
      break;
    case 'russian':
      voice = 'fable';  // Russian voice
      break;
    case 'polish':
      voice = 'onyx';   // Polish voice
      break;
    case 'chinese':
      voice = 'shimmer';  // Chinese voice
      break;
    case 'japanese':
      voice = 'alloy';  // Japanese voice
      break;
    case 'korean':
      voice = 'echo';   // Korean voice
      break;
    case 'arabic':
      voice = 'nova';   // Arabic voice
      break;
    default:
      voice = 'nova';   // Default to nova for unknown languages
  }
  
  return { model, voice, speed };
}

// Helper function to split text into chunks at logical sentence boundaries
function splitTextIntoChunks(text: string, maxChunkSize: number): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let currentChunk = '';
  
  // Split by sentences (periods, question marks, exclamation points)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  if (sentences.length === 0) {
    // If no sentence breaks, fall back to splitting by comma
    const phrases = text.split(/,\s*/);
    for (const phrase of phrases) {
      if (currentChunk.length + phrase.length + 1 <= maxChunkSize) {
        currentChunk += (currentChunk ? ', ' : '') + phrase;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = phrase;
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk);
    }
  } else {
    // Process sentence by sentence
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length <= maxChunkSize) {
        currentChunk += sentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        
        // If single sentence is too long, split it further
        if (sentence.length > maxChunkSize) {
          const subChunks = splitLongSentence(sentence, maxChunkSize);
          chunks.push(...subChunks);
          currentChunk = '';
        } else {
          currentChunk = sentence;
        }
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk);
    }
  }
  
  return chunks;
}

// Helper to split a long sentence that exceeds max size
function splitLongSentence(sentence: string, maxSize: number): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  
  // Split by commas, conjunctions, or other natural breaks
  const fragments = sentence.split(/,|\sand\s|\sor\s|\sbut\s|\sbecause\s|\swhile\s/);
  
  for (const fragment of fragments) {
    if (currentChunk.length + fragment.length + 2 <= maxSize) {
      currentChunk += (currentChunk ? ', ' : '') + fragment;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      
      // If single fragment still too long, split arbitrarily
      if (fragment.length > maxSize) {
        let i = 0;
        while (i < fragment.length) {
          const end = Math.min(i + maxSize, fragment.length);
          // Try to break at a space if possible
          const breakAt = fragment.substring(i, end).lastIndexOf(' ') + i;
          const chunkEnd = breakAt > i ? breakAt : end;
          chunks.push(fragment.substring(i, chunkEnd));
          i = chunkEnd + 1;
        }
      } else {
        currentChunk = fragment;
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

// Helper function to concatenate Uint8Arrays
function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  // Calculate total length
  const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
  
  // Create new array with combined length
  const result = new Uint8Array(totalLength);
  
  // Copy each array into the result
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  
  return result;
}
